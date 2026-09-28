import type { AllocationSummary, ExamSummary, UserSummary } from "./types";

export const mockExams: ExamSummary[] = [
  {
    id: "exam-1",
    name: "Class 10 Mathematics",
    subjectCode: "MATH-041",
    academicYear: "2025-26",
    totalScripts: 1240,
    evaluatedScripts: 812,
  },
  {
    id: "exam-2",
    name: "Class 12 Physics",
    subjectCode: "PHY-042",
    academicYear: "2025-26",
    totalScripts: 860,
    evaluatedScripts: 860,
  },
  {
    id: "exam-3",
    name: "Class 10 English",
    subjectCode: "ENG-184",
    academicYear: "2025-26",
    totalScripts: 1500,
    evaluatedScripts: 210,
  },
];

export const mockAllocations: AllocationSummary[] = [
  {
    id: "alloc-1",
    scriptCode: "SC-88213",
    examName: "Class 10 Mathematics",
    evaluatorName: "R. Sharma",
    status: "IN_PROGRESS",
    assignedAt: "2026-09-20",
  },
  {
    id: "alloc-2",
    scriptCode: "SC-88214",
    examName: "Class 10 Mathematics",
    evaluatorName: "R. Sharma",
    status: "SUBMITTED",
    assignedAt: "2026-09-19",
  },
  {
    id: "alloc-3",
    scriptCode: "SC-77012",
    examName: "Class 10 English",
    evaluatorName: "A. Iyer",
    status: "PENDING",
    assignedAt: "2026-09-22",
  },
  {
    id: "alloc-4",
    scriptCode: "SC-77013",
    examName: "Class 10 English",
    evaluatorName: "A. Iyer",
    status: "RETURNED_FOR_REVISION",
    assignedAt: "2026-09-21",
  },
];

export const mockUsers: UserSummary[] = [
  {
    id: "user-1",
    name: "Priya Nair",
    email: "priya.nair@example.edu",
    role: "TENANT_ADMIN",
    isActive: true,
  },
  {
    id: "user-2",
    name: "K. Subramaniam",
    email: "k.subramaniam@example.edu",
    role: "CHIEF_EVALUATOR",
    isActive: true,
  },
  {
    id: "user-3",
    name: "R. Sharma",
    email: "r.sharma@example.edu",
    role: "EVALUATOR",
    isActive: true,
  },
  {
    id: "user-4",
    name: "A. Iyer",
    email: "a.iyer@example.edu",
    role: "EVALUATOR",
    isActive: false,
  },
];
