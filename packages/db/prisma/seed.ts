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
  { pageNumber: 1, imageUrl: "/mock-scripts/aiml-page-1.svg", isBlank: false },
  { pageNumber: 2, imageUrl: "/mock-scripts/aiml-page-2.svg", isBlank: false },
  { pageNumber: 3, imageUrl: "/mock-scripts/aiml-page-3.svg", isBlank: false },
  { pageNumber: 4, imageUrl: "/mock-scripts/aiml-page-4.svg", isBlank: false },
  { pageNumber: 5, imageUrl: "/mock-scripts/aiml-page-5.svg", isBlank: true },
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

  const EXAM_NAME = "TYBSc (AI & ML) AI - II Prelim Exam";
  let exam = await prisma.exam.findFirst({
    where: { tenantId: tenant.id, name: EXAM_NAME },
  });
  exam ??= await prisma.exam.create({
    data: {
      tenantId: tenant.id,
      name: EXAM_NAME,
      subjectCode: "AIML-301-MJ-T",
      academicYear: "2026-27",
    },
  });

  let questionPaper = await prisma.questionPaper.findFirst({
    where: { examId: exam.id },
  });
  questionPaper ??= await prisma.questionPaper.create({
    data: { tenantId: tenant.id, examId: exam.id, title: "Prelim Exam September-2026", totalMarks: 35 },
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

  // The paper uses "attempt any N of M" questions. The scoring model only
  // supports "attempt exactly one" (optionGroup), so those are modelled as N
  // answer slots -- the evaluator marks the N answers the student attempted.
  // That keeps each question's max, and the paper total, equal to the printed
  // marks (8 + 8 + 8 + 8 + 3 = 35).
  const answerSlots = (count: number, marksEach: number, what: string): StepDef[] =>
    Array.from({ length: count }, (_, i) => ({
      stepNumber: i + 1,
      description: `Answer ${i + 1} - ${what}`,
      maxMarks: marksEach,
    }));

  const questionDefs: QuestionDef[] = [
    {
      // Q.1 Attempt any EIGHT [8*1=8]
      questionNumber: "Q1",
      maxMarks: 8,
      optionGroup: null,
      steps: answerSlots(8, 1, "correct definition"),
    },
    {
      // Q.2 Attempt any FOUR [4*2=8]
      questionNumber: "Q2",
      maxMarks: 8,
      optionGroup: null,
      steps: answerSlots(4, 2, "correct explanation / example"),
    },
    {
      // Q.3 Attempt any TWO [2*4=8]
      questionNumber: "Q3",
      maxMarks: 8,
      optionGroup: null,
      steps: answerSlots(2, 4, "concept, working and example"),
    },
    {
      // Q.4 Attempt any TWO [2*4=8]
      questionNumber: "Q4",
      maxMarks: 8,
      optionGroup: null,
      steps: answerSlots(2, 4, "concept, working and example"),
    },
    {
      // Q.5 Attempt any ONE [1*3=3] -- (a) theory OR (b) numerical
      questionNumber: "Q5(a)",
      maxMarks: 3,
      optionGroup: "q5-or",
      steps: [
        { stepNumber: 1, description: "Relationship between probability, evidence and decisions explained", maxMarks: 2 },
        { stepNumber: 2, description: "Relevant example / clarity", maxMarks: 1 },
      ],
    },
    {
      questionNumber: "Q5(b)",
      maxMarks: 3,
      optionGroup: "q5-or",
      steps: [
        { stepNumber: 1, description: "HMM transition/observation probabilities set up correctly", maxMarks: 1 },
        { stepNumber: 2, description: "Correct calculation", maxMarks: 1 },
        { stepNumber: 3, description: "Correct final answer", maxMarks: 1 },
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
    update: { totalPages: PAGES.length, examId: exam.id },
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
  const allocation = await prisma.allocation.upsert({
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

  // Marks recorded against an earlier version of the rubric no longer match
  // this paper's questions -- drop them so the evaluator starts clean.
  await prisma.mark.deleteMany({
    where: {
      allocationId: allocation.id,
      rubricStep: { question: { questionPaperId: { not: questionPaper.id } } },
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
    throw err;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
