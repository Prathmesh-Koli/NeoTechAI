import type { Annotation, NewAnnotation, WorkspacePage, WorkspaceQuestion } from "./evaluation-types";
import type { AllocationStatus, AttemptStatus, Role } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface LoginResponse {
  mfaRequired: boolean;
  mfaToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
}

export interface AllocationSummaryResponse {
  id: string;
  scriptCode: string;
  examName: string;
  status: AllocationStatus;
  assignedAt: string;
}

export interface AllocationDetailResponse {
  id: string;
  status: AllocationStatus;
  scriptCode: string;
  examName: string;
  pages: WorkspacePage[];
  questions: WorkspaceQuestion[];
  marks: Record<string, { attemptStatus: AttemptStatus; marksAwarded: number | null }>;
}

export interface ModerationQueueItem {
  id: string;
  type: "PRIMARY" | "REVALUATION";
  status: AllocationStatus;
  submittedAt: string | null;
  evaluator: { id: string; email: string };
  scriptCode: string;
  examName: string;
  totalMarksAwarded: number | null;
}

export interface ModerationMark {
  rubricStepId: string;
  questionNumber: string;
  stepNumber: number;
  description: string;
  maxMarks: number;
  attemptStatus: AttemptStatus;
  marksAwarded: number | null;
}

export interface ModerationDetailResponse {
  id: string;
  type: "PRIMARY" | "REVALUATION";
  status: AllocationStatus;
  submittedAt: string | null;
  evaluator: { id: string; email: string };
  scriptCode: string;
  examName: string;
  subjectCode: string;
  totalMarksAwarded: number | null;
  marks: ModerationMark[];
  annotations: { id: string; scriptPageId: string; type: string; createdAt: string }[];
}

export interface AuditLogEntryResponse {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  performedAt: string;
  performedBy: { id: string; email: string };
}

export interface MarkChange {
  rubricStepId: string;
  attemptStatus: AttemptStatus;
  marksAwarded?: number | null;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Is the backend running?");
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? "Something went wrong");
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (mfaToken: string, code: string) =>
    request<SessionTokens>("/auth/login/verify-otp", {
      method: "POST",
      body: JSON.stringify({ mfaToken, code }),
    }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: (accessToken: string) => request<MeResponse>("/auth/me", {}, accessToken),

  getMyAllocations: (accessToken: string) =>
    request<AllocationSummaryResponse[]>("/allocations/mine", {}, accessToken),

  getAllocationDetail: (accessToken: string, allocationId: string) =>
    request<AllocationDetailResponse>(`/allocations/${allocationId}`, {}, accessToken),

  setPageBlank: (accessToken: string, allocationId: string, pageId: string, isBlank: boolean) =>
    request<{ id: string; isBlank: boolean }>(
      `/allocations/${allocationId}/pages/${pageId}`,
      { method: "PATCH", body: JSON.stringify({ isBlank }) },
      accessToken,
    ),

  addAnnotation: (
    accessToken: string,
    allocationId: string,
    pageId: string,
    annotation: NewAnnotation,
  ) =>
    request<Annotation>(
      `/allocations/${allocationId}/pages/${pageId}/annotations`,
      { method: "POST", body: JSON.stringify(annotation) },
      accessToken,
    ),

  deleteAnnotation: (accessToken: string, allocationId: string, annotationId: string) =>
    request<{ id: string }>(
      `/allocations/${allocationId}/annotations/${annotationId}`,
      { method: "DELETE" },
      accessToken,
    ),

  setMark: (
    accessToken: string,
    allocationId: string,
    rubricStepId: string,
    attemptStatus: AttemptStatus,
    marksAwarded: number | null,
  ) =>
    request<{ rubricStepId: string; attemptStatus: AttemptStatus; marksAwarded: number | null }>(
      `/allocations/${allocationId}/marks/${rubricStepId}`,
      { method: "PATCH", body: JSON.stringify({ attemptStatus, marksAwarded }) },
      accessToken,
    ),

  chooseAlternative: (accessToken: string, allocationId: string, questionId: string) =>
    request<{ optionGroup: string; chosenQuestionId: string }>(
      `/allocations/${allocationId}/questions/${questionId}/choose-alternative`,
      { method: "POST" },
      accessToken,
    ),

  submitAllocation: (accessToken: string, allocationId: string) =>
    request<{ id: string; status: AllocationStatus; totalMarksAwarded: number }>(
      `/allocations/${allocationId}/submit`,
      { method: "POST" },
      accessToken,
    ),

  // --- Chief Evaluator moderation -------------------------------------------

  getModerationQueue: (accessToken: string) =>
    request<ModerationQueueItem[]>("/moderation/allocations", {}, accessToken),

  getModerationDetail: (accessToken: string, allocationId: string) =>
    request<ModerationDetailResponse>(`/moderation/allocations/${allocationId}`, {}, accessToken),

  getModerationAuditLog: (accessToken: string, allocationId: string) =>
    request<AuditLogEntryResponse[]>(
      `/moderation/allocations/${allocationId}/audit-log`,
      {},
      accessToken,
    ),

  adjustModerationMarks: (
    accessToken: string,
    allocationId: string,
    marks: MarkChange[],
    comments?: string,
  ) =>
    request<{ id: string; changed: number; oldTotal: number | null; newTotal: number }>(
      `/moderation/allocations/${allocationId}/marks`,
      { method: "PATCH", body: JSON.stringify({ marks, comments }) },
      accessToken,
    ),

  approveAllocation: (accessToken: string, allocationId: string, comments?: string) =>
    request<{ id: string; status: AllocationStatus }>(
      `/moderation/allocations/${allocationId}/approve`,
      { method: "POST", body: JSON.stringify({ comments }) },
      accessToken,
    ),

  returnAllocation: (accessToken: string, allocationId: string, reason: string) =>
    request<{ id: string; status: AllocationStatus }>(
      `/moderation/allocations/${allocationId}/return`,
      { method: "POST", body: JSON.stringify({ reason }) },
      accessToken,
    ),

  requestRecheck: (accessToken: string, allocationId: string, reason: string) =>
    request<{ id: string; revaluationAllocationId: string; revaluationEvaluatorId: string }>(
      `/moderation/allocations/${allocationId}/recheck`,
      { method: "POST", body: JSON.stringify({ reason }) },
      accessToken,
    ),
};
