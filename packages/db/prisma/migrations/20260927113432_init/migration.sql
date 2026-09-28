-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'CHIEF_EVALUATOR', 'EVALUATOR');

-- CreateEnum
CREATE TYPE "ScriptStatus" AS ENUM ('UPLOADED', 'ALLOCATED', 'IN_EVALUATION', 'EVALUATED', 'MODERATED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AllocationType" AS ENUM ('PRIMARY', 'MODERATION', 'REVALUATION');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED_FOR_REVISION', 'LOCKED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('ATTEMPTED', 'NOT_ATTEMPTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('TICK', 'CROSS', 'BLANK_PAGE', 'NOTE', 'CUSTOM');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "totp_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_papers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "total_marks" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "question_paper_id" TEXT NOT NULL,
    "question_number" TEXT NOT NULL,
    "option_group" TEXT,
    "parent_question_id" TEXT,
    "max_marks" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_steps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "max_marks" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "rubric_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_script_maps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "answer_script_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "student_script_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_scripts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "script_code" TEXT NOT NULL,
    "status" "ScriptStatus" NOT NULL DEFAULT 'UPLOADED',
    "total_pages" INTEGER NOT NULL,
    "total_marks_awarded" DECIMAL(6,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "answer_script_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_blank" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "script_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "answer_script_id" TEXT NOT NULL,
    "evaluator_id" TEXT NOT NULL,
    "moderated_by_id" TEXT,
    "type" "AllocationType" NOT NULL DEFAULT 'PRIMARY',
    "status" "AllocationStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "allocation_id" TEXT NOT NULL,
    "rubric_step_id" TEXT NOT NULL,
    "attempt_status" "AttemptStatus" NOT NULL,
    "marks_awarded" DECIMAL(5,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "script_page_id" TEXT NOT NULL,
    "allocation_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "allocation_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "performed_by_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "exams_tenant_id_idx" ON "exams"("tenant_id");

-- CreateIndex
CREATE INDEX "question_papers_tenant_id_idx" ON "question_papers"("tenant_id");

-- CreateIndex
CREATE INDEX "question_papers_exam_id_idx" ON "question_papers"("exam_id");

-- CreateIndex
CREATE INDEX "questions_tenant_id_idx" ON "questions"("tenant_id");

-- CreateIndex
CREATE INDEX "questions_parent_question_id_idx" ON "questions"("parent_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_question_paper_id_question_number_key" ON "questions"("question_paper_id", "question_number");

-- CreateIndex
CREATE INDEX "rubric_steps_tenant_id_idx" ON "rubric_steps"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rubric_steps_question_id_step_number_key" ON "rubric_steps"("question_id", "step_number");

-- CreateIndex
CREATE INDEX "students_tenant_id_idx" ON "students"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_tenant_id_roll_number_key" ON "students"("tenant_id", "roll_number");

-- CreateIndex
CREATE UNIQUE INDEX "student_script_maps_answer_script_id_key" ON "student_script_maps"("answer_script_id");

-- CreateIndex
CREATE INDEX "student_script_maps_tenant_id_idx" ON "student_script_maps"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "answer_scripts_script_code_key" ON "answer_scripts"("script_code");

-- CreateIndex
CREATE INDEX "answer_scripts_tenant_id_idx" ON "answer_scripts"("tenant_id");

-- CreateIndex
CREATE INDEX "answer_scripts_exam_id_idx" ON "answer_scripts"("exam_id");

-- CreateIndex
CREATE INDEX "script_pages_tenant_id_idx" ON "script_pages"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "script_pages_answer_script_id_page_number_key" ON "script_pages"("answer_script_id", "page_number");

-- CreateIndex
CREATE INDEX "allocations_tenant_id_idx" ON "allocations"("tenant_id");

-- CreateIndex
CREATE INDEX "allocations_evaluator_id_idx" ON "allocations"("evaluator_id");

-- CreateIndex
CREATE INDEX "allocations_status_idx" ON "allocations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_answer_script_id_evaluator_id_type_key" ON "allocations"("answer_script_id", "evaluator_id", "type");

-- CreateIndex
CREATE INDEX "marks_tenant_id_idx" ON "marks"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "marks_allocation_id_rubric_step_id_key" ON "marks"("allocation_id", "rubric_step_id");

-- CreateIndex
CREATE INDEX "annotations_tenant_id_idx" ON "annotations"("tenant_id");

-- CreateIndex
CREATE INDEX "annotations_script_page_id_idx" ON "annotations"("script_page_id");

-- CreateIndex
CREATE INDEX "annotations_allocation_id_idx" ON "annotations"("allocation_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_allocation_id_idx" ON "audit_logs"("allocation_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_paper_id_fkey" FOREIGN KEY ("question_paper_id") REFERENCES "question_papers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_question_id_fkey" FOREIGN KEY ("parent_question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_steps" ADD CONSTRAINT "rubric_steps_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_script_maps" ADD CONSTRAINT "student_script_maps_answer_script_id_fkey" FOREIGN KEY ("answer_script_id") REFERENCES "answer_scripts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_script_maps" ADD CONSTRAINT "student_script_maps_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_scripts" ADD CONSTRAINT "answer_scripts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_pages" ADD CONSTRAINT "script_pages_answer_script_id_fkey" FOREIGN KEY ("answer_script_id") REFERENCES "answer_scripts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_answer_script_id_fkey" FOREIGN KEY ("answer_script_id") REFERENCES "answer_scripts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_rubric_step_id_fkey" FOREIGN KEY ("rubric_step_id") REFERENCES "rubric_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_script_page_id_fkey" FOREIGN KEY ("script_page_id") REFERENCES "script_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
