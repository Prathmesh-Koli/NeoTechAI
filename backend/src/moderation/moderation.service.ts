import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AttemptStatus, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AdjustMarksDto } from './dto/adjust-marks.dto.js';
import type {
  ApproveDto,
  RequestRecheckDto,
  ReturnForRevisionDto,
} from './dto/moderation-actions.dto.js';

interface MarkSnapshot {
  rubricStepId: string;
  attemptStatus: AttemptStatus;
  marksAwarded: number | null;
}

/**
 * Moderation = the Chief Evaluator reviewing a SUBMITTED evaluation (a
 * PRIMARY or REVALUATION allocation). Every state change and every mark
 * change is written to AuditLog inside the same transaction as the change
 * itself, so there is never a moderation action without an audit entry.
 */
@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Reads ---------------------------------------------------------------

  async getQueue(user: AuthenticatedUser) {
    const allocations = await this.prisma.allocation.findMany({
      where: {
        tenantId: user.tenantId,
        status: 'SUBMITTED',
        OR: [
          // A first-pass evaluation waits for moderation until a recheck has
          // been requested for its script; after that the REVALUATION is the
          // allocation that gets moderated.
          {
            type: 'PRIMARY',
            answerScript: { allocations: { none: { type: 'REVALUATION' } } },
          },
          { type: 'REVALUATION' },
        ],
      },
      orderBy: { submittedAt: 'asc' },
      select: {
        id: true,
        type: true,
        status: true,
        submittedAt: true,
        evaluator: { select: { id: true, email: true } },
        answerScript: {
          select: {
            scriptCode: true,
            totalMarksAwarded: true,
            exam: { select: { name: true } },
          },
        },
      },
    });

    return allocations.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      submittedAt: a.submittedAt,
      evaluator: a.evaluator,
      scriptCode: a.answerScript.scriptCode,
      examName: a.answerScript.exam.name,
      totalMarksAwarded:
        a.answerScript.totalMarksAwarded === null
          ? null
          : Number(a.answerScript.totalMarksAwarded),
    }));
  }

  async getDetail(allocationId: string, user: AuthenticatedUser) {
    const allocation = await this.prisma.allocation.findFirst({
      where: { id: allocationId, tenantId: user.tenantId },
      select: {
        id: true,
        type: true,
        status: true,
        submittedAt: true,
        moderatedById: true,
        // Never expose the whole User row (password hash, TOTP secret).
        evaluator: { select: { id: true, email: true } },
        answerScript: {
          select: {
            scriptCode: true,
            totalMarksAwarded: true,
            exam: { select: { name: true, subjectCode: true } },
          },
        },
        marks: {
          select: {
            rubricStepId: true,
            attemptStatus: true,
            marksAwarded: true,
            rubricStep: {
              select: {
                stepNumber: true,
                description: true,
                maxMarks: true,
                question: { select: { questionNumber: true } },
              },
            },
          },
        },
        annotations: {
          select: {
            id: true,
            scriptPageId: true,
            type: true,
            data: true,
            createdAt: true,
          },
        },
      },
    });

    if (!allocation) throw new NotFoundException('Allocation not found');

    const marks = allocation.marks
      .map((m) => ({
        rubricStepId: m.rubricStepId,
        questionNumber: m.rubricStep.question.questionNumber,
        stepNumber: m.rubricStep.stepNumber,
        description: m.rubricStep.description,
        maxMarks: Number(m.rubricStep.maxMarks),
        attemptStatus: m.attemptStatus,
        marksAwarded: m.marksAwarded === null ? null : Number(m.marksAwarded),
      }))
      .sort(
        (a, b) =>
          a.questionNumber.localeCompare(b.questionNumber, undefined, {
            numeric: true,
          }) || a.stepNumber - b.stepNumber,
      );

    return {
      id: allocation.id,
      type: allocation.type,
      status: allocation.status,
      submittedAt: allocation.submittedAt,
      moderatedById: allocation.moderatedById,
      evaluator: allocation.evaluator,
      scriptCode: allocation.answerScript.scriptCode,
      examName: allocation.answerScript.exam.name,
      subjectCode: allocation.answerScript.exam.subjectCode,
      totalMarksAwarded:
        allocation.answerScript.totalMarksAwarded === null
          ? null
          : Number(allocation.answerScript.totalMarksAwarded),
      marks,
      annotations: allocation.annotations,
    };
  }

  async getAuditLog(allocationId: string, user: AuthenticatedUser) {
    const allocation = await this.prisma.allocation.findFirst({
      where: { id: allocationId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');

    const entries = await this.prisma.auditLog.findMany({
      where: { allocationId, tenantId: user.tenantId },
      orderBy: { performedAt: 'desc' },
      select: {
        id: true,
        action: true,
        metadata: true,
        performedAt: true,
        performedBy: { select: { id: true, email: true } },
      },
    });
    return entries;
  }

  // --- Actions -------------------------------------------------------------

  async adjustMarks(
    allocationId: string,
    user: AuthenticatedUser,
    dto: AdjustMarksDto,
  ) {
    const allocation = await this.getModeratable(allocationId, user);

    const existing = await this.prisma.mark.findMany({
      where: { allocationId, tenantId: user.tenantId },
      include: { rubricStep: { select: { maxMarks: true } } },
    });
    const byStep = new Map(existing.map((m) => [m.rubricStepId, m]));

    const seen = new Set<string>();
    const oldMarks: MarkSnapshot[] = [];
    const newMarks: MarkSnapshot[] = [];

    for (const change of dto.marks) {
      if (seen.has(change.rubricStepId)) {
        throw new BadRequestException(
          `Rubric step ${change.rubricStepId} appears more than once`,
        );
      }
      seen.add(change.rubricStepId);

      const current = byStep.get(change.rubricStepId);
      if (!current) {
        throw new BadRequestException(
          `Rubric step ${change.rubricStepId} has no mark on this allocation`,
        );
      }

      let nextMarks: number | null = null;
      if (change.attemptStatus === 'ATTEMPTED') {
        if (change.marksAwarded === undefined || change.marksAwarded === null) {
          throw new BadRequestException(
            'marksAwarded is required when attemptStatus is ATTEMPTED',
          );
        }
        const max = Number(current.rubricStep.maxMarks);
        if (change.marksAwarded < 0 || change.marksAwarded > max) {
          throw new BadRequestException(
            `Marks for step ${change.rubricStepId} must be between 0 and ${max}`,
          );
        }
        nextMarks = change.marksAwarded;
      } else if (
        change.marksAwarded !== undefined &&
        change.marksAwarded !== null
      ) {
        throw new BadRequestException(
          'marksAwarded must be empty unless attemptStatus is ATTEMPTED',
        );
      }

      const currentMarks =
        current.marksAwarded === null ? null : Number(current.marksAwarded);
      if (
        current.attemptStatus === change.attemptStatus &&
        currentMarks === nextMarks
      ) {
        continue; // no-op, keep the audit trail free of non-changes
      }

      oldMarks.push({
        rubricStepId: current.rubricStepId,
        attemptStatus: current.attemptStatus,
        marksAwarded: currentMarks,
      });
      newMarks.push({
        rubricStepId: current.rubricStepId,
        attemptStatus: change.attemptStatus,
        marksAwarded: nextMarks,
      });
    }

    if (newMarks.length === 0) {
      throw new BadRequestException('No marks were changed');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.requireStillSubmitted(tx, allocation.id, user, {
        moderatedById: user.userId,
      });

      for (const next of newMarks) {
        await tx.mark.update({
          where: {
            allocationId_rubricStepId: {
              allocationId,
              rubricStepId: next.rubricStepId,
            },
          },
          data: {
            attemptStatus: next.attemptStatus,
            marksAwarded: next.marksAwarded,
          },
        });
      }

      // Recompute the denormalized total from the Mark rows (the source of
      // truth), the same way submitting an allocation does.
      const allMarks = await tx.mark.findMany({
        where: { allocationId, tenantId: user.tenantId },
        select: { attemptStatus: true, marksAwarded: true },
      });
      const newTotal = allMarks
        .filter((m) => m.attemptStatus === 'ATTEMPTED')
        .reduce((sum, m) => sum + (m.marksAwarded ? Number(m.marksAwarded) : 0), 0);

      const script = await tx.answerScript.findUniqueOrThrow({
        where: { id: allocation.answerScriptId },
        select: { totalMarksAwarded: true },
      });
      const oldTotal =
        script.totalMarksAwarded === null ? null : Number(script.totalMarksAwarded);

      await tx.answerScript.update({
        where: { id: allocation.answerScriptId },
        data: { totalMarksAwarded: newTotal },
      });

      await this.audit(tx, user, allocation.id, 'MODERATION_MARKS_ADJUSTED', {
        oldMarks: oldMarks as unknown as Prisma.InputJsonValue,
        newMarks: newMarks as unknown as Prisma.InputJsonValue,
        oldTotal,
        newTotal,
        comments: dto.comments ?? null,
      });

      return { id: allocation.id, changed: newMarks.length, oldTotal, newTotal };
    });
  }

  async approve(allocationId: string, user: AuthenticatedUser, dto: ApproveDto) {
    const allocation = await this.getModeratable(allocationId, user);

    return this.prisma.$transaction(async (tx) => {
      await this.requireStillSubmitted(tx, allocation.id, user, {
        status: 'LOCKED',
        lockedAt: new Date(),
        moderatedById: user.userId,
      });
      await tx.answerScript.update({
        where: { id: allocation.answerScriptId },
        data: { status: 'MODERATED' },
      });
      await this.audit(tx, user, allocation.id, 'MODERATION_APPROVED', {
        oldStatus: allocation.status,
        newStatus: 'LOCKED',
        comments: dto.comments ?? null,
      });
      return { id: allocation.id, status: 'LOCKED' as const };
    });
  }

  async returnForRevision(
    allocationId: string,
    user: AuthenticatedUser,
    dto: ReturnForRevisionDto,
  ) {
    const allocation = await this.getModeratable(allocationId, user);

    return this.prisma.$transaction(async (tx) => {
      await this.requireStillSubmitted(tx, allocation.id, user, {
        status: 'RETURNED_FOR_REVISION',
        moderatedById: user.userId,
      });
      await tx.answerScript.update({
        where: { id: allocation.answerScriptId },
        data: { status: 'IN_EVALUATION' },
      });
      await this.audit(tx, user, allocation.id, 'MODERATION_RETURNED', {
        oldStatus: allocation.status,
        newStatus: 'RETURNED_FOR_REVISION',
        reason: dto.reason,
      });
      return { id: allocation.id, status: 'RETURNED_FOR_REVISION' as const };
    });
  }

  /**
   * A recheck never overwrites the original evaluation: it creates a new
   * REVALUATION allocation for a different evaluator, so history is only added
   * to (see the comment on the Allocation model).
   */
  async requestRecheck(
    allocationId: string,
    user: AuthenticatedUser,
    dto: RequestRecheckDto,
  ) {
    const allocation = await this.getModeratable(allocationId, user);

    if (dto.evaluatorId === allocation.evaluatorId) {
      throw new BadRequestException(
        'Choose a different evaluator for the recheck',
      );
    }

    const evaluator = dto.evaluatorId
      ? await this.prisma.user.findFirst({
          where: {
            id: dto.evaluatorId,
            tenantId: user.tenantId,
            role: 'EVALUATOR',
            isActive: true,
          },
          select: { id: true },
        })
      : await this.prisma.user.findFirst({
          where: {
            tenantId: user.tenantId,
            role: 'EVALUATOR',
            isActive: true,
            id: { not: allocation.evaluatorId },
            evaluatorAllocations: {
              none: {
                answerScriptId: allocation.answerScriptId,
                type: 'REVALUATION',
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

    if (!evaluator) {
      throw new BadRequestException(
        dto.evaluatorId
          ? 'That user is not an active evaluator in this tenant'
          : 'No other active evaluator is available; pass evaluatorId',
      );
    }

    const alreadyAssigned = await this.prisma.allocation.findFirst({
      where: {
        answerScriptId: allocation.answerScriptId,
        evaluatorId: evaluator.id,
        type: 'REVALUATION',
      },
      select: { id: true },
    });
    if (alreadyAssigned) {
      throw new ConflictException(
        'That evaluator already has a revaluation for this script',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.requireStillSubmitted(tx, allocation.id, user, {
        moderatedById: user.userId,
      });

      const revaluation = await tx.allocation.create({
        data: {
          tenantId: user.tenantId,
          answerScriptId: allocation.answerScriptId,
          evaluatorId: evaluator.id,
          type: 'REVALUATION',
          status: 'PENDING',
        },
        select: { id: true },
      });

      await tx.answerScript.update({
        where: { id: allocation.answerScriptId },
        data: { status: 'ALLOCATED' },
      });

      await this.audit(tx, user, allocation.id, 'MODERATION_RECHECK_REQUESTED', {
        reason: dto.reason,
        revaluationAllocationId: revaluation.id,
        revaluationEvaluatorId: evaluator.id,
      });
      await this.audit(tx, user, revaluation.id, 'REVALUATION_CREATED', {
        fromAllocationId: allocation.id,
        reason: dto.reason,
      });

      return {
        id: allocation.id,
        revaluationAllocationId: revaluation.id,
        revaluationEvaluatorId: evaluator.id,
      };
    });
  }

  // --- Helpers -------------------------------------------------------------

  /** Loads an allocation the Chief Evaluator may moderate, or throws. */
  private async getModeratable(allocationId: string, user: AuthenticatedUser) {
    const allocation = await this.prisma.allocation.findFirst({
      where: { id: allocationId, tenantId: user.tenantId },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.type === 'MODERATION') {
      throw new BadRequestException('This allocation cannot be moderated');
    }
    if (allocation.status !== 'SUBMITTED') {
      throw new ConflictException(
        'Only submitted evaluations can be moderated',
      );
    }
    return allocation;
  }

  /**
   * Re-checks status inside the transaction (guards against two moderators
   * acting at once) and applies the allocation update in the same statement.
   */
  private async requireStillSubmitted(
    tx: Prisma.TransactionClient,
    allocationId: string,
    user: AuthenticatedUser,
    data: Prisma.AllocationUncheckedUpdateManyInput,
  ) {
    const { count } = await tx.allocation.updateMany({
      where: { id: allocationId, tenantId: user.tenantId, status: 'SUBMITTED' },
      data,
    });
    if (count !== 1) {
      throw new ConflictException(
        'This evaluation was already moderated by someone else',
      );
    }
  }

  private audit(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    allocationId: string,
    action: string,
    metadata: Prisma.InputJsonObject,
  ) {
    return tx.auditLog.create({
      data: {
        tenantId: user.tenantId,
        allocationId,
        action,
        metadata,
        performedById: user.userId,
      },
    });
  }
}
