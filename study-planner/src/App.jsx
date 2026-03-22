import { useState, useEffect, useRef } from "react";
import { callAI, analyzeNotesWithAI, parseJSON, generateFormulaSheet, generateLearningResources } from "./aiService.js";
import { MUSIC_BY_MOOD, AFTER_STUDY_MUSIC } from "./musicData.js";
import { getCurrentUser, signOut } from "./auth.js";
import Robot from "./Robot.jsx";
import AuthScreen from "./AuthScreen.jsx";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const MOODS = [
  { id: "exhausted", emoji: "😴", label: "Exhausted", color: "#6B7280", desc: "Running on empty" },
  { id: "stressed",  emoji: "😤", label: "Stressed",  color: "#EF4444", desc: "Too much on my plate" },
  { id: "meh",       emoji: "😐", label: "Meh",       color: "#F59E0B", desc: "Just existing" },
  { id: "good",      emoji: "😊", label: "Good",      color: "#10B981", desc: "Ready to go" },
  { id: "energized", emoji: "⚡", label: "Energized", color: "#8B5CF6", desc: "Let's crush it!" },
];

const DEFAULT_SUBJECTS = ["Mathematics", "Physics", "English", "History"];
const FILE_TYPES = {
  "application/pdf": { icon: "📄", label: "PDF" },
  "image/png":  { icon: "🖼️", label: "Image" },
  "image/jpeg": { icon: "🖼️", label: "Image" },
  "text/plain": { icon: "📝", label: "Text" },
};

const PROB_COLOR = (p) => {
  if (p >= 80) return "#EF4444";
  if (p >= 60) return "#F59E0B";
  if (p >= 40) return "#10B981";
  return "#6B7280";
};

