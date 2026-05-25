import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { CheckCircle2, ChevronRight, AlertTriangle, Play, Sparkles, Award, RefreshCw, Layers } from "lucide-react";
import { FinalReport, HistoryItem } from "../types";

export default function ReportDashboard({
  report,
  history = [],
  onResetSession,
  metaDetails,
}: {
  report: FinalReport;
  history?: HistoryItem[];
  onResetSession: () => void;
  metaDetails: { role: string; company: string; difficulty: string };
}) {
  const radarData = [
    { subject: "Technical Accuracy", value: report.scores.technical, fullMark: 100 },
    { subject: "Communication Pitch", value: report.scores.communication, fullMark: 100 },
    { subject: "Calmness & Confidence", value: report.scores.confidence, fullMark: 100 },
    { subject: "Problem Solving", value: report.scores.problemSolving, fullMark: 100 },
  ];

  // Map historical scores for timeline visualization
  const sortedHistory = [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item, idx) => ({
      name: `Session ${idx + 1}`,
      rawDate: item.date,
      role: item.role,
      score: item.score,
    }));

  const timelineData = sortedHistory.length > 0
    ? sortedHistory
    : [{ name: "Current Session", score: report.overallScore }];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner Grid Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <Award className="h-3.5 w-3.5" />
            Evaluation Process Complete
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Performance Diagnostics Report
          </h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Your results have been synthesized by our dual-core evaluation engine. Practice modules indicate a high probability of fitment for targeted roles.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">
              Role: <strong className="text-slate-200 font-semibold">{metaDetails.role}</strong>
            </span>
            <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">
              Target: <strong className="text-slate-200 font-semibold">{metaDetails.company}</strong>
            </span>
            <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">
              Grade: <strong className="text-slate-200 font-semibold">{metaDetails.difficulty}</strong>
            </span>
          </div>
        </div>

        {/* Big Overall Gauge Dial */}
        <div className="relative shrink-0 flex items-center justify-center p-4">
          <div className="w-36 h-36 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative shadow-lg shadow-emerald-500/5 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_80%)]">
            <span className="text-xs uppercase font-mono tracking-widest text-slate-500">Overall Score</span>
            <span className="text-4xl font-extrabold text-white mt-1">{report.overallScore}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-medium tracking-wide mt-1">PERCENTILE FIT</span>

            {/* Simulated progress ring border segment */}
            <svg className="absolute -inset-1 w-[152px] h-[152px] -rotate-90 pointer-events-none">
              <circle
                cx="76"
                cy="76"
                r="74"
                stroke="url(#emeraldGlow)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="465"
                strokeDashoffset={465 - (465 * report.overallScore) / 100}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="emeraldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Visual Charts Bento Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competency Mapping Radar */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col h-[350px]">
          <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-slate-400 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            Core Competency Mapping
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#475569" }} />
                <Radar name="Candidate" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profile Progress Timeline */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col h-[350px]">
          <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-slate-400 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Historical Progress Timeline
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreTimelineGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "monospace" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontFamily: "monospace" }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreTimelineGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Structured Strengths, Weaknesses, and Roadmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Qualitative Highlights */}
        <div className="space-y-6">
          {/* Strengths Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-250 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Identified Key Strengths
            </h4>
            <div className="space-y-3">
              {report.strengths.map((strength, index) => (
                <div key={index} className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Growth / Weaknesses */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-250 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Strategic Growth Areas
            </h4>
            <div className="space-y-3">
              {report.weaknesses.map((weakness, index) => (
                <div key={index} className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">{weakness}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tactical Improvement Roadmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-250 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
              Milestone Action Plan
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on algorithmic behavior and solution patterns, our model has designed this personalized learning outline to address target skill deficits.
            </p>

            <div className="space-y-4 pt-2">
              {report.improvementPlan.map((step, index) => (
                <div key={index} className="relative flex gap-4 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      0{index + 1}
                    </div>
                    {index < report.improvementPlan.length - 1 && (
                      <div className="w-0.5 h-12 bg-slate-800" />
                    )}
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex-1">
                    <h5 className="font-bold text-xs text-slate-200 uppercase font-mono">Phase {index + 1} Target</h5>
                    <p className="text-xs text-slate-450 mt-1 leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6 flex justify-end">
            <button
              onClick={onResetSession}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-blue-500/15"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
              Practice Another Session
            </button>
          </div>
        </div>
      </div>

      {/* Synthesis Summary Block */}
      <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl">
        <h4 className="text-xs uppercase tracking-widest font-mono text-slate-550 mb-2">Executive Summary Case Study</h4>
        <p className="text-sm font-medium text-slate-350 leading-relaxed italic">
          "{report.summary}"
        </p>
      </div>
    </div>
  );
}
