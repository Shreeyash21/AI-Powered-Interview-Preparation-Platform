export interface CandidateDetails {
  candidateName: string;
  professionalSummary: string;
  skills: string[];
  professionalExperience: {
    role: string;
    company: string;
    duration: string;
    achievements: string[];
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  matchesForRoles: string[];
}

export interface InterviewOptions {
  role: string;
  company: string;
  difficulty: "Junior" | "Mid-level" | "Senior" | "Lead" | "Intern";
  focusArea: string;
}

export interface Question {
  id: number;
  text: string;
  type: "technical" | "behavioral" | "situational" | "system-design";
  category: string;
  focus: string;
}

export interface AnswerFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
  sampleAnswer: string;
}

export interface CodingChallenge {
  title: string;
  difficulty: string;
  description: string;
  initialCode: string;
  testCases: {
    input: string;
    expected: string;
  }[];
}

export interface CodeReview {
  score: number;
  timeComplexity: string;
  spaceComplexity: string;
  reviewSummary: string;
  optimizations: string[];
  fixedCode: string;
}

export interface FinalReport {
  overallScore: number;
  scores: {
    technical: number;
    communication: number;
    confidence: number;
    problemSolving: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvementPlan: string[];
  summary: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  role: string;
  company: string;
  score: number;
  report: FinalReport;
}
