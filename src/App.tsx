import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Upload,
  User,
  LogOut,
  ChevronRight,
  Video,
  Mic,
  MicOff,
  Volume2,
  FileText,
  Code2,
  Trophy,
  History,
  FileUp,
  BrainCircuit,
  Settings,
  Shield,
  Sun,
  Moon,
  Lock,
  Compass,
  Briefcase,
  Layers,
  CheckCircle,
  HelpCircle,
  Clock,
  Send,
  Camera
} from "lucide-react";
import AIEmotionTracker from "./components/AIEmotionTracker";
import CodingSandbox from "./components/CodingSandbox";
import ReportDashboard from "./components/ReportDashboard";
import { CandidateDetails, InterviewOptions, Question, AnswerFeedback, CodingChallenge, CodeReview, FinalReport, HistoryItem } from "./types";

// Setup speech recognition types safely
const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Auth / Session state
  const [user, setUser] = useState<{ username: string; email: string; avatar: string } | null>(null);
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);

  // Active step flow control
  // Steps: "auth" | "landing" | "setup" | "interview" | "sandbox" | "report" | "history"
  const [currentStep, setCurrentStep] = useState<"auth" | "landing" | "setup" | "interview" | "sandbox" | "report" | "history">("auth");

  // Setup Details
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [pastedResume, setPastedResume] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [options, setOptions] = useState<InterviewOptions>({
    role: "Fullstack Engineer",
    company: "Google",
    difficulty: "Mid-level",
    focusArea: "System Design and React Optimization",
  });

  // Active Interview states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerDraft, setAnswerDraft] = useState("");
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [feedbacksMap, setFeedbacksMap] = useState<Record<number, AnswerFeedback>>({});
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isSetupLoading, setIsSetupLoading] = useState(false);

  // Voice Interaction states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Coding Sandbox states
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [userCodeSolution, setUserCodeSolution] = useState("");
  const [codingFeedback, setCodingFeedback] = useState<CodeReview | null>(null);

  // Report & History state
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  // Load state and history from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("ai_interview_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentStep("landing");
    }

    const savedHistory = localStorage.getItem("ai_interview_history");
    if (savedHistory) {
      setHistoryItems(JSON.parse(savedHistory));
    }

    // Initialize Speech Recognition if supported
    if (SpeechRecognitionImpl) {
      const rec = new SpeechRecognitionImpl();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            transcript += e.results[i][0].transcript + " ";
          }
        }
        if (transcript) {
          setAnswerDraft((prev) => prev + transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setListeningError("Microphone links active. Speak clearly or edit transcript.");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.username || !authForm.email) return;

    const profile = {
      username: authForm.username,
      email: authForm.email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${authForm.username}`,
    };

    localStorage.setItem("ai_interview_user", JSON.stringify(profile));
    setUser(profile);
    setCurrentStep("landing");
  };

  const handleLogout = () => {
    localStorage.removeItem("ai_interview_user");
    setUser(null);
    setCandidate(null);
    setCurrentStep("auth");
  };

  // Convert PDF or Resume to base64, then submit for parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsParsing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch("/api/resume/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64File: base64,
              fileMime: file.type,
              fileName: file.name,
            }),
          });
          const parsed: CandidateDetails = await res.json();
          setCandidate(parsed);
          // Set primary role option based on extracted target
          if (parsed.matchesForRoles?.length > 0) {
            setOptions((prev) => ({ ...prev, role: parsed.matchesForRoles[0] }));
          }
        } catch (err) {
          console.error("Failed to parse via server, generating fallback profile", err);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("PDF upload failure", err);
      setIsParsing(false);
    }
  };

  const loadSampleProfile = (type: "frontend" | "backend" | "ai") => {
    setIsParsing(true);
    let sampleFileName = "resume_frontend_lead.pdf";
    if (type === "backend") sampleFileName = "resume_cloud_backend.pdf";
    if (type === "ai") sampleFileName = "resume_ai_cv_expert.pdf";

    setTimeout(async () => {
      try {
        const res = await fetch("/api/resume/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: sampleFileName, resumeText: "" }),
        });
        const parsed: CandidateDetails = await res.json();
        setCandidate(parsed);
        if (parsed.matchesForRoles?.length > 0) {
          setOptions((prev) => ({ ...prev, role: parsed.matchesForRoles[0] }));
        }
      } catch (err) {
        console.error("Failed parsing sample profile", err);
      } finally {
        setIsParsing(false);
      }
    }, 700);
  };

  // Generate Questions Set
  const handleStartInterview = async () => {
    setIsSetupLoading(true);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateDetails: candidate,
          options,
        }),
      });

      const data = await res.json();
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswersMap({});
      setFeedbacksMap({});
      setAnswerDraft("");
      setCurrentStep("interview");

      // Voice prompt transition trigger
      if (data.questions?.length > 0) {
        setTimeout(() => triggerTextToSpeech(data.questions[0].text), 600);
      }
    } catch (err) {
      console.error("Failed starting session", err);
    } finally {
      setIsSetupLoading(false);
    }
  };

  // Voice Speech: Synthesis (Aloud reader)
  const triggerTextToSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Clears running queues
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      // Select appropriate professional voice if available
      const voices = window.speechSynthesis.getVoices();
      const idealVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))
      );
      if (idealVoice) utterance.voice = idealVoice;
      utterance.rate = 0.95; // professional paced timing

      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice Speech: Dictate Speech-to-Text Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition API is blocked or not supported on this browser context. Try using Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setListeningError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech listener restart interrupted", err);
      }
    }
  };

  // Answer submittal handling
  const handleAnswerSubmit = async () => {
    if (!answerDraft.trim()) return;
    setIsSubmittingAnswer(true);

    const activeQuestion = questions[currentQuestionIndex];
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: activeQuestion.text,
          answerText: answerDraft,
          role: options.role,
        }),
      });

      const evaluation: AnswerFeedback = await res.json();
      
      // Store current answers & feedback indicators
      setAnswersMap((prev) => ({ ...prev, [activeQuestion.id]: answerDraft }));
      setFeedbacksMap((prev) => ({ ...prev, [activeQuestion.id]: evaluation }));
    } catch (err) {
      console.error("Answer evaluation halted", err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    window.speechSynthesis.cancel();
    setAnswerDraft("");
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setTimeout(() => triggerTextToSpeech(questions[nextIdx].text), 400);
    } else {
      // Completed standard voice interview, transition to practical Coding Sandbox Challenge!
      handleSetupCodingChallenge();
    }
  };

  // Retrieve Coding Problem custom-tailored to profile
  const handleSetupCodingChallenge = async () => {
    setIsLoadingChallenge(true);
    setCurrentStep("sandbox");
    try {
      const res = await fetch("/api/interview/coding-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: options.role,
          focusArea: options.focusArea,
        }),
      });
      const challenge: CodingChallenge = await res.json();
      setActiveChallenge(challenge);
    } catch (err) {
      console.error("Failed retrieving problem statements:", err);
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const handleCodingComplete = (code: string, review: CodeReview) => {
    setUserCodeSolution(code);
    setCodingFeedback(review);
  };

  const handleSkipOrProceedToReport = async () => {
    setIsGeneratingReport(true);
    setCurrentStep("report");
    try {
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "sess_" + Date.now(),
          options,
          questions,
          answers: answersMap,
          codingChallenge: activeChallenge,
          userCode: userCodeSolution,
          codingFeedback,
        }),
      });

      const report: FinalReport = await res.json();
      setFinalReport(report);

      // Save to localStorage history database
      const newHistoryItem: HistoryItem = {
        id: "hist_" + Date.now() + "_" + Math.floor(Math.random() * 100),
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        role: options.role,
        company: options.company,
        score: report.overallScore,
        report,
      };

      const updatedHistory = [newHistoryItem, ...historyItems];
      setHistoryItems(updatedHistory);
      localStorage.setItem("ai_interview_history", JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Error synthesizing final report:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setCurrentStep("history");
  };

  const handleResetSession = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswersMap({});
    setFeedbacksMap({});
    setAnswerDraft("");
    setActiveChallenge(null);
    setUserCodeSolution("");
    setCodingFeedback(null);
    setFinalReport(null);
    setCurrentStep("landing");
  };

  const isDark = theme === "dark";

  // Standard interactive CSS configurations based on theme toggler
  const bgClass = isDark 
    ? "bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(15,23,42,0.85),rgba(2,6,23,1))]" 
    : "bg-slate-50 text-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(241,245,249,0.95),rgba(255,255,255,1))]";
    
  const cardClass = isDark 
    ? "bg-slate-900/90 border-slate-800" 
    : "bg-white border-slate-200 shadow-sm";

  const mainHeaderClass = isDark
    ? "border-slate-850 bg-slate-950/80 text-white"
    : "border-slate-200 bg-white/80 text-slate-900";

  const labelClass = isDark ? "text-slate-400" : "text-slate-600";
  const inputClass = isDark 
    ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-500" 
    : "bg-slate-50 border-slate-250 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30";

  const textTitleClass = isDark ? "text-white" : "text-slate-900";
  const textSubClass = isDark ? "text-slate-400" : "text-slate-600";
  const textBodyClass = isDark ? "text-slate-350" : "text-slate-700";

  const btnSecondaryClass = isDark
    ? "bg-slate-950 border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-250"
    : "bg-slate-150 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm";

  const optionBtnClass = (lvl: string) => {
    const isSelected = options.difficulty === lvl;
    if (isSelected) {
      return isDark 
        ? "bg-blue-500/10 border-blue-500 text-blue-400" 
        : "bg-blue-50 border-blue-600 text-blue-600 font-bold";
    } else {
      return isDark 
        ? "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-250" 
        : "bg-slate-50 hover:bg-slate-100/50 border-slate-200 text-slate-600 hover:text-slate-900";
    }
  };

  const navBtnClass = (step: string) => {
    const isActive = currentStep === step;
    if (isActive) {
      return isDark 
        ? "bg-slate-900 border-slate-850 text-blue-400" 
        : "bg-slate-100 border-slate-200 text-blue-650 font-bold";
    } else {
      return isDark 
        ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200" 
        : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30";
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-all duration-300 flex flex-col ${bgClass}`}>
      {/* Header bar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${mainHeaderClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-md font-extrabold tracking-tight flex items-center gap-1.5 font-mono ${textTitleClass}`}>
                AI INTERVIEW COACH
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-normal px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
                  PRO
                </span>
              </h1>
              <p className={`text-[10px] tracking-wide ${isDark ? "text-slate-450" : "text-slate-500"}`}>Next-Gen Audio/Visual Preparation Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 border rounded-xl transition cursor-pointer ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700" 
                  : "bg-slate-100 border-slate-200 text-slate-605 hover:text-slate-900 hover:border-slate-300 shadow-sm"
              }`}
              title="Toggle Appearance"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep("landing")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${navBtnClass("landing")}`}
                >
                  Workspace
                </button>
                <button
                  onClick={() => setCurrentStep("history")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${navBtnClass("history")}`}
                >
                  Session History
                </button>

                <div className={`h-6 w-px ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

                <div className="hidden sm:flex items-center gap-2">
                  <img src={user.avatar} className={`h-7 w-7 rounded-lg border ${isDark ? "border-slate-700" : "border-slate-250"}`} alt="avatar" />
                  <span className={`text-xs font-bold font-mono ${isDark ? "text-slate-200" : "text-slate-850"}`}>{user.username}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 text-red-500 hover:text-red-650 hover:bg-red-500/5 rounded-xl transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* STEP 1: AUTHENTICATION */}
         {currentStep === "auth" && (
           <div className="max-w-md mx-auto pt-12 animate-fade-in">
             <div className={`${cardClass} rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden transition-colors`}>
               <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
 
               <div className="text-center space-y-2">
                 <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500 dark:text-blue-400 mb-2">
                   <Lock className="h-6 w-6" />
                 </div>
                 <h3 className={`text-xl font-extrabold tracking-tight ${textTitleClass}`}>Access Preparation Portal</h3>
                 <p className={`text-xs max-w-xs mx-auto ${textSubClass}`}>
                   Secure local profiles. Your stats stay safely inside local client caches.
                 </p>
               </div>
 
               <form onSubmit={handleAuth} className="space-y-4">
                 <div className="space-y-1.5">
                   <label className={`text-[10px] uppercase font-mono tracking-widest block ${labelClass}`}>Name</label>
                   <input
                     type="text"
                     required
                     value={authForm.username}
                     onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                     placeholder="Enter your name"
                     className={`w-full focus:border-blue-500 text-sm p-3 rounded-xl focus:outline-none transition font-sans ${inputClass}`}
                   />
                 </div>
 
                 <div className="space-y-1.5">
                   <label className={`text-[10px] uppercase font-mono tracking-widest block ${labelClass}`}>Professional Email</label>
                   <input
                     type="email"
                     required
                     value={authForm.email}
                     onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                     placeholder="you@workplace.com"
                     className={`w-full focus:border-blue-500 text-sm p-3 rounded-xl focus:outline-none transition ${inputClass}`}
                   />
                 </div>
 
                 <button
                   type="submit"
                   className="w-full p-3.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 tracking-wide uppercase transition cursor-pointer shadow-lg shadow-blue-500/10 mt-6"
                 >
                   Initialize Candidate Space
                   <ChevronRight className="h-4 w-4" />
                 </button>
               </form>
             </div>
           </div>
         )}

        {/* STEP 2: PROFILE SETUP / DRAG & DROP RESUME */}
        {currentStep === "landing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left: Setup controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className={`${cardClass} rounded-2xl p-6 space-y-4 shadow-xl transition-colors`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider font-mono flex items-center gap-2 ${textTitleClass}`}>
                  <Briefcase className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  Target Specifications
                </h3>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className={`text-[10px] uppercase font-mono tracking-widest block ${labelClass}`}>Applied Job Role</label>
                    <input
                      type="text"
                      value={options.role}
                      onChange={(e) => setOptions({ ...options, role: e.target.value })}
                      className={`w-full text-xs p-3 rounded-xl focus:outline-none transition ${inputClass}`}
                      placeholder="e.g., Senior Fullstack Engineer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] uppercase font-mono tracking-widest block ${labelClass}`}>Target Company Mode</label>
                    <select
                      value={options.company}
                      onChange={(e) => setOptions({ ...options, company: e.target.value })}
                      className={`w-full text-xs p-3 rounded-xl focus:outline-none transition ${inputClass}`}
                    >
                      <option value="Google">Google (Systems & Scaling)</option>
                      <option value="Meta">Meta (Speed & System Design)</option>
                      <option value="Stripe">Stripe (API Design & Detail Core)</option>
                      <option value="Apple">Apple (Security & Client Excellence)</option>
                      <option value="Custom Enterprise">General Enterprise Fit</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] uppercase font-mono tracking-widest block ${labelClass}`}>Candidacy Grade</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Intern", "Junior", "Mid-level", "Senior", "Lead"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setOptions({ ...options, difficulty: lvl })}
                          className={`p-2 rounded-lg text-[11px] font-mono border transition cursor-pointer ${optionBtnClass(lvl)}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] uppercase font-mono tracking-widest block ${labelClass}`}>Focus Specialization Area</label>
                    <input
                      type="text"
                      value={options.focusArea}
                      onChange={(e) => setOptions({ ...options, focusArea: e.target.value })}
                      className={`w-full text-xs p-3 rounded-xl focus:outline-none transition ${inputClass}`}
                      placeholder="e.g., Data Structures or Conflict Resolution"
                    />
                  </div>
                </div>
              </div>

              {candidate && (
                <button
                  onClick={handleStartInterview}
                  disabled={isSetupLoading}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 tracking-widest uppercase transition cursor-pointer shadow-lg hover:scale-[1.01] duration-150 disabled:opacity-50"
                >
                  <Video className="h-4.5 w-4.5 animate-pulse" />
                  {isSetupLoading ? "Configuring AI Panel..." : "Enter Virtual Interview Room"}
                </button>
              )}
            </div>

            {/* Right: Resume parsing and templates */}
            <div className="lg:col-span-8 space-y-6">
              {/* File Drag-and-Drop Area */}
              <div className={`${cardClass} rounded-2xl p-8 text-center relative overflow-hidden shadow-xl space-y-4 transition-colors`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${textTitleClass}`}>
                  Analyze Resume Credentials
                </h3>
                <p className={`text-xs max-w-md mx-auto leading-relaxed ${textSubClass}`}>
                  Drop your Resume in PDF format below. Our server leverages Gemini to automatically extract skills, projects, and educational metadata.
                </p>

                <div className={`border border-dashed hover:border-blue-500/40 p-10 rounded-xl transition flex flex-col items-center justify-center max-w-xl mx-auto cursor-pointer relative group ${
                  isDark 
                    ? "border-slate-800 bg-slate-950/40 text-slate-300" 
                    : "border-slate-300 bg-slate-100/40 text-slate-700"
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileUp className={`h-10 w-10 mb-3 transition ${isDark ? "text-slate-550 group-hover:text-blue-450" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span className="text-xs font-medium">
                    {selectedFile ? selectedFile.name : `Click to choose file or drag PDF here`}
                  </span>
                  <span className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-450"}`}>Accepts PDF format (Max 10MB)</span>
                </div>

                {isParsing && (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-blue-500 dark:text-blue-450 pt-2 animate-pulse">
                    <CogSpinner className="h-4 w-4 animate-spin text-blue-500" />
                    DISSECTION AI PIPELINE ACTIVE... PARSING DATA
                  </div>
                )}
              </div>

              {/* Sample Profiles Quick Selection */}
              {!candidate && !isParsing && (
                <div className={`${cardClass} rounded-2xl p-6 space-y-4 shadow-xl transition-colors`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                    No Resume PDF? Select a Template Pipeline Profile
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => loadSampleProfile("frontend")}
                      className={`p-4 border rounded-xl text-left space-y-2 transition cursor-pointer ${
                        isDark 
                          ? "bg-slate-950 hover:bg-slate-950/80 border-slate-850 hover:border-blue-500/30 text-slate-200" 
                          : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-blue-500/30 text-slate-800"
                      }`}
                    >
                      <h5 className={`font-bold text-xs ${isDark ? "text-slate-200" : "text-slate-900"}`}>Lead Frontend Engineer</h5>
                      <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                        Extracted matching focus: React, system components, memory trees.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadSampleProfile("backend")}
                      className={`p-4 border rounded-xl text-left space-y-2 transition cursor-pointer ${
                        isDark 
                          ? "bg-slate-950 hover:bg-slate-950/80 border-slate-850 hover:border-emerald-500/30 text-slate-200" 
                          : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-emerald-550/30 text-slate-800"
                      }`}
                    >
                      <h5 className={`font-bold text-xs ${isDark ? "text-slate-200" : "text-slate-900"}`}>Cloud Backend Architect</h5>
                      <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                        Focus: Databases scaling, Docker nodes, secure API pipelines.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadSampleProfile("ai")}
                      className={`p-4 border rounded-xl text-left space-y-2 transition cursor-pointer ${
                        isDark 
                          ? "bg-slate-950 hover:bg-slate-950/80 border-slate-850 hover:border-pink-500/30 text-slate-200" 
                          : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-pink-550/30 text-slate-800"
                      }`}
                    >
                      <h5 className={`font-bold text-xs ${isDark ? "text-slate-200" : "text-slate-900"}`}>AI / Computer Vision Engineer</h5>
                      <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                        Focus: OpenCV models, MediaPipe, Deep Learning networks.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Parsed Profile Confirmation */}
              {candidate && (
                <div className={`${cardClass} rounded-2xl p-6 space-y-4 shadow-xl animate-fade-in transition-colors`}>
                  <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                    <div>
                      <h4 className={`font-extrabold text-sm ${textTitleClass}`}>Extracted Profile Metadata</h4>
                      <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono tracking-wide mt-1 block uppercase">Parsing Verification Safe</span>
                    </div>

                    <button
                      onClick={() => {
                        setCandidate(null);
                        setSelectedFile(null);
                      }}
                      className="text-xs text-red-500 dark:text-red-400 font-mono hover:text-red-650 dark:hover:text-red-350 transition cursor-pointer"
                    >
                      Clear File
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-widest block ${isDark ? "text-slate-450" : "text-slate-500"}`}>Candidate Identity</span>
                        <span className={`text-sm font-bold ${isDark ? "text-slate-150" : "text-slate-900"}`}>{candidate.candidateName}</span>
                      </div>

                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-widest block ${isDark ? "text-slate-450" : "text-slate-500"}`}>Eminent Skills Detected</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {candidate.skills.slice(0, 8).map((sk) => (
                            <span key={sk} className={`text-[10px] px-2.5 py-1 rounded border ${isDark ? "bg-slate-950 border-slate-850 text-slate-350" : "bg-slate-100 border-slate-200 text-slate-705"}`}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-widest block ${isDark ? "text-slate-450" : "text-slate-500"}`}>Matches For Roles</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {candidate.matchesForRoles.slice(0, 3).map((r) => (
                            <span key={r} className={`text-[10px] px-2.5 py-1 rounded border ${isDark ? "bg-blue-500/5 border-blue-450/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600 font-mono"}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-widest block ${isDark ? "text-slate-450" : "text-slate-500"}`}>Professional Summary</span>
                        <p className={`text-xs leading-relaxed line-clamp-3 mt-1 ${isDark ? "text-slate-350" : "text-slate-650"}`}>
                          {candidate.professionalSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: VIRTUAL INTERVIEW ROOM */}
        {currentStep === "interview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left: Webcam tracking */}
            <div className="lg:col-span-5 space-y-6">
              <div className="sticky top-20">
                <AIEmotionTracker isActive={currentStep === "interview"} theme={theme} />
              </div>
            </div>

            {/* Right: Dialogue controller */}
            <div className="lg:col-span-7 space-y-6 flex flex-col h-full min-h-[500px]">
              {/* Question metrics progress card */}
              <div className={`${cardClass} p-5 shadow-xl flex items-center justify-between rounded-2xl transition-colors`}>
                <div className="space-y-1">
                  <div className={`text-xs font-mono ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                    SESSION QUESTION {currentQuestionIndex + 1} OF {questions.length}
                  </div>
                  <h4 className={`text-sm font-bold uppercase font-mono tracking-wide ${textTitleClass}`}>
                    Live Panel Evaluation
                  </h4>
                </div>

                <div className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 border ${
                  isDark ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600 font-semibold"
                }`}>
                  <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
                  0{currentQuestionIndex + 1}:00 limit
                </div>
              </div>

              {/* Main Avatar Bubble */}
              <div className={`${cardClass} rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between space-y-6 transition-colors`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Animated interviewer avatar graphic */}
                    <div className="relative">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-blue-500/10">
                        AI
                      </div>
                      {isSpeaking && (
                        <span className="absolute -inset-1 rounded-2xl border-2 border-blue-500 animate-ping opacity-60 pointer-events-none" />
                      )}
                    </div>
                    <div>
                      <h5 className={`text-xs font-bold font-mono leading-none ${isDark ? "text-slate-250" : "text-slate-800"}`}>AI Panel Interviewer</h5>
                      <span className={`text-[10px] tracking-wide font-mono mt-1 block ${isDark ? "text-blue-400" : "text-blue-600 font-semibold"}`}>
                        {isSpeaking ? "Broadcasting Utterance via TTS" : "Awaiting response..."}
                      </span>
                    </div>

                    <button
                      onClick={() => triggerTextToSpeech(questions[currentQuestionIndex].text)}
                      className={`ml-auto p-2 border rounded-xl transition cursor-pointer ${btnSecondaryClass}`}
                      title="Speak Question Aloud"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Interview Question */}
                  <div className={`p-5 rounded-2xl text-[15px] font-semibold leading-relaxed font-sans shadow-inner border transition-colors ${
                    isDark ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-150 text-slate-800"
                  }`}>
                    "{questions[currentQuestionIndex]?.text}"
                  </div>
                </div>

                {/* Answer Draft area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-mono tracking-widest ${isDark ? "text-slate-500" : "text-slate-605 font-bold"}`}>Provide Your response</span>
                    {listeningError && <span className="text-[11px] text-amber-500 dark:text-amber-400 font-mono">{listeningError}</span>}
                  </div>

                  <div className="relative">
                    <textarea
                      value={answerDraft}
                      onChange={(e) => setAnswerDraft(e.target.value)}
                      placeholder="Type your response here or click 'Speak response' to dictate using Speech Recognition..."
                      className={`w-full min-h-[140px] focus:border-blue-500 text-sm p-4 rounded-2xl focus:outline-none transition resize-none pb-12 ${inputClass}`}
                    />

                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        onClick={toggleListening}
                        className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition ${
                          isListening
                            ? "bg-red-500/10 border-red-500 text-red-550 animate-pulse"
                            : isDark 
                              ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-150 hover:border-slate-700"
                              : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-350"
                        }`}
                        title={isListening ? "Pause Listening" : "Speak response"}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {isListening ? "Listening..." : "Dictate"}
                      </button>
                    </div>
                  </div>

                  {/* Response Feedback Details (rendered immediately after submitting) */}
                  {feedbacksMap[questions[currentQuestionIndex]?.id] && (
                    <div className={`p-4 border rounded-xl space-y-3 animate-fade-in ${
                      isDark ? "bg-emerald-950/20 border-emerald-900/40 text-slate-350" : "bg-emerald-50/75 border-emerald-200 text-slate-800 shadow-sm"
                    }`}>
                      <div className={`flex items-center justify-between pb-2 border-b ${isDark ? "border-emerald-900/20" : "border-emerald-200/50"}`}>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          AI Real-time Assessment
                        </div>
                        <span className="text-xs bg-emerald-500/15 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          Evaluation: {feedbacksMap[questions[currentQuestionIndex]?.id].score}/100
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-slate-350" : "text-slate-700"}`}>
                        {feedbacksMap[questions[currentQuestionIndex]?.id].feedback}
                      </p>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentStep("landing")}
                      className={`px-4 py-2 border rounded-xl cursor-pointer transition ${btnSecondaryClass}`}
                    >
                      Pause Prep
                    </button>

                    <div className="flex gap-2">
                      {!feedbacksMap[questions[currentQuestionIndex]?.id] ? (
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={isSubmittingAnswer || !answerDraft.trim()}
                          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                        >
                          {isSubmittingAnswer ? "Evaluating Paces..." : "Submit Response"}
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition hover:scale-[1.01]"
                        >
                          {currentQuestionIndex + 1 < questions.length ? "Assess Next Question" : "Proceed to Coding Practical"}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: HARD LIVE CODING ENVIRONMENT */}
        {currentStep === "sandbox" && (
          <div className="space-y-6 animate-fade-in">
            {/* Split Top Panel */}
            <div className={`${cardClass} rounded-2xl p-6 shadow-xl flex items-center justify-between transition-colors`}>
              <div className="space-y-1">
                <span className="text-xs uppercase font-mono text-emerald-500 font-semibold tracking-wider">
                  PREPARATION STAGE 2 OF 3
                </span>
                <h3 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textTitleClass}`}>
                  <Code2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  Technical Code Sandbox
                </h3>
                <p className={`text-xs max-w-xl ${textSubClass}`}>
                  Solve this customized programmatic interview task using JavaScript or TypeScript. Compiles dynamically with sandbox diagnostics!
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleSkipOrProceedToReport}
                  className={`px-5 py-2.5 border rounded-xl cursor-pointer transition flex items-center gap-1.5 ${btnSecondaryClass}`}
                >
                  Skip Task
                </button>
                
                {codingFeedback && (
                  <button
                    onClick={handleSkipOrProceedToReport}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
                  >
                    Proceed To AI Report
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Split Pane Sandbox Area */}
            {activeChallenge ? (
              <CodingSandbox
                challenge={activeChallenge}
                onComplete={handleCodingComplete}
                isLoadingChallenge={isLoadingChallenge}
                onFetchNewChallenge={handleSetupCodingChallenge}
                theme={theme}
              />
            ) : (
              <div className={`p-12 text-center border rounded-2xl flex flex-col items-center justify-center gap-3 ${cardClass}`}>
                <CogSpinner className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs font-mono uppercase tracking-wide">Compiling Challenging Algorithm Specs...</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: FINAL EVALUATION SUMMARY REPORT */}
        {currentStep === "report" && (
          <div className="space-y-8">
            {isGeneratingReport ? (
              <div className="max-w-md mx-auto py-16 text-center space-y-4">
                <BrainCircuit className="h-10 w-10 text-blue-500 dark:text-blue-400 animate-spin mx-auto" />
                <h3 className={`text-md font-bold uppercase font-mono tracking-widest ${textTitleClass}`}>
                  Synthesizing Comprehensive Feedback
                </h3>
                <p className={`text-xs leading-relaxed max-w-xs mx-auto ${textSubClass}`}>
                  Consolidating voice analytics parameters, code structure review parameters, and emotional expressions scores into an executive roadmap report...
                </p>
              </div>
            ) : finalReport ? (
              <ReportDashboard
                report={finalReport}
                history={historyItems}
                onResetSession={handleResetSession}
                metaDetails={{
                  role: options.role,
                  company: options.company,
                  difficulty: options.difficulty,
                }}
                theme={theme}
              />
            ) : (
              <div className={`text-center p-8 border rounded-2xl ${cardClass}`}>
                Synthesis parameters invalid. Restart another prep loop.
              </div>
            )}
          </div>
        )}

        {/* STEP 6: PRACTICE SESSIONS HISTORY DATABASE */}
        {currentStep === "history" && (
          <div className="space-y-6 animate-fade-in">
            {selectedHistoryItem ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="text-xs text-blue-500 dark:text-blue-400 font-mono flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300 transition cursor-pointer"
                >
                  &larr; Return to sessions list
                </button>
                <ReportDashboard
                  report={selectedHistoryItem.report}
                  history={historyItems}
                  onResetSession={handleResetSession}
                  metaDetails={{
                    role: selectedHistoryItem.role,
                    company: selectedHistoryItem.company,
                    difficulty: "Archived Session",
                  }}
                  theme={theme}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className={`${cardClass} p-6 rounded-2xl shadow-xl space-y-2 transition-colors`}>
                  <h3 className={`text-lg font-extrabold tracking-tight flex items-center gap-2 ${textTitleClass}`}>
                    <History className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                    Historic Preparation Metrics
                  </h3>
                  <p className={`text-xs ${textSubClass}`}>
                    Review and map previous diagnostics curves. Track long-term calibration progress across roles.
                  </p>
                </div>

                {historyItems.length === 0 ? (
                  <div className={`p-12 text-center border rounded-2xl ${cardClass} ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    No historical sessions found. Run your initial evaluation suite to save tracking coordinates.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleViewHistoryItem(item)}
                        className={`border p-5 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition select-none ${
                          isDark 
                            ? "bg-slate-900/40 hover:bg-slate-900 border-slate-855 hover:border-blue-500/20" 
                            : "bg-white hover:bg-slate-100/30 border-slate-200 hover:border-blue-500/30 shadow-none hover:shadow-sm"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <span className={`text-[10px] font-mono block ${isDark ? "text-slate-500" : "text-slate-450"}`}>{item.date}</span>
                          <h4 className={`font-bold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.role} @ {item.company}</h4>
                          <span className={`text-[10px] border px-2 py-0.5 rounded uppercase tracking-wide font-mono ${
                            isDark ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}>
                            Technical corrective summary archived
                          </span>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-mono text-slate-450 block">Score</span>
                            <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400">{item.score}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer credits element */}
      <footer className={`mt-auto border-t py-6 text-center text-[10px] font-mono select-none ${isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-450"}`}>
        PROCTOR MULTIMODAL VERIFY // INTEGRITY ENFORCED SYSTEM // WORKSPACE v2.4
      </footer>
    </div>
  );
}

// Inline helper loader graphic
function CogSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
