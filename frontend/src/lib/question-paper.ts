// Question paper shown to evaluators alongside the answer script.
// The original .docx is served from /question-papers for download.
export interface QuestionPaperSection {
  number: string;
  instruction: string;
  marksNote: string;
  items: string[];
}

export interface QuestionPaperData {
  institute: string;
  college: string;
  address: string;
  affiliation: string;
  academicYear: string;
  examTitle: string;
  subject: string;
  classInfo: string;
  maxMarks: number;
  instructions: string[];
  sections: QuestionPaperSection[];
  logoUrl: string;
  docxUrl: string;
}

export const questionPaper: QuestionPaperData = {
  institute: "Audyogik Tantra Shikshan Sanstha",
  college: "ATSS College of Business Studies and Computer Application",
  address: "Chinchwad, Pune 19",
  affiliation:
    "Affiliated to Savitribai Phule Pune University, Recognized by Govt. of Maharashtra, Re-accredited by NAAC, UGC recognized under 2(F) & 12(B)",
  academicYear: "Academic Year 2026 – 27 (July 2026 – Oct 2026)",
  examTitle: "Prelim Exam September-2026",
  subject: "AIML-301-MJ-T: Artificial Intelligence – II",
  classInfo: "Class: TYB.Sc.(AI & ML) | Sem: V",
  maxMarks: 35,
  instructions: ["All questions are compulsory.", "Neat diagrams must be drawn wherever necessary."],
  sections: [
    {
      number: "Q.1",
      instruction: "Attempt any EIGHT of the following.",
      marksNote: "8 × 1 = 8",
      items: [
        "Define Naive Bayes.",
        "What is an HMM?",
        "Define Kalman Filter.",
        "What is an MDP?",
        "What is conditional probability?",
        "Define utility function.",
        "What is a Dynamic Bayesian Network?",
        "What is the discount factor?",
        "What is sequential decision-making?",
        "Define uncertainty in AI.",
      ],
    },
    {
      number: "Q.2",
      instruction: "Attempt any FOUR of the following.",
      marksNote: "4 × 2 = 8",
      items: [
        "Explain conditional probability with an example.",
        "Explain the three types of nodes in a Decision Network.",
        "State any two applications of Naive Bayes.",
        "Explain how an AI agent chooses an action using expected utility.",
        "Differentiate between probability and utility.",
      ],
    },
    {
      number: "Q.3",
      instruction: "Attempt any TWO of the following.",
      marksNote: "2 × 4 = 8",
      items: [
        "Explain Bayes’ Rule with a suitable example.",
        "Explain the components of a Markov Decision Process.",
        "Solve a simple numerical problem using Bayes’ Rule.",
      ],
    },
    {
      number: "Q.4",
      instruction: "Attempt any TWO of the following.",
      marksNote: "2 × 4 = 8",
      items: [
        "Explain Value of Information with a suitable example.",
        "Explain the concept of unknown preferences.",
        "Solve a simple numerical problem using the discounted reward concept.",
      ],
    },
    {
      number: "Q.5",
      instruction: "Attempt any ONE of the following.",
      marksNote: "1 × 3 = 3",
      items: [
        "Explain the relationship between probability, evidence and decision-making in AI.",
        "Solve a simple numerical problem based on HMM transition and observation probabilities.",
      ],
    },
  ],
  logoUrl: "/question-papers/college-logo.png",
  docxUrl: "/question-papers/TYBSc-AIML-AI-II-Prelim-QP.docx",
};
