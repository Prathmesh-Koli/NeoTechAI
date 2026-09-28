// Mirrors the enums in packages/db/prisma/schema.prisma. Once the API layer
// exists these should come from the generated Prisma client instead of being
// hand-kept in sync.

export type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "CHIEF_EVALUATOR"
  | "EVALUATOR";

export type ScriptStatus =
  | "UPLOADED"
  | "ALLOCATED"
  | "IN_EVALUATION"
  | "EVALUATED"
  | "MODERATED"
  | "LOCKED";

export type AllocationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "RETURNED_FOR_REVISION"
  | "LOCKED";

export type AttemptStatus = "ATTEMPTED" | "NOT_ATTEMPTED" | "NOT_APPLICABLE";

export interface ExamSummary {
  id: string;
  name: string;
  subjectCode: string;
  academicYear: string;
  totalScripts: number;
  evaluatedScripts: number;
}

export interface AllocationSummary {
  id: string;
  scriptCode: string;
  examName: string;
  evaluatorName: string;
  status: AllocationStatus;
  assignedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}
