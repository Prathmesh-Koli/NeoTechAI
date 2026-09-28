import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Fixed TOTP secret for every seeded user so the demo/dev flow is
// reproducible: `otplib.generate({ secret: DEMO_TOTP_SECRET })` always gives
// the current valid code. Must decode to >= 16 bytes (otplib v13 enforces a
// 128-bit minimum) -- generated via otplib's own generateSecret(). Never do
// this for real tenant data.
const DEMO_TOTP_SECRET = "RJ556ZKFYGDISJJJL3WBKYKIQQMHIJHX";
const DEMO_PASSWORD = "Passw0rd!";

// These SVGs live in frontend/public/mock-scripts -- the frontend serves them
// itself, so the backend just needs to store the same relative path.
const PAGES = [
  { pageNumber: 1, imageUrl: "/mock-scripts/page-1.svg", isBlank: false },
  { pageNumber: 2, imageUrl: "/mock-scripts/page-2.svg", isBlank: false },
  { pageNumber: 3, imageUrl: "/mock-scripts/page-3.svg", isBlank: true },
];
const PAGE_WIDTH = 850;
const PAGE_HEIGHT = 1200;

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const tenant = await prisma.tenant.upsert({
    where: { code: "DEMO" },
    update: {},
    create: { name: "Demo School Board", code: "DEMO" },
  });

  const userDefs: { email: string; role: Role }[] = [
    { email: "admin@demo.edu", role: Role.TENANT_ADMIN },
    { email: "chief@demo.edu", role: Role.CHIEF_EVALUATOR },
    { email: "evaluator1@demo.edu", role: Role.EVALUATOR },
    { email: "evaluator2@demo.edu", role: Role.EVALUATOR },
  ];

  const users = new Map<string, string>(); // email -> id
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        role: u.role,
        totpSecret: DEMO_TOTP_SECRET,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        email: u.email,
        passwordHash,
        role: u.role,
        totpSecret: DEMO_TOTP_SECRET,
        isActive: true,
      },
    });
    users.set(u.email, user.id);
  }

  // --- Exam + question paper + rubric -------------------------------------

  let exam = await prisma.exam.findFirst({
    where: { tenantId: tenant.id, name: "Class 10 Mathematics" },
  });
  exam ??= await prisma.exam.create({
    data: {
      tenantId: tenant.id,
      name: "Class 10 Mathematics",
      subjectCode: "MATH-041",
      academicYear: "2025-26",
    },
  });

  let questionPaper = await prisma.questionPaper.findFirst({
    where: { examId: exam.id },
  });
  questionPaper ??= await prisma.questionPaper.create({
    data: { tenantId: tenant.id, examId: exam.id, title: "Term 2 Question Paper", totalMarks: 10 },
  });

  interface StepDef {
    stepNumber: number;
    description: string;
    maxMarks: number;
  }
  interface QuestionDef {
    questionNumber: string;
    maxMarks: number;
    optionGroup: string | null;
    steps: StepDef[];
  }

  const questionDefs: QuestionDef[] = [
    {
      questionNumber: "Q1",
      maxMarks: 2,
      optionGroup: null,
      steps: [
        { stepNumber: 1, description: "Correct formula/approach identified", maxMarks: 1 },
        { stepNumber: 2, description: "Correct final answer", maxMarks: 1 },
      ],
    },
    {
      questionNumber: "Q2",
      maxMarks: 3,
      optionGroup: null,
      steps: [
        { stepNumber: 1, description: "Full working shown with correct answer", maxMarks: 3 },
      ],
    },
    {
      questionNumber: "Q5(a)",
      maxMarks: 5,
      optionGroup: "q5-or",
      steps: [
        { stepNumber: 1, description: "Correct setup of equations", maxMarks: 2 },
        { stepNumber: 2, description: "Correct method of solving", maxMarks: 2 },
        { stepNumber: 3, description: "Correct final answer with units", maxMarks: 1 },
      ],
    },
    {
      questionNumber: "Q5(b)",
      maxMarks: 5,
      optionGroup: "q5-or",
      steps: [
        { stepNumber: 1, description: "Correct diagram/construction", maxMarks: 2 },
        { stepNumber: 2, description: "Correct proof steps", maxMarks: 2 },
        { stepNumber: 3, description: "Correct conclusion", maxMarks: 1 },
      ],
    },
  ];

  for (const qDef of questionDefs) {
    const question = await prisma.question.upsert({
      where: {
        questionPaperId_questionNumber: {
          questionPaperId: questionPaper.id,
          questionNumber: qDef.questionNumber,
        },
      },
      update: { maxMarks: qDef.maxMarks, optionGroup: qDef.optionGroup },
      create: {
        tenantId: tenant.id,
        questionPaperId: questionPaper.id,
        questionNumber: qDef.questionNumber,
        maxMarks: qDef.maxMarks,
        optionGroup: qDef.optionGroup,
      },
    });

    for (const step of qDef.steps) {
      await prisma.rubricStep.upsert({
        where: {
          questionId_stepNumber: { questionId: question.id, stepNumber: step.stepNumber },
        },
        update: { description: step.description, maxMarks: step.maxMarks },
        create: {
          tenantId: tenant.id,
          questionId: question.id,
          stepNumber: step.stepNumber,
          description: step.description,
          maxMarks: step.maxMarks,
        },
      });
    }
  }

  // --- Student + answer script + pages ------------------------------------

  const student = await prisma.student.upsert({
    where: { tenantId_rollNumber: { tenantId: tenant.id, rollNumber: "10A-014" } },
    update: {},
    create: { tenantId: tenant.id, rollNumber: "10A-014", name: "Demo Student" },
  });

  const answerScript = await prisma.answerScript.upsert({
    where: { scriptCode: "SC-88213" },
    update: {},
    create: {
      tenantId: tenant.id,
      examId: exam.id,
      scriptCode: "SC-88213",
      status: "ALLOCATED",
      totalPages: PAGES.length,
    },
  });

  await prisma.studentScriptMap.upsert({
    where: { answerScriptId: answerScript.id },
    update: {},
    create: { tenantId: tenant.id, answerScriptId: answerScript.id, studentId: student.id },
  });

  for (const page of PAGES) {
    await prisma.scriptPage.upsert({
      where: {
        answerScriptId_pageNumber: {
          answerScriptId: answerScript.id,
          pageNumber: page.pageNumber,
        },
      },
      update: { imageUrl: page.imageUrl, isBlank: page.isBlank },
      create: {
        tenantId: tenant.id,
        answerScriptId: answerScript.id,
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl,
        imageWidth: PAGE_WIDTH,
        imageHeight: PAGE_HEIGHT,
        isBlank: page.isBlank,
      },
    });
  }

  // --- Allocation ----------------------------------------------------------

  const evaluatorId = users.get("evaluator1@demo.edu")!;
  await prisma.allocation.upsert({
    where: {
      answerScriptId_evaluatorId_type: {
        answerScriptId: answerScript.id,
        evaluatorId,
        type: "PRIMARY",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      answerScriptId: answerScript.id,
      evaluatorId,
      type: "PRIMARY",
      status: "PENDING",
    },
  });

  console.log(`Seeded tenant "${tenant.name}" with ${userDefs.length} users.`);
  console.log(`Seeded exam "${exam.name}" with script ${answerScript.scriptCode}, allocated to evaluator1@demo.edu.`);
  console.log(`All users' password: ${DEMO_PASSWORD}`);
  console.log(`All users' TOTP secret: ${DEMO_TOTP_SECRET}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