// ─────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]           = useState("home");
  const [selectedMood, setSelectedMood] = useState(null);
  const [subjects, setSubjects]       = useState(DEFAULT_SUBJECTS);
  const [newSubject, setNewSubject]   = useState("");
  const [daysLeft, setDaysLeft]       = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [studyPlan, setStudyPlan]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [moodHistory, setMoodHistory] = useState([]);
  const [upcomingExam, setUpcomingExam] = useState("");
  const [notes, setNotes]             = useState("");
  const [animIn, setAnimIn]           = useState(false);

  // File upload
  const [uploadedFiles, setUploadedFiles]   = useState([]);
  const [fileAnalysis, setFileAnalysis]     = useState(null);
  const [analyzingFile, setAnalyzingFile]   = useState(false);
  const [dragOver, setDragOver]             = useState(false);
  const fileInputRef = useRef(null);

  // AI Settings
  const [aiProvider, setAiProvider] = useState("gemini");
  const [claudeKey, setClaudeKey]   = useState("");
  const [geminiKey, setGeminiKey]   = useState("");
  const [showKeys, setShowKeys]     = useState({ claude: false, gemini: false });
  const [apiError, setApiError]     = useState("");

  // Music
  const [musicTab, setMusicTab] = useState("during");

  // Plan detail tab
  const [planTab, setPlanTab] = useState("plan"); // plan | analysis | music | formulas | resources

  // Learning Style
  const [learningStyle, setLearningStyle] = useState(null); // visual | reading | practice

  // Formula Sheet
  const [formulaSheet, setFormulaSheet]     = useState(null);
  const [loadingFormulas, setLoadingFormulas] = useState(false);

  // Learning Resources
  const [learningResources, setLearningResources] = useState(null);
  const [loadingResources, setLoadingResources]   = useState(false);

  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Robot feature tips
  const [featureTip, setFeatureTip] = useState(null);

  const totalHours = daysLeft * hoursPerDay;

  useEffect(() => {
    setAnimIn(true);
    try {
      const s = localStorage.getItem("moodHistory");    if (s) setMoodHistory(JSON.parse(s));
      const sub = localStorage.getItem("subjects");     if (sub) setSubjects(JSON.parse(sub));
      const prov = localStorage.getItem("aiProvider");  if (prov) setAiProvider(prov);
    } catch {}
    const user = getCurrentUser();
    setCurrentUser(user);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    setAnimIn(false);
    const t = setTimeout(() => setAnimIn(true), 60);
    return () => clearTimeout(t);
  }, [screen]);

  const activeKey = aiProvider === "claude" ? claudeKey : geminiKey;

  const saveHistory = (entry) => {
    const updated = [entry, ...moodHistory].slice(0, 30);
    setMoodHistory(updated);
    try { localStorage.setItem("moodHistory", JSON.stringify(updated)); } catch {}
  };

  const saveSubjects = (list) => {
    setSubjects(list);
    try { localStorage.setItem("subjects", JSON.stringify(list)); } catch {}
  };

  const switchProvider = (p) => {
    setAiProvider(p);
    try { localStorage.setItem("aiProvider", p); } catch {}
    setApiError("");
  };

  // ── File Handling ──
  const handleFiles = async (files) => {
    const valid = Array.from(files)
      .filter(f => Object.keys(FILE_TYPES).includes(f.type) || f.name.endsWith(".txt"))
      .slice(0, 3);
    if (!valid.length) return;
    setUploadedFiles(valid);
    setFileAnalysis(null);
    if (activeKey) await runFileAnalysis(valid);
  };

  const runFileAnalysis = async (files) => {
    if (!activeKey) { setApiError("Enter your API key in Settings first."); return; }
    setAnalyzingFile(true);
    setApiError("");
    try {
      const analysis = await analyzeNotesWithAI(aiProvider, activeKey, files);
      setFileAnalysis(analysis);
      if (analysis.detectedSubjects?.length)
        saveSubjects([...new Set([...subjects, ...analysis.detectedSubjects])]);
    } catch (e) {
      setApiError(`Notes analysis failed: ${e.message}`);
      setFileAnalysis({
        detectedSubjects: [], keyTopics: ["Review uploaded content"],
        weakAreas: ["Could not analyze — check your API key"], strongAreas: [],
        difficulty: "Unknown", estimatedCoverage: "Analysis incomplete",
        studyRecommendation: "Review your notes carefully.",
        importantFormulas: [], suggestedTopicsToRevise: ["Full review"],
      });
    }
    setAnalyzingFile(false);
  };

  const removeFile = (idx) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx);
    setUploadedFiles(updated);
    if (!updated.length) setFileAnalysis(null);
    else if (activeKey) runFileAnalysis(updated);
  };

  // ── Formula Sheet ──
  const buildFormulaSheet = async (analysis) => {
    if (!activeKey) return;
    setLoadingFormulas(true);
    try {
      const topics   = [...(analysis?.keyTopics || []), ...(analysis?.suggestedTopicsToRevise || [])];
      const subjs    = analysis?.detectedSubjects?.length ? analysis.detectedSubjects : subjects;
      const raw      = analysis?.importantFormulas || [];
      const result   = await generateFormulaSheet(aiProvider, activeKey, topics, subjs, raw);
      setFormulaSheet(result);
    } catch (e) {
      console.error("Formula sheet failed:", e.message);
    }
    setLoadingFormulas(false);
  };

  // ── Learning Resources ──
  const fetchResources = async (style, analysis) => {
    if (!activeKey || !style) return;
    setLoadingResources(true);
    try {
      const topics   = [...(analysis?.keyTopics || []), ...(analysis?.suggestedTopicsToRevise || [])].slice(0, 8);
      const subs     = analysis?.detectedSubjects || subjects;
      const result   = await generateLearningResources(aiProvider, activeKey, topics, subs, style);
      setLearningResources(result);
    } catch (e) {
      console.error("Resources failed:", e.message);
    }
    setLoadingResources(false);
  };

  // ── Generate Plan ──
  const generatePlan = async () => {
    if (!selectedMood) return;
    if (!activeKey) { setApiError("Enter your API key in Settings first."); setScreen("settings"); return; }
    setLoading(true);
    setApiError("");
    setPlanTab("plan");
    setLoadingMsg(`Analyzing ${totalHours} hours across ${daysLeft} days...`);
    setScreen("plan");

    const moodObj = MOODS.find(m => m.id === selectedMood);
    const fileContext = fileAnalysis ? `
UPLOADED NOTES ANALYSIS:
- Subjects detected: ${fileAnalysis.detectedSubjects?.join(", ")}
- Key topics: ${fileAnalysis.keyTopics?.join(", ")}
- Weak areas: ${fileAnalysis.weakAreas?.join(", ")}
- Strong areas: ${fileAnalysis.strongAreas?.join(", ")}
- Difficulty: ${fileAnalysis.difficulty}
- Recommendation: ${fileAnalysis.studyRecommendation}
- Topics to revise: ${fileAnalysis.suggestedTopicsToRevise?.join(", ")}
- Key formulas: ${fileAnalysis.importantFormulas?.join("; ")}` : "";

    const systemPrompt = "You are an expert AI study coach and exam strategist. Always respond with pure JSON only, no markdown.";

    const userPrompt = `Create a detailed, justified exam preparation plan for this student.

STUDENT PROFILE:
- Mood today: ${moodObj.label} (${moodObj.desc})
- Days left until exam: ${daysLeft} days
- Study hours per day: ${hoursPerDay} hours
- Total study hours available: ${totalHours} hours
- Subjects: ${subjects.join(", ")}
- Upcoming exam: ${upcomingExam || "General exam"}
- Extra notes: ${notes || "None"}
${fileContext}

Return ONLY this JSON (no markdown, no fences, pure JSON, keep all strings short):
{
  "greeting": "Short warm greeting referencing their ${daysLeft} days",
  "moodInsight": "Short insight about their mood and exam prep",
  "examReadiness": "Low / Medium / High / Critical",
  "overallStrategy": "One sentence overall strategy for ${daysLeft} days",
  "coverageAnalysis": {
    "totalTopicsCovered": 7,
    "totalTopicsEstimated": 12,
    "coveragePercent": 58,
    "coverageSummary": "Short summary of what is covered vs remaining"
  },
  "topicProbabilities": [
    {
      "topic": "Topic name",
      "subject": "Subject name",
      "examProbability": 85,
      "priority": "High / Medium / Low",
      "covered": true,
      "justification": "Short reason why this topic is likely in exam"
    }
  ],
  "dailyPlan": [
    {
      "day": 1,
      "theme": "Short day theme",
      "totalHours": ${hoursPerDay},
      "sessions": [
        {
          "subject": "subject",
          "topic": "specific topic",
          "duration": 60,
          "type": "Deep Focus / Revision / Practice / Mock Test",
          "tip": "Short tip"
        }
      ],
      "dayGoal": "One sentence goal for the day",
      "justification": "Why this day focuses on these topics"
    }
  ],
  "breakActivity": "Short break recommendation",
  "motivationalNote": "Short genuine message for ${daysLeft} days left",
  "energyRating": "Low / Medium / High",
  "focusMode": "Single-subject / Switch topics / Micro-sessions",
  "priorityAlert": "The single most critical thing to do today"
}

RULES:
- topicProbabilities: list top 6 topics max, examProbability is 0-100
- dailyPlan: include ALL ${daysLeft} days, each with ${hoursPerDay}h sessions
- Mood rules: exhausted=light revision only; stressed=easiest first; meh=pomodoro; good=focused; energized=hardest first
- Keep all string values short (under 100 chars) to avoid truncation
- coveragePercent based on fileAnalysis if available, else estimate from subjects
${fileAnalysis ? "- Prioritize weak areas and uncovered topics in the daily plan" : ""}`;

    setTimeout(() => setLoadingMsg("Building your day-by-day roadmap..."), 1500);
    setTimeout(() => setLoadingMsg("Calculating exam probabilities..."), 3000);

    try {
      const raw = await callAI(aiProvider, activeKey, userPrompt, systemPrompt);
      const plan = parseJSON(raw);
      setStudyPlan(plan);
      saveHistory({
        mood: selectedMood, emoji: moodObj.emoji, label: moodObj.label,
        days: daysLeft, hoursPerDay, totalHours,
        hasNotes: !!fileAnalysis, provider: aiProvider,
        readiness: plan.examReadiness,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      });

      // Kick off formula sheet + resources in background
      const analysisCtx = fileAnalysis || {
        keyTopics: subjects,
        detectedSubjects: subjects,
        importantFormulas: [],
        suggestedTopicsToRevise: subjects,
      };
      buildFormulaSheet(analysisCtx);
      if (learningStyle) fetchResources(learningStyle, analysisCtx);
    } catch (e) {
      setApiError(`Plan generation failed: ${e.message}`);
      setStudyPlan(null);
      setScreen("checkin");
    }
    setLoading(false);
  };

  const moodObj  = MOODS.find(m => m.id === selectedMood);
  const accent   = moodObj?.color || "#8B5CF6";
  const musicData = selectedMood ? MUSIC_BY_MOOD[selectedMood] : null;
  const afterMusicData = selectedMood ? AFTER_STUDY_MUSIC[selectedMood] : null;

  // ── Styles ──
  const S = {
    app:   { minHeight: "100vh", background: "linear-gradient(135deg, #0d1117 0%, #161b27 50%, #0d1117 100%)", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", position: "relative" },
    orb:   (pos, size, op) => ({ position: "fixed", ...pos, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle, ${accent}${op} 0%, transparent 70%)`, transition: "background 1s ease", pointerEvents: "none", zIndex: 0 }),
    wrap:  { maxWidth: "500px", margin: "0 auto", padding: "20px 18px 60px", position: "relative", zIndex: 1 },
    fade:  { opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(14px)", transition: "all 0.35s ease" },
    card:  { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "18px", marginBottom: "12px" },
    btn:   (color, variant = "solid") => ({ background: variant === "solid" ? color : "transparent", color: variant === "solid" ? "#fff" : color, border: variant === "outline" ? `2px solid ${color}` : "none", borderRadius: "13px", padding: "13px 22px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%", transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif" }),
    moodCard: (id) => { const m = MOODS.find(x => x.id === id); return { background: selectedMood === id ? `${m.color}22` : "rgba(255,255,255,0.04)", border: `2px solid ${selectedMood === id ? m.color : "rgba(255,255,255,0.08)"}`, borderRadius: "14px", padding: "13px 8px", cursor: "pointer", transition: "all 0.2s ease", textAlign: "center", transform: selectedMood === id ? "scale(1.05)" : "scale(1)" }; },
    tag:   (color) => ({ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: "7px", padding: "3px 8px", fontSize: "10px", fontWeight: "600", display: "inline-block" }),
    input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "11px", padding: "11px 14px", color: "#e2e8f0", fontSize: "14px", width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" },
    numInput: { background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "14px 10px", color: "#e2e8f0", fontSize: "22px", fontWeight: "700", width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", textAlign: "center" },
    navBtn: (active) => ({ background: active ? `${accent}22` : "transparent", color: active ? accent : "#64748b", border: "none", borderRadius: "9px", padding: "7px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease", flex: 1 }),
    tabBtn: (active, color = accent) => ({ background: active ? `${color}22` : "transparent", color: active ? color : "#64748b", border: `1px solid ${active ? color + "44" : "transparent"}`, borderRadius: "10px", padding: "8px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease", flex: 1 }),
    dropzone: { border: `2px dashed ${dragOver ? accent : "rgba(255,255,255,0.15)"}`, borderRadius: "14px", padding: "24px 18px", textAlign: "center", cursor: "pointer", background: dragOver ? `${accent}08` : "transparent", transition: "all 0.2s ease" },
    provBtn: (active, color) => ({ background: active ? color : "rgba(255,255,255,0.04)", color: active ? "#fff" : "#94a3b8", border: `2px solid ${active ? color : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", padding: "12px 16px", cursor: "pointer", flex: 1, fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "14px", transition: "all 0.2s ease", textAlign: "center" }),
    probBar: (pct, color) => ({ height: "6px", borderRadius: "3px", background: `${color}22`, overflow: "hidden", marginTop: "6px", children: null }),
  };

  const readinessColor = { Low: "#EF4444", Medium: "#F59E0B", High: "#10B981", Critical: "#8B5CF6" };

  // ── Auth gate ──
  if (!authChecked) return null;
  if (!currentUser) return <AuthScreen onAuth={(user) => setCurrentUser(user)} />;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d1117; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fillBar   { from{width:0} to{width:var(--w)} }
        @keyframes robotFloat  { 0%,100%{transform:translateY(0px) rotate(0deg)} 40%{transform:translateY(-7px) rotate(-1deg)} 70%{transform:translateY(-4px) rotate(1deg)} }
        @keyframes antennaPulse{ 0%,100%{box-shadow:0 0 4px #8B5CF6,0 0 8px rgba(139,92,246,0.4);opacity:1} 50%{box-shadow:0 0 12px #8B5CF6,0 0 24px rgba(139,92,246,0.7);opacity:0.8} }
        @keyframes chestScan   { 0%{transform:translateY(-15px);opacity:0} 50%{opacity:1} 100%{transform:translateY(15px);opacity:0} }
        @keyframes bubblePop   { 0%{transform:scale(0.85) translateY(8px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        a { color: inherit; text-decoration: none; }
        @media print {
          body { background: #fff !important; color: #000 !important; }
          nav, button, .no-print { display: none !important; }
          * { background: transparent !important; color: #000 !important; border-color: #ccc !important; box-shadow: none !important; }
        }
      `}</style>

      <div style={S.app}>
        <div style={S.orb({ top: "-20%", right: "-10%" }, "500px", "18")} />
        <div style={S.orb({ bottom: "-20%", left: "-10%" }, "400px", "10")} />

        <div style={S.wrap}>
          {/* ── Nav ── */}
          <div style={{ display: "flex", gap: "3px", marginBottom: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "13px", padding: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[["home","🏠","Home"],["checkin","🎯","Plan"],["music","🎵","Music"],["history","📊","History"],["settings","⚙️","Settings"]].map(([id,icon,label]) => (
              <button key={id} style={S.navBtn(screen === id || (screen === "plan" && id === "checkin"))} onClick={() => setScreen(id)}>{icon} {label}</button>
            ))}
          </div>

          {!activeKey && screen !== "settings" && (
            <div onClick={() => setScreen("settings")} style={{ ...S.card, borderColor: "#F59E0B44", background: "#F59E0B08", cursor: "pointer", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>⚠️</span>
              <div><div style={{ fontWeight: "600", fontSize: "13px", color: "#F59E0B" }}>API Key Required</div><div style={{ color: "#94a3b8", fontSize: "11px" }}>Tap to add your {aiProvider === "claude" ? "Claude" : "Gemini"} key in Settings</div></div>
            </div>
          )}

          {apiError && (
            <div style={{ ...S.card, borderColor: "#EF444444", background: "#EF444408", marginBottom: "12px" }}>
              <span style={{ color: "#EF4444", fontSize: "12px" }}>❌ {apiError}</span>
            </div>
          )}

          <div style={S.fade}>

            {/* ══ HOME ══ */}
            {screen === "home" && (
              <div>
                <p style={{ color: "#64748b", fontSize: "10px", margin: "0 0 4px", letterSpacing: "2px", textTransform: "uppercase" }}>Your Personal</p>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "36px", fontWeight: "800", margin: "0 0 8px", background: `linear-gradient(135deg, #e2e8f0, ${accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Study Coach</h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 20px", lineHeight: "1.6" }}>Mood + Days left + Notes → AI builds your full exam roadmap with topic probabilities</p>

                <div style={{ ...S.card, borderColor: `${accent}33`, display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "22px" }}>{aiProvider === "claude" ? "🤖" : "✨"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "13px" }}>Using {aiProvider === "claude" ? "Claude AI" : "Gemini AI"}</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>{activeKey ? "✅ Ready to go" : "⚠️ Add key in Settings"}</div>
                  </div>
                  <button onClick={() => setScreen("settings")} style={{ ...S.btn(accent, "outline"), width: "auto", padding: "6px 14px", fontSize: "12px" }}>Switch</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  {[["📅","Day-by-Day Plan","Full roadmap for every day left"],["🎯","Exam Probability","% chance each topic appears"],["📊","Coverage Score","See how much you've covered"],["🎵","Music by Mood","Study & post-study playlists"]].map(([icon,title,desc]) => (
                    <div key={title} style={S.card}><div style={{ fontSize: "20px", marginBottom: "5px" }}>{icon}</div><div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "3px" }}>{title}</div><div style={{ color: "#64748b", fontSize: "11px" }}>{desc}</div></div>
                  ))}
                </div>

                {moodHistory.length > 0 && (
                  <div style={{ ...S.card, marginBottom: "12px" }}>
                    <p style={{ color: "#64748b", fontSize: "10px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "1px" }}>Last Session</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "24px" }}>{moodHistory[0].emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{moodHistory[0].label} · {moodHistory[0].days}d left · {moodHistory[0].hoursPerDay}h/day</div>
                        <div style={{ color: "#64748b", fontSize: "11px" }}>{moodHistory[0].date} · {moodHistory[0].provider === "gemini" ? "✨" : "🤖"}{moodHistory[0].hasNotes ? " · 📎" : ""}{moodHistory[0].readiness ? ` · ${moodHistory[0].readiness} Readiness` : ""}</div>
                      </div>
                    </div>
                  </div>
                )}
                <button style={S.btn(accent)} onClick={() => setScreen("checkin")}>Build My Exam Plan →</button>
              </div>
            )}

            {/* ══ CHECK-IN ══ */}
            {screen === "checkin" && (
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: "800", margin: "0 0 4px" }}>Build Your Exam Plan</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>Tell me your situation → I'll map every day</p>

                {/* Mood */}
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <p style={{ fontWeight: "700", fontSize: "13px", margin: 0 }}>😊 How are you feeling today?</p>
                    <button onClick={() => setFeatureTip("mood")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#64748b" }}>ℹ️</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                    {MOODS.map(mood => (
                      <div key={mood.id} style={{ ...S.moodCard(mood.id), padding: "10px 4px" }} onClick={() => setSelectedMood(mood.id)}>
                        <div style={{ fontSize: "22px", marginBottom: "3px" }}>{mood.emoji}</div>
                        <div style={{ fontWeight: "700", fontSize: "10px", color: selectedMood === mood.id ? mood.color : "#94a3b8" }}>{mood.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days + Hours inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div style={S.card}>
                    <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", marginBottom: "10px", textAlign: "center" }}>📅 Days Left</p>
                    <input type="number" min="1" max="365" value={daysLeft} onChange={e => setDaysLeft(Math.max(1, Number(e.target.value)))} style={S.numInput} />
                    <p style={{ color: "#64748b", fontSize: "10px", marginTop: "6px", textAlign: "center" }}>days before exam</p>
                  </div>
                  <div style={S.card}>
                    <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", marginBottom: "10px", textAlign: "center" }}>⏱️ Hours / Day</p>
                    <input type="number" min="0.5" max="16" step="0.5" value={hoursPerDay} onChange={e => setHoursPerDay(Math.max(0.5, Number(e.target.value)))} style={S.numInput} />
                    <p style={{ color: "#64748b", fontSize: "10px", marginTop: "6px", textAlign: "center" }}>hours per day</p>
                  </div>
                </div>

                {/* Total hours summary */}
                <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}08`, display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: "12px" }}>
                  <div><div style={{ color: accent, fontWeight: "800", fontSize: "24px" }}>{totalHours}h</div><div style={{ color: "#64748b", fontSize: "11px" }}>Total Study Hours</div></div>
                  <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
                  <div><div style={{ color: accent, fontWeight: "800", fontSize: "24px" }}>{daysLeft}</div><div style={{ color: "#64748b", fontSize: "11px" }}>Days Remaining</div></div>
                  <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
                  <div><div style={{ color: accent, fontWeight: "800", fontSize: "24px" }}>{hoursPerDay}h</div><div style={{ color: "#64748b", fontSize: "11px" }}>Per Day</div></div>
                </div>

                {/* File Upload */}
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "13px" }}>📎 Upload Notes (optional)</p>
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "11px" }}>AI reads your files → smarter plan</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {uploadedFiles.length > 0 && <span style={S.tag(accent)}>✓ {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""}</span>}
                      <button onClick={() => setFeatureTip("files")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#64748b" }}>ℹ️</button>
                    </div>
                  </div>

                  {uploadedFiles.length === 0 ? (
                    <div style={S.dropzone} onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>
                      <div style={{ fontSize: "28px", marginBottom: "6px" }}>📂</div>
                      <p style={{ fontWeight: "600", fontSize: "13px", margin: "0 0 3px" }}>Drop files here or tap to browse</p>
                      <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>PDF · PNG · JPG · TXT — up to 3 files</p>
                    </div>
                  ) : (
                    <div>
                      {uploadedFiles.map((f, i) => {
                        const info = FILE_TYPES[f.type] || { icon: "📎", label: "File" };
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "9px", marginBottom: "5px" }}>
                            <span style={{ fontSize: "18px" }}>{info.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: "600", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                              <div style={{ color: "#64748b", fontSize: "10px" }}>{info.label} · {(f.size / 1024).toFixed(0)}KB</div>
                            </div>
                            {analyzingFile ? <span style={{ animation: "pulse 1s infinite", fontSize: "12px" }}>⏳</span> : fileAnalysis ? <span style={{ color: "#10B981", fontSize: "12px" }}>✓</span> : null}
                            <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "14px" }}>✕</button>
                          </div>
                        );
                      })}
                      <button onClick={() => fileInputRef.current?.click()} style={{ ...S.btn(accent, "outline"), padding: "7px", fontSize: "12px", marginTop: "4px" }}>+ Add more</button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt" style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
                </div>

                {analyzingFile && (
                  <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}08`, marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "18px", animation: "spin 2s linear infinite", display: "inline-block" }}>🔍</span>
                      <div><div style={{ fontWeight: "600", fontSize: "13px" }}>Reading your notes...</div><div style={{ color: "#64748b", fontSize: "11px" }}>Extracting topics, weak areas & key facts</div></div>
                    </div>
                  </div>
                )}

                {fileAnalysis && !analyzingFile && (
                  <div style={{ ...S.card, borderColor: "#10B98144", background: "#10B98108", marginBottom: "12px" }}>
                    <p style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "13px", color: "#10B981" }}>✅ Notes Analyzed!</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                      {fileAnalysis.keyTopics?.slice(0, 5).map((t, i) => <span key={i} style={S.tag("#10B981")}>{t}</span>)}
                    </div>
                    {fileAnalysis.weakAreas?.length > 0 && (
                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "10px", color: "#EF4444", fontWeight: "700" }}>⚠️ Needs Attention</p>
                        {fileAnalysis.weakAreas.map((w, i) => <div key={i} style={{ color: "#94a3b8", fontSize: "12px" }}>• {w}</div>)}
                      </div>
                    )}
                  </div>
                )}

                <div style={S.card}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>📝 Exam / Subject Name</label>
                  <input style={S.input} placeholder="e.g. JEE Mains, Class 12 Board, Physics Final..." value={upcomingExam} onChange={e => setUpcomingExam(e.target.value)} />
                </div>

                <div style={S.card}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>💬 Extra context (optional)</label>
                  <textarea style={{ ...S.input, minHeight: "60px", resize: "vertical" }} placeholder="e.g. weak in calculus, haven't started organic chemistry..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                {/* Learning Style Selector */}
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <p style={{ fontWeight: "700", fontSize: "13px", margin: 0 }}>🧠 How do you learn best?</p>
                    <button onClick={() => setFeatureTip("learningStyle")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#64748b" }}>ℹ️</button>
                  </div>
                  <p style={{ color: "#64748b", fontSize: "11px", margin: "0 0 10px" }}>AI will find the right resources for your style</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { id: "visual",   emoji: "🎬", label: "Visual",   desc: "Videos & animations" },
                      { id: "reading",  emoji: "📖", label: "Reading",  desc: "Textbooks & notes" },
                      { id: "practice", emoji: "✏️", label: "Practice", desc: "Problems & quizzes" },
                    ].map(s => (
                      <div key={s.id}
                        onClick={() => setLearningStyle(learningStyle === s.id ? null : s.id)}
                        style={{
                          padding: "10px 6px", borderRadius: "10px", textAlign: "center", cursor: "pointer",
                          border: `1.5px solid ${learningStyle === s.id ? accent : "rgba(255,255,255,0.08)"}`,
                          background: learningStyle === s.id ? `${accent}18` : "rgba(255,255,255,0.03)",
                          transition: "all 0.2s",
                        }}>
                        <div style={{ fontSize: "20px", marginBottom: "3px" }}>{s.emoji}</div>
                        <div style={{ fontWeight: "700", fontSize: "11px", color: learningStyle === s.id ? accent : "#e2e8f0" }}>{s.label}</div>
                        <div style={{ color: "#64748b", fontSize: "10px" }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                  {learningStyle && <p style={{ color: accent, fontSize: "11px", margin: "8px 0 0", textAlign: "center" }}>✓ {learningStyle === "visual" ? "YouTube videos" : learningStyle === "reading" ? "Textbooks & articles" : "Practice problems"} will be curated after plan generation</p>}
                </div>

                <button
                  style={{ ...S.btn(accent), opacity: (selectedMood && !analyzingFile) ? 1 : 0.4, cursor: (selectedMood && !analyzingFile) ? "pointer" : "not-allowed" }}
                  onClick={generatePlan}
                  disabled={!selectedMood || analyzingFile}
                >
                  {analyzingFile ? "⏳ Analyzing files..." : selectedMood ? `Generate ${daysLeft}-Day Plan ${moodObj?.emoji}` : "Select your mood first"}
                </button>
              </div>
            )}

            {/* ══ PLAN ══ */}
            {screen === "plan" && (
              <div>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: "48px", marginBottom: "14px", animation: "spin 2s linear infinite", display: "inline-block" }}>📅</div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", color: accent, margin: "0 0 8px" }}>Mapping your {daysLeft} days...</h3>
                    <p style={{ color: "#64748b" }}>{loadingMsg}</p>
                  </div>
                ) : studyPlan ? (
                  <>
                    {/* Header */}
                    <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}0d` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{ fontSize: "30px" }}>{moodObj?.emoji}</span>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {studyPlan.examReadiness && <span style={{ ...S.tag(readinessColor[studyPlan.examReadiness] || accent) }}>📊 {studyPlan.examReadiness} Readiness</span>}
                          <span style={S.tag(aiProvider === "claude" ? "#8B5CF6" : "#4285F4")}>{aiProvider === "claude" ? "🤖 Claude" : "✨ Gemini"}</span>
                          {fileAnalysis && <span style={S.tag("#10B981")}>📎 Notes</span>}
                        </div>
                      </div>
                      <p style={{ fontWeight: "700", margin: "0 0 5px", fontSize: "14px" }}>{studyPlan.greeting}</p>
                      <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 8px", lineHeight: "1.6" }}>{studyPlan.moodInsight}</p>
                      {studyPlan.overallStrategy && <p style={{ color: accent, fontSize: "12px", margin: 0, fontStyle: "italic" }}>🗺️ {studyPlan.overallStrategy}</p>}
                    </div>

                    {/* Priority alert */}
                    {studyPlan.priorityAlert && (
                      <div style={{ ...S.card, borderColor: "#F59E0B44", background: "#F59E0B08" }}>
                        <p style={{ margin: "0 0 3px", fontSize: "10px", color: "#F59E0B", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>🎯 Do This First Today</p>
                        <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>{studyPlan.priorityAlert}</p>
                      </div>
                    )}

                    {/* Plan Tabs */}
                    <div style={{ display: "flex", gap: "4px", marginBottom: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", flexWrap: "wrap" }}>
                      <button style={S.tabBtn(planTab === "plan")}      onClick={() => setPlanTab("plan")}>📅 Plan</button>
                      <button style={S.tabBtn(planTab === "analysis")}  onClick={() => setPlanTab("analysis")}>📊 Analysis</button>
                      <button style={S.tabBtn(planTab === "formulas")}  onClick={() => setPlanTab("formulas")}>🧪 Formulas</button>
                      {learningStyle && <button style={S.tabBtn(planTab === "resources")} onClick={() => setPlanTab("resources")}>📚 Resources</button>}
                      <button style={S.tabBtn(planTab === "music")}     onClick={() => setPlanTab("music")}>🎵 Music</button>
                    </div>

                    {/* ── TAB: DAY PLAN ── */}
                    {planTab === "plan" && (
                      <>
                        {studyPlan.dailyPlan?.map((day, di) => (
                          <div key={di} style={{ ...S.card, borderLeft: `3px solid ${accent}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <div>
                                <span style={{ fontWeight: "800", fontSize: "14px", color: accent }}>Day {day.day}</span>
                                <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "8px" }}>{day.theme}</span>
                              </div>
                              <span style={S.tag(accent)}>{day.totalHours}h</span>
                            </div>
                            {day.sessions?.map((s, si) => (
                              <div key={si} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: "9px", marginBottom: "5px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                  <div>
                                    <span style={{ fontWeight: "600", fontSize: "12px" }}>{s.subject}</span>
                                    {s.topic && <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "6px" }}>— {s.topic}</span>}
                                  </div>
                                  <span style={{ color: accent, fontWeight: "700", fontSize: "12px" }}>{s.duration}m</span>
                                </div>
                                <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                                  <span style={S.tag(accent)}>{s.type}</span>
                                </div>
                                {s.tip && <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>💡 {s.tip}</p>}
                              </div>
                            ))}
                            {day.dayGoal && <p style={{ margin: "8px 0 3px", fontWeight: "600", fontSize: "12px", color: "#e2e8f0" }}>🎯 {day.dayGoal}</p>}
                            {day.justification && <p style={{ margin: 0, color: "#64748b", fontSize: "11px", fontStyle: "italic" }}>↳ {day.justification}</p>}
                          </div>
                        ))}

                        <div style={S.card}>
                          <p style={{ margin: "0 0 4px", fontWeight: "600", fontSize: "13px" }}>☕ Break Strategy</p>
                          <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>{studyPlan.breakActivity}</p>
                        </div>

                        <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}08` }}>
                          <p style={{ margin: "0 0 3px", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>🌟 Keep Going</p>
                          <p style={{ fontWeight: "600", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>"{studyPlan.motivationalNote}"</p>
                        </div>
                      </>
                    )}

                    {/* ── TAB: ANALYSIS ── */}
                    {planTab === "analysis" && (
                      <>
                        {/* Coverage card */}
                        {studyPlan.coverageAnalysis && (
                          <div style={S.card}>
                            <p style={{ margin: "0 0 10px", fontWeight: "700", fontSize: "13px" }}>📊 Syllabus Coverage</p>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ color: "#94a3b8", fontSize: "13px" }}>{studyPlan.coverageAnalysis.totalTopicsCovered} of {studyPlan.coverageAnalysis.totalTopicsEstimated} topics covered</span>
                              <span style={{ color: accent, fontWeight: "700", fontSize: "16px" }}>{studyPlan.coverageAnalysis.coveragePercent}%</span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: "10px", borderRadius: "5px", background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: "8px" }}>
                              <div style={{ height: "100%", width: `${studyPlan.coverageAnalysis.coveragePercent}%`, background: `linear-gradient(90deg, ${accent}, ${accent}99)`, borderRadius: "5px", transition: "width 1s ease" }} />
                            </div>
                            <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{studyPlan.coverageAnalysis.coverageSummary}</p>
                          </div>
                        )}

                        {/* Topic probabilities */}
                        {studyPlan.topicProbabilities?.length > 0 && (
                          <div style={S.card}>
                            <p style={{ margin: "0 0 12px", fontWeight: "700", fontSize: "13px" }}>🎯 Exam Topic Probabilities</p>
                            {studyPlan.topicProbabilities.map((t, i) => {
                              const c = PROB_COLOR(t.examProbability);
                              return (
                                <div key={i} style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: i < studyPlan.topicProbabilities.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <div>
                                      <span style={{ fontWeight: "700", fontSize: "13px" }}>{t.topic}</span>
                                      <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "6px" }}>{t.subject}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                      {t.covered !== undefined && <span style={S.tag(t.covered ? "#10B981" : "#EF4444")}>{t.covered ? "✓ Done" : "⚠ Pending"}</span>}
                                      <span style={{ color: c, fontWeight: "800", fontSize: "16px", minWidth: "44px", textAlign: "right" }}>{t.examProbability}%</span>
                                    </div>
                                  </div>
                                  {/* Probability bar */}
                                  <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: "5px" }}>
                                    <div style={{ height: "100%", width: `${t.examProbability}%`, background: c, borderRadius: "3px", transition: "width 1s ease" }} />
                                  </div>
                                  <p style={{ color: "#64748b", fontSize: "11px", margin: 0, fontStyle: "italic" }}>↳ {t.justification}</p>
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                              {[["#EF4444","80%+ Very Likely"],["#F59E0B","60–79% Likely"],["#10B981","40–59% Possible"],["#6B7280","Below 40% Unlikely"]].map(([c, label]) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }} />
                                  <span style={{ color: "#64748b", fontSize: "10px" }}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes from upload */}
                        {fileAnalysis && (
                          <div style={S.card}>
                            <p style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "13px" }}>📎 From Your Notes</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                              {fileAnalysis.suggestedTopicsToRevise?.map((t, i) => <span key={i} style={S.tag(accent)}>{t}</span>)}
                            </div>
                            {fileAnalysis.importantFormulas?.length > 0 && fileAnalysis.importantFormulas.map((f, i) => (
                              <div key={i} style={{ color: "#94a3b8", fontSize: "12px", padding: "3px 0", borderBottom: i < fileAnalysis.importantFormulas.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>📌 {f}</div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* ── TAB: FORMULA SHEET ── */}
                    {planTab === "formulas" && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: "800", margin: "0 0 2px" }}>🧪 Formula Sheet</h3>
                            <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>AI-extracted cheat sheet from your topics</p>
                          </div>
                          {formulaSheet?.formulas?.length > 0 && (
                            <button onClick={() => window.print()} style={{ ...S.btn(accent, "outline"), width: "auto", padding: "8px 14px", fontSize: "12px" }}>🖨️ Print</button>
                          )}
                        </div>

                        {loadingFormulas ? (
                          <div style={{ ...S.card, textAlign: "center", padding: "30px" }}>
                            <div style={{ fontSize: "30px", marginBottom: "10px", animation: "spin 2s linear infinite", display: "inline-block" }}>🧮</div>
                            <p style={{ color: "#64748b", margin: 0 }}>Extracting formulas from your topics...</p>
                          </div>
                        ) : formulaSheet?.formulas?.length > 0 ? (
                          <>
                            {/* Group by subject */}
                            {[...new Set(formulaSheet.formulas.map(f => f.subject))].map(subj => (
                              <div key={subj}>
                                <p style={{ color: accent, fontWeight: "700", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", margin: "16px 0 8px" }}>{subj}</p>
                                {formulaSheet.formulas.filter(f => f.subject === subj).map((f, i) => (
                                  <div key={i} style={{ ...S.card, borderLeft: `3px solid ${accent}`, marginBottom: "8px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                      <p style={{ margin: 0, fontWeight: "700", fontSize: "12px", color: "#e2e8f0" }}>{f.name}</p>
                                    </div>
                                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "6px", fontFamily: "monospace", fontSize: "16px", fontWeight: "700", color: accent, letterSpacing: "0.5px" }}>
                                      {f.formula}
                                    </div>
                                    {f.variables && <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: "11px" }}>📐 {f.variables}</p>}
                                    {f.tip && <p style={{ margin: 0, color: "#64748b", fontSize: "11px", fontStyle: "italic" }}>💡 {f.tip}</p>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div style={{ ...S.card, textAlign: "center", padding: "30px" }}>
                            <p style={{ fontSize: "32px", marginBottom: "10px" }}>📭</p>
                            <p style={{ color: "#64748b", margin: 0 }}>No formulas generated yet. Upload notes or generate a plan first.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB: LEARNING RESOURCES ── */}
                    {planTab === "resources" && learningStyle && (
                      <div>
                        <div style={{ marginBottom: "12px" }}>
                          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: "800", margin: "0 0 2px" }}>
                            {learningStyle === "visual" ? "🎬" : learningStyle === "reading" ? "📖" : "✏️"} {learningStyle === "visual" ? "Video" : learningStyle === "reading" ? "Reading" : "Practice"} Resources
                          </h3>
                          <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Curated for your {learningStyle} learning style</p>
                        </div>

                        {/* Style switcher */}
                        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                          {[["visual","🎬","Videos"],["reading","📖","Reading"],["practice","✏️","Practice"]].map(([id, em, label]) => (
                            <button key={id} style={{ ...S.tabBtn(learningStyle === id), flex: 1 }} onClick={() => { setLearningStyle(id); setLearningResources(null); fetchResources(id, fileAnalysis || { keyTopics: subjects, detectedSubjects: subjects }); }}>{em} {label}</button>
                          ))}
                        </div>

                        {learningResources?.styleAdvice && (
                          <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}08`, marginBottom: "12px" }}>
                            <p style={{ margin: 0, color: accent, fontSize: "12px", fontStyle: "italic" }}>💡 {learningResources.styleAdvice}</p>
                          </div>
                        )}

                        {loadingResources ? (
                          <div style={{ ...S.card, textAlign: "center", padding: "30px" }}>
                            <div style={{ fontSize: "30px", marginBottom: "10px", animation: "spin 2s linear infinite", display: "inline-block" }}>
                              {learningStyle === "visual" ? "🎬" : learningStyle === "reading" ? "📖" : "✏️"}
                            </div>
                            <p style={{ color: "#64748b", margin: 0 }}>Finding the best {learningStyle} resources for your topics...</p>
                          </div>
                        ) : learningResources?.resources?.length > 0 ? (
                          <>
                            {[...new Set(learningResources.resources.map(r => r.subject))].map(subj => (
                              <div key={subj}>
                                <p style={{ color: accent, fontWeight: "700", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", margin: "16px 0 8px" }}>{subj}</p>
                                {learningResources.resources.filter(r => r.subject === subj).map((r, i) => (
                                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", ...S.card, cursor: "pointer", marginBottom: "8px", borderLeft: `3px solid ${accent}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "12px", color: "#e2e8f0" }}>
                                          {r.type === "youtube" ? "▶️" : r.type === "practice" ? "✏️" : "📄"} {r.title}
                                        </p>
                                        <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "11px" }}>{r.topic}</p>
                                      </div>
                                      <span style={{ ...S.tag(accent), marginLeft: "8px", flexShrink: 0 }}>{r.difficulty}</span>
                                    </div>
                                    <p style={{ margin: 0, color: "#94a3b8", fontSize: "11px" }}>{r.description}</p>
                                    <p style={{ margin: "4px 0 0", color: accent, fontSize: "11px" }}>Open ↗</p>
                                  </a>
                                ))}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div style={{ ...S.card, textAlign: "center", padding: "30px" }}>
                            <p style={{ fontSize: "32px", marginBottom: "10px" }}>📭</p>
                            <p style={{ color: "#64748b", margin: 0 }}>No resources yet. Generate your plan first.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB: MUSIC ── */}
                    {planTab === "music" && musicData && (
                      <>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px" }}>
                          <button style={S.tabBtn(musicTab === "during")} onClick={() => setMusicTab("during")}>🎧 While Studying</button>
                          <button style={S.tabBtn(musicTab === "after")}  onClick={() => setMusicTab("after")}>🎉 After Studying</button>
                        </div>

                        {musicTab === "during" && (
                          <>
                            <div style={S.card}>
                              <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "14px" }}>{musicData.title}</p>
                              <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 10px" }}>{musicData.subtitle}</p>
                              {musicData.playlists.map((p, i) => (
                                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px", background: "rgba(255,255,255,0.04)", borderRadius: "9px", marginBottom: "5px" }}>
                                  <span style={{ fontSize: "20px" }}>{p.icon}</span>
                                  <div style={{ flex: 1 }}><div style={{ fontWeight: "600", fontSize: "13px" }}>{p.name}</div><div style={{ color: "#64748b", fontSize: "11px" }}>{p.platform} · {p.genre}</div></div>
                                  <span style={{ color: accent }}>↗</span>
                                </a>
                              ))}
                            </div>
                            <div style={S.card}>
                              <p style={{ margin: "0 0 8px", fontWeight: "600", fontSize: "12px" }}>💡 Tips</p>
                              {musicData.tips.map((t, i) => <div key={i} style={{ color: "#94a3b8", fontSize: "12px", padding: "3px 0" }}>{t}</div>)}
                            </div>
                          </>
                        )}

                        {musicTab === "after" && afterMusicData && (
                          <>
                            <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}08` }}>
                              <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "14px" }}>{afterMusicData.title}</p>
                              <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{afterMusicData.desc}</p>
                            </div>
                            {afterMusicData.suggestions.map((s, i) => (
                              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", ...S.card, cursor: "pointer" }}>
                                <span style={{ fontSize: "22px" }}>{s.icon}</span>
                                <div style={{ flex: 1 }}><div style={{ fontWeight: "600", fontSize: "13px" }}>{s.name}</div><div style={{ color: "#64748b", fontSize: "11px" }}>YouTube ↗</div></div>
                                <span style={{ color: accent }}>↗</span>
                              </a>
                            ))}
                          </>
                        )}
                      </>
                    )}

                    <button style={{ ...S.btn(accent, "outline"), marginTop: "8px" }} onClick={() => { setScreen("checkin"); setStudyPlan(null); }}>← New Plan</button>
                  </>
                ) : null}
              </div>
            )}

            {/* ══ MUSIC ══ */}
            {screen === "music" && (
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: "800", margin: "0 0 4px" }}>🎵 Music Guide</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>Mood-matched playlists for study & after</p>
                {!selectedMood ? (
                  <div style={{ ...S.card, textAlign: "center", padding: "32px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎵</div>
                    <p style={{ color: "#64748b", marginBottom: "12px" }}>Select a mood in Check-In to get personalised music!</p>
                    <button style={S.btn(accent)} onClick={() => setScreen("checkin")}>Go to Check-In</button>
                  </div>
                ) : (
                  <>
                    <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}0d`, display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "28px" }}>{moodObj.emoji}</span>
                      <div><div style={{ fontWeight: "700" }}>Mood: {moodObj.label}</div><div style={{ color: accent, fontSize: "12px" }}>{musicData?.vibe}</div></div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px" }}>
                      <button style={S.tabBtn(musicTab === "during")} onClick={() => setMusicTab("during")}>🎧 While Studying</button>
                      <button style={S.tabBtn(musicTab === "after")}  onClick={() => setMusicTab("after")}>🎉 After Studying</button>
                    </div>
                    {musicTab === "during" && musicData && (
                      <>
                        <div style={S.card}>
                          <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "14px" }}>{musicData.title}</p>
                          <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 10px" }}>{musicData.subtitle}</p>
                          {musicData.playlists.map((p, i) => (
                            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px", background: "rgba(255,255,255,0.04)", borderRadius: "9px", marginBottom: "5px" }}>
                              <span style={{ fontSize: "20px" }}>{p.icon}</span>
                              <div style={{ flex: 1 }}><div style={{ fontWeight: "600", fontSize: "13px" }}>{p.name}</div><div style={{ color: "#64748b", fontSize: "11px" }}>{p.platform} · {p.genre}</div></div>
                              <span style={{ color: accent }}>↗</span>
                            </a>
                          ))}
                        </div>
                        <div style={S.card}>
                          <p style={{ margin: "0 0 6px", fontWeight: "600", fontSize: "12px" }}>🎤 Artists to Try</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {musicData.artists.map((a, i) => (
                              <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(a + " study music")}`} target="_blank" rel="noopener noreferrer" style={{ ...S.tag(accent), cursor: "pointer" }}>{a}</a>
                            ))}
                          </div>
                        </div>
                        <div style={S.card}>
                          {musicData.tips.map((t, i) => <div key={i} style={{ color: "#94a3b8", fontSize: "12px", padding: "3px 0" }}>{t}</div>)}
                        </div>
                      </>
                    )}
                    {musicTab === "after" && afterMusicData && (
                      <>
                        <div style={{ ...S.card, borderColor: `${accent}44`, background: `${accent}08` }}>
                          <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "14px" }}>{afterMusicData.title}</p>
                          <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{afterMusicData.desc}</p>
                        </div>
                        {afterMusicData.suggestions.map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", ...S.card, cursor: "pointer" }}>
                            <span style={{ fontSize: "22px" }}>{s.icon}</span>
                            <div style={{ flex: 1 }}><div style={{ fontWeight: "600", fontSize: "13px" }}>{s.name}</div><div style={{ color: "#64748b", fontSize: "11px" }}>YouTube ↗</div></div>
                            <span style={{ color: accent }}>↗</span>
                          </a>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══ HISTORY ══ */}
            {screen === "history" && (
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: "800", margin: "0 0 4px" }}>Session History</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>Track your patterns over time</p>
                {moodHistory.length === 0 ? (
                  <div style={{ ...S.card, textAlign: "center", padding: "36px" }}>
                    <div style={{ fontSize: "38px", marginBottom: "10px" }}>📊</div>
                    <p style={{ color: "#64748b", marginBottom: "12px" }}>No history yet.</p>
                    <button style={S.btn(accent)} onClick={() => setScreen("checkin")}>Start Planning</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", marginBottom: "14px" }}>
                      {MOODS.map(m => {
                        const count = moodHistory.filter(h => h.mood === m.id).length;
                        return <div key={m.id} style={{ ...S.card, textAlign: "center", padding: "10px 4px" }}><div>{m.emoji}</div><div style={{ fontWeight: "700", color: m.color, fontSize: "16px" }}>{count}</div><div style={{ fontSize: "9px", color: "#64748b" }}>{m.label}</div></div>;
                      })}
                    </div>
                    {moodHistory.map((e, i) => (
                      <div key={i} style={S.card}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "22px" }}>{e.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "600", fontSize: "13px" }}>{e.label} · {e.days}d · {e.hoursPerDay}h/day · {e.totalHours}h total</div>
                            <div style={{ color: "#64748b", fontSize: "11px" }}>{e.date} · {e.provider === "gemini" ? "✨" : "🤖"}{e.hasNotes ? " · 📎" : ""}{e.readiness ? ` · ${e.readiness}` : ""}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button style={S.btn("#EF4444", "outline")} onClick={() => { setMoodHistory([]); try { localStorage.removeItem("moodHistory"); } catch {} }}>Clear History</button>
                  </>
                )}
              </div>
            )}

            {/* ══ SETTINGS ══ */}
            {screen === "settings" && (
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: "800", margin: "0 0 4px" }}>⚙️ Settings</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>Choose your AI and add your key</p>
                <div style={S.card}>
                  <p style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", marginBottom: "10px" }}>🤖 AI Provider</p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button style={S.provBtn(aiProvider === "claude", "#8B5CF6")} onClick={() => switchProvider("claude")}><div style={{ fontSize: "20px", marginBottom: "3px" }}>🤖</div><div>Claude AI</div><div style={{ fontSize: "10px", opacity: 0.7 }}>Anthropic</div></button>
                    <button style={S.provBtn(aiProvider === "gemini", "#4285F4")} onClick={() => switchProvider("gemini")}><div style={{ fontSize: "20px", marginBottom: "3px" }}>✨</div><div>Gemini AI</div><div style={{ fontSize: "10px", opacity: 0.7 }}>Google · Free</div></button>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>🤖 Claude Key</label>
                    <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ ...S.tag("#8B5CF6"), cursor: "pointer" }}>Get Key ↗</a>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input style={{ ...S.input, flex: 1, fontFamily: "monospace", fontSize: "12px" }} type={showKeys.claude ? "text" : "password"} placeholder="sk-ant-api03-..." value={claudeKey} onChange={e => { setClaudeKey(e.target.value); setApiError(""); }} />
                    <button onClick={() => setShowKeys(p => ({ ...p, claude: !p.claude }))} style={{ ...S.btn("#64748b", "outline"), width: "auto", padding: "10px 14px" }}>{showKeys.claude ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>✨ Gemini Key</label>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ ...S.tag("#4285F4"), cursor: "pointer" }}>Get Key ↗</a>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input style={{ ...S.input, flex: 1, fontFamily: "monospace", fontSize: "12px" }} type={showKeys.gemini ? "text" : "password"} placeholder="AIza..." value={geminiKey} onChange={e => { setGeminiKey(e.target.value); setApiError(""); }} />
                    <button onClick={() => setShowKeys(p => ({ ...p, gemini: !p.gemini }))} style={{ ...S.btn("#64748b", "outline"), width: "auto", padding: "10px 14px" }}>{showKeys.gemini ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div style={{ ...S.card, borderColor: "#F59E0B22", background: "#F59E0B06" }}>
                  <p style={{ margin: "0 0 3px", fontWeight: "600", fontSize: "13px", color: "#F59E0B" }}>🔒 Privacy</p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>Keys are in-memory only. Cleared when you close the tab. Never stored on any server.</p>
                </div>

                {/* Account */}
                <div style={S.card}>
                  <p style={{ margin: "0 0 10px", fontWeight: "600", fontSize: "13px", color: "#94a3b8" }}>👤 Account</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "14px" }}>@{currentUser.username}</p>
                      <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>Signed in on this device</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setCurrentUser(null); }}
                      style={{ ...S.btn("#EF4444", "outline"), width: "auto", padding: "8px 16px", fontSize: "12px" }}
                    >Sign Out</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── StudyBot Robot ── */}
      <Robot
        currentUser={currentUser}
        featureTip={featureTip}
        setFeatureTip={setFeatureTip}
      />
    </>
  );
}