import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getPendingAllocations() {
    return (this.prisma.allocation.findMany as any)({
      where: {
        type: 'MODERATION',
        status: { in: ['SUBMITTED'] },
      },
      include: {
        evaluator: true,
        answerScript: {
          include: {
            marks: true,
          },
        },
      },
    });
  }

  async getScriptDetails(allocationId: string) {
    const allocation = await (this.prisma.allocation.findUnique as any)({
      where: { id: allocationId },
      include: {
        answerScript: {
          include: {
            pages: true,
            annotations: true,
            marks: true,
          },
        },
        evaluator: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Allocation not found');
    }

    return allocation;
  }

  async performAction(
    allocationId: string,
    userId: string,
    action: 'APPROVE' | 'RETURN' | 'RECHECK' | 'ADJUST_MARKS',
    payload: { marks?: any; comments?: string; reason?: string }
  ) {
    const allocation = await (this.prisma.allocation.findUnique as any)({
      where: { id: allocationId },
    });

    if (!allocation) {
      throw new NotFoundException('Allocation not found');
    }

    let newStatus: any = allocation.status;
    if (action === 'APPROVE') newStatus = 'APPROVED';
    if (action === 'RETURN') newStatus = 'RETURNED_FOR_REVISION';
    if (action === 'RECHECK') newStatus = 'REVALUATION_REQUESTED';

    const result = await this.prisma.$transaction(async (tx: any) => {
      const updatedAllocation = await tx.allocation.update({
        where: { id: allocationId },
        data: {
          status: newStatus,
          moderatedById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: `MODERATION_${action}`,
          details: JSON.stringify({
            allocationId,
            answerScriptId: allocation.answerScriptId,
            comments: payload.comments || payload.reason || '',
            marksChanged: payload.marks || null,
          }),
        },
      });

      return updatedAllocation;
    });

    return { 
      success: true, 
      status: result.status, 
      message: `Action ${action} executed successfully` 
    };
  }
}