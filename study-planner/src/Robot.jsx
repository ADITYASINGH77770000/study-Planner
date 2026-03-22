// ─────────────────────────────────────────────
//  StudyBot — Cute Floating AI Robot
//  Matches reference: round egg body, wide dark
//  visor with glowing cyan eyes, hovering style
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";

export const FEATURE_TIPS = {
  mood:          "Your mood shapes the ENTIRE plan! 😴 Exhausted → light revision only. ⚡ Energized → we attack hardest topics first. Be honest — it makes the plan way better!",
  schedule:      "This is your countdown! ⏱️ Enter days till your exam and daily study hours. I'll perfectly spread the workload so you cover everything without burning out.",
  files:         "My favourite feature! 📎 Upload PDFs, photos of notes, or text files and I'll actually READ them — finding your weak spots, key topics & formulas automatically!",
  subjects:      "Add every subject you need to cover. 📚 I use this list to balance time and make sure nothing gets left out of your plan.",
  learningStyle: "This is huge! 🧠 Visual → I find YouTube videos per topic. Reading → textbooks & study guides. Practice → problem sets & quizzes. All AI-curated, just for you.",
  exam:          "Tell me the exact exam — JEE, NEET, CBSE, UPSC, anything! 🎯 I'll tailor probabilities and strategy specifically for that exam.",
  generate:      "The magic button! 🚀 I analyse your mood, time, notes, subjects and learning style to build your complete personalised day-by-day roadmap!",
  formulasTab:   "Your printable cheat sheet! 🧪 I extract every formula grouped by subject with variable keys and usage tips. Hit Print for exam day!",
  resourcesTab:  "Resources curated for YOUR learning style! 📚 Direct links to YouTube videos, Google Books, or Khan Academy — all matched to your exact topics.",
  analysisTab:   "Your exam intelligence report! 📊 See readiness level, which topics are most likely in your exam, and how much of the syllabus is covered.",
  musicTab:      "Science-backed playlists matched to your mood! 🎵 Right music genuinely boosts focus. Plus reward playlists for after your session!",
  settings:      "Switch AI providers here. ⚙️ Gemini is free with a Google account! Claude is more powerful. Both use your own API key — never stored anywhere.",
};

const ONBOARDING = [
  { emoji: "👋", title: "Hey there!",        msg: "I'm StudyBot — your personal AI exam coach! I'll guide you through everything so you get the most out of this app. Ready for a quick tour?" },
  { emoji: "😊", title: "Mood Check",        msg: "Always start by telling me how you feel today! Your mood changes the entire plan intensity — exhausted means gentle review, energized means we go hard! 💪" },
  { emoji: "📅", title: "Your Schedule",     msg: "Set how many days till your exam and how many hours you can realistically study. I'll divide the load perfectly — nothing gets skipped!" },
  { emoji: "📎", title: "Upload Your Notes", msg: "This is my superpower! Upload your PDFs or photos of notes and I'll read them — automatically finding weak spots, key topics and formulas. 🔍" },
  { emoji: "🧠", title: "Learning Style",    msg: "Tell me HOW you learn best! Visual → YouTube videos. Reading → textbooks & articles. Practice → problem sets. I'll find the right resources for every topic." },
  { emoji: "🚀", title: "You're all set!",   msg: "Hit Generate Plan and I'll build your personalised day-by-day roadmap! Tap me any time to learn about any feature. Let's ace that exam! 🎓" },
];

const STYLES = `
  @keyframes botFloat    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
  @keyframes botBlink    { 0%,92%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.08)} }
  @keyframes eyeGlow     { 0%,100%{filter:brightness(1) drop-shadow(0 0 4px #22d3ee)} 50%{filter:brightness(1.3) drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 18px #06b6d4)} }
  @keyframes shadowPulse { 0%,100%{transform:scaleX(1);opacity:0.22} 50%{transform:scaleX(0.82);opacity:0.12} }
  @keyframes waveArm     { 0%,100%{transform:rotate(0deg) translateY(0)} 30%{transform:rotate(-28deg) translateY(-4px)} 60%{transform:rotate(-14deg) translateY(-2px)} }
  @keyframes bubblePop   { 0%{opacity:0;transform:scale(0.86) translateY(12px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes smilePulse  { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(1.12)} }
  @keyframes glowRing    { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
`;

// ─────────────────────────────────────────────
//  The cute robot SVG-like structure in CSS
// ─────────────────────────────────────────────
function CuteRobot({ scale = 1, blink = false, wave = false, showGlow = false }) {
  const s = scale;
  // Pearl white with gradient for 3D depth
  const bodyGrad   = "linear-gradient(145deg, #ffffff 0%, #e8edf5 40%, #d0d8e8 100%)";
  const headGrad   = "linear-gradient(145deg, #f0f4ff 0%, #dde4f0 45%, #c8d0e0 100%)";
  const visorBg    = "linear-gradient(160deg, #0a0e1a 0%, #0d1a2e 55%, #0a1525 100%)";
  const cyan       = "#22d3ee";
  const cyanDark   = "#06b6d4";

  return (
    <div style={{
      position: "relative",
      width: 90 * s,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      filter: showGlow ? `drop-shadow(0 0 18px rgba(139,92,246,0.5)) drop-shadow(0 6px 20px rgba(0,0,0,0.35))` : `drop-shadow(0 6px 20px rgba(0,0,0,0.3))`,
    }}>

      {/* ── TOP NUB ── */}
      <div style={{
        width: 18 * s, height: 10 * s,
        borderRadius: `${8*s}px ${8*s}px 0 0`,
        background: headGrad,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.1)`,
        marginBottom: -1,
        zIndex: 2,
      }} />

      {/* ── HEAD ── */}
      <div style={{
        width: 82 * s,
        height: 54 * s,
        borderRadius: `${20*s}px`,
        background: headGrad,
        boxShadow: `
          inset 0 3px 8px rgba(255,255,255,0.95),
          inset 0 -2px 6px rgba(0,0,0,0.12),
          2px 4px 12px rgba(0,0,0,0.18)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 2,
      }}>
        {/* Side ear pieces */}
        {[-1, 1].map(side => (
          <div key={side} style={{
            position: "absolute",
            [side === -1 ? "left" : "right"]: -8 * s,
            top: "20%",
            width: 10 * s,
            height: 28 * s,
            borderRadius: side === -1
              ? `${6*s}px 0 0 ${6*s}px`
              : `0 ${6*s}px ${6*s}px 0`,
            background: headGrad,
            boxShadow: side === -1
              ? `inset 2px 2px 4px rgba(255,255,255,0.8), inset -1px 0 2px rgba(0,0,0,0.08), -2px 2px 6px rgba(0,0,0,0.12)`
              : `inset -2px 2px 4px rgba(255,255,255,0.8), inset 1px 0 2px rgba(0,0,0,0.08), 2px 2px 6px rgba(0,0,0,0.12)`,
          }} />
        ))}

        {/* ── VISOR PANEL ── */}
        <div style={{
          width: 66 * s,
          height: 38 * s,
          borderRadius: `${14*s}px`,
          background: visorBg,
          boxShadow: `
            inset 0 2px 12px rgba(0,0,0,0.5),
            0 0 0 2px rgba(180,190,210,0.5),
            0 2px 8px rgba(0,0,0,0.2)
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5 * s,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Visor glass gloss */}
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "38%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)",
            borderRadius: `0 0 50% 50%`,
            pointerEvents: "none",
          }} />

          {/* ── EYES ── */}
          <div style={{ display: "flex", gap: 16 * s, animation: "eyeGlow 2.5s ease-in-out infinite" }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: 16 * s,
                height: blink ? 2 * s : 14 * s,
                borderRadius: blink ? 2 * s : `${8*s}px ${8*s}px ${5*s}px ${5*s}px`,
                background: blink
                  ? `${cyan}44`
                  : `radial-gradient(ellipse at 40% 35%, #7ff4ff, ${cyan} 50%, ${cyanDark})`,
                boxShadow: blink ? "none" : `0 0 8px ${cyan}, 0 0 18px ${cyan}bb, 0 0 30px ${cyanDark}66`,
                transition: "height 0.09s ease, border-radius 0.09s ease",
              }} />
            ))}
          </div>

          {/* ── SMILE ── */}
          <div style={{
            width: 20 * s, height: 10 * s,
            position: "relative",
            animation: "smilePulse 3s ease-in-out infinite",
          }}>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
              border: `${2.5*s}px solid transparent`,
              borderBottom: `${2.5*s}px solid ${cyan}`,
              borderLeft: `${2.5*s}px solid ${cyan}`,
              borderRight: `${2.5*s}px solid ${cyan}`,
              borderRadius: `0 0 ${14*s}px ${14*s}px`,
              boxShadow: `0 2px 8px ${cyan}88`,
            }} />
          </div>
        </div>
      </div>

      {/* ── NECK ── */}
      <div style={{
        width: 22 * s, height: 8 * s,
        background: "linear-gradient(to bottom, #dde4f0, #c8d2e4)",
        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.1)`,
        zIndex: 1,
      }} />

      {/* ── BODY ROW (arms + torso) ── */}
      <div style={{ display: "flex", alignItems: "flex-start", zIndex: 2 }}>

        {/* LEFT ARM */}
        <div style={{
          width: 18 * s, height: 44 * s,
          borderRadius: `${12*s}px`,
          background: bodyGrad,
          boxShadow: `
            inset 3px 2px 6px rgba(255,255,255,0.9),
            inset -2px -2px 4px rgba(0,0,0,0.1),
            -2px 4px 10px rgba(0,0,0,0.15)
          `,
          marginTop: 10 * s,
          transformOrigin: "top center",
          animation: wave ? "waveArm 0.9s ease-in-out 2" : "none",
        }} />

        {/* TORSO — egg / oval shape */}
        <div style={{
          width: 72 * s,
          height: 70 * s,
          borderRadius: `${20*s}px ${20*s}px ${36*s}px ${36*s}px`,
          background: bodyGrad,
          boxShadow: `
            inset 4px 4px 12px rgba(255,255,255,0.95),
            inset -3px -3px 8px rgba(0,0,0,0.1),
            2px 8px 20px rgba(0,0,0,0.2)
          `,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Body gloss highlight */}
          <div style={{
            position: "absolute", top: "6%", left: "18%", width: "30%", height: "28%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.95), rgba(255,255,255,0.1))",
            borderRadius: "50%",
            transform: "rotate(-20deg)",
            pointerEvents: "none",
          }} />

          {/* Belly panel line */}
          <div style={{
            position: "absolute", bottom: "28%", left: "18%", right: "18%",
            height: 2 * s,
            background: "linear-gradient(90deg, transparent, rgba(150,165,190,0.6), transparent)",
            borderRadius: 1 * s,
          }} />
          <div style={{
            position: "absolute", bottom: "28%", left: "38%", right: "38%",
            height: 2 * s,
            borderLeft: `2 * s px solid rgba(150,165,190,0.5)`,
            borderRight: `2 * s px solid rgba(150,165,190,0.5)`,
          }} />

          {/* Chest glow core (subtle purple) */}
          <div style={{
            width: 20 * s, height: 20 * s, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15), rgba(6,182,212,0.08), transparent 70%)",
            boxShadow: `0 0 16px rgba(139,92,246,0.2), 0 0 30px rgba(6,182,212,0.1)`,
            animation: "glowRing 2.5s ease-in-out infinite",
          }} />
        </div>

        {/* RIGHT ARM */}
        <div style={{
          width: 18 * s, height: 44 * s,
          borderRadius: `${12*s}px`,
          background: bodyGrad,
          boxShadow: `
            inset 3px 2px 6px rgba(255,255,255,0.9),
            inset -2px -2px 4px rgba(0,0,0,0.1),
            2px 4px 10px rgba(0,0,0,0.15)
          `,
          marginTop: 10 * s,
        }} />
      </div>

      {/* ── HOVER SHADOW ── */}
      <div style={{
        width: 60 * s, height: 10 * s, marginTop: 6 * s,
        background: "radial-gradient(ellipse, rgba(80,80,120,0.35) 0%, transparent 70%)",
        filter: "blur(6px)",
        animation: "shadowPulse 3s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Compact avatar (matches floating button)
// ─────────────────────────────────────────────
function RobotAvatar({ blink, accent = "#8B5CF6" }) {
  const cyan = "#22d3ee";
  return (
    <div style={{
      width: 56, height: 56,
      borderRadius: "50%",
      background: "linear-gradient(145deg, #f8faff 0%, #e8edf8 50%, #d4daea 100%)",
      boxShadow: `0 0 0 3px ${accent}44, 0 0 16px ${accent}55, 0 6px 20px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.9)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Mini visor */}
      <div style={{
        width: 38, height: 26,
        borderRadius: 10,
        background: "linear-gradient(160deg, #0a0e1a, #0d1a2e)",
        boxShadow: `inset 0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(180,190,210,0.4)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Gloss */}
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "40%", background: "linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)", borderRadius: "0 0 50% 50%", pointerEvents: "none" }} />
        {/* Eyes */}
        <div style={{ display: "flex", gap: 7 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: 8, height: blink ? 1 : 7,
              borderRadius: blink ? 1 : "5px 5px 3px 3px",
              background: blink ? `${cyan}33` : `radial-gradient(ellipse at 40% 30%, #7ff4ff, ${cyan})`,
              boxShadow: blink ? "none" : `0 0 6px ${cyan}, 0 0 12px ${cyan}88`,
              transition: "height 0.09s, border-radius 0.09s",
            }} />
          ))}
        </div>
        {/* Smile */}
        <div style={{
          width: 10, height: 5,
          borderBottom: `2px solid ${cyan}`,
          borderLeft: `2px solid ${cyan}`,
          borderRight: `2px solid ${cyan}`,
          borderRadius: "0 0 8px 8px",
          boxShadow: `0 1px 5px ${cyan}88`,
        }} />
      </div>

      {/* Glow accent ring */}
      <div style={{ position: "absolute", inset: -1, borderRadius: "50%", border: `1.5px solid ${accent}44`, animation: "glowRing 2.5s ease-in-out infinite", pointerEvents: "none" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Robot component
// ─────────────────────────────────────────────
export default function Robot({ currentUser, featureTip, setFeatureTip }) {
  const [blink, setBlink]             = useState(false);
  const [wave, setWave]               = useState(false);
  const [bubbleOpen, setBubbleOpen]   = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [showOnboard, setShowOnboard] = useState(false);
  const [customMsg, setCustomMsg]     = useState(null);

  const accent = "#8B5CF6";
  const isNew  = currentUser?.isNew;
  const name   = currentUser?.username || "there";

  // Inject keyframes once
  useEffect(() => {
    if (!document.getElementById("studybot-styles")) {
      const el = document.createElement("style");
      el.id = "studybot-styles";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Greeting logic
  useEffect(() => {
    if (isNew) {
      setTimeout(() => setShowOnboard(true), 900);
    } else {
      setCustomMsg(`Welcome back, ${name}! 👋 Ready to crush it today?`);
      setBubbleOpen(true);
      setWave(true);
      setTimeout(() => setWave(false), 1100);
      setTimeout(() => { setBubbleOpen(false); setCustomMsg(null); }, 4500);
    }
  }, []);

  // Blink loop
  useEffect(() => {
    const iv = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 2800 + Math.random() * 1000);
    return () => clearInterval(iv);
  }, []);

  // Feature tip opens bubble
  useEffect(() => {
    if (featureTip) { setBubbleOpen(true); setShowOnboard(false); }
  }, [featureTip]);

  const bubbleMsg = featureTip ? FEATURE_TIPS[featureTip] : customMsg ?? null;

  const closeBubble = () => {
    setBubbleOpen(false);
    setFeatureTip?.(null);
    setCustomMsg(null);
  };

  // ══ ONBOARDING OVERLAY ══
  if (showOnboard) {
    const step   = ONBOARDING[onboardStep];
    const isLast = onboardStep === ONBOARDING.length - 1;

    return (
      <>
        {/* Blur backdrop */}
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,8,18,0.78)", zIndex: 1100, backdropFilter: "blur(7px)" }} />

        {/* Panel */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1101,
          background: "linear-gradient(180deg, #111827 0%, #0d1117 100%)",
          borderTop: `1px solid ${accent}44`,
          borderRadius: "28px 28px 0 0",
          padding: "28px 22px 36px",
          animation: "bubblePop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 -8px 40px rgba(139,92,246,0.15)`,
        }}>
          {/* Drag pill */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `${accent}44`, margin: "0 auto 24px" }} />

          {/* Top accent */}
          <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 2, background: `linear-gradient(90deg, transparent, ${accent}, #22d3ee, transparent)`, borderRadius: "0 0 8px 8px" }} />

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 22 }}>
            {/* Robot */}
            <div style={{ animation: "botFloat 3s ease-in-out infinite", flexShrink: 0, marginTop: 4 }}>
              <CuteRobot scale={0.75} blink={blink} wave={onboardStep === 0} showGlow />
            </div>

            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: "inline-flex", alignItems: "center", background: `${accent}18`, border: `1px solid ${accent}33`, borderRadius: 20, padding: "3px 10px", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: accent, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>STEP {onboardStep + 1} / {ONBOARDING.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <span style={{ fontSize: 22 }}>{step.emoji}</span>
                <span style={{ fontWeight: 800, fontSize: 17, fontFamily: "'Syne',sans-serif", background: `linear-gradient(90deg, #f1f5f9, ${accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{step.title}</span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13.5, lineHeight: 1.75, margin: 0 }}>{step.msg}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
            {ONBOARDING.map((_, i) => (
              <div key={i} style={{ height: 5, width: i === onboardStep ? 24 : 5, borderRadius: 3, background: i < onboardStep ? `${accent}77` : i === onboardStep ? accent : `${accent}28`, transition: "all 0.3s ease" }} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowOnboard(false)} style={{ flex: 0.42, padding: "13px 0", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Skip</button>
            <button onClick={() => isLast ? setShowOnboard(false) : setOnboardStep(s => s + 1)} style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: `linear-gradient(135deg, ${accent}, #6366f1)`, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", boxShadow: `0 4px 18px ${accent}55` }}>{isLast ? "Let's Go! 🚀" : "Next →"}</button>
          </div>
        </div>
      </>
    );
  }

  // ══ FLOATING ROBOT BUTTON ══
  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 900, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>

      {/* Speech bubble */}
      {bubbleOpen && bubbleMsg && (
        <div style={{
          background: "rgba(8,12,22,0.96)",
          backdropFilter: "blur(14px)",
          border: `1px solid ${accent}44`,
          borderRadius: "18px 18px 4px 18px",
          padding: "13px 38px 13px 14px",
          maxWidth: 240,
          color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.72,
          boxShadow: `0 8px 36px rgba(0,0,0,0.6), 0 0 0 1px ${accent}18, 0 0 24px ${accent}18`,
          animation: "bubblePop 0.28s cubic-bezier(0.34,1.56,0.64,1)",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, #22d3ee, ${accent})`, borderRadius: "18px 18px 0 0" }} />
          {bubbleMsg}
          <button onClick={closeBubble} style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
        </div>
      )}

      {/* Avatar */}
      <div
        onClick={() => {
          if (featureTip || customMsg) { closeBubble(); }
          else if (!bubbleOpen) { setCustomMsg("Hey! 👋 Tap ℹ️ next to any feature and I'll explain it!"); setBubbleOpen(true); }
          else { setBubbleOpen(false); }
          setWave(true);
          setTimeout(() => setWave(false), 950);
        }}
        style={{ cursor: "pointer", userSelect: "none", animation: "botFloat 3s ease-in-out infinite" }}
      >
        <RobotAvatar blink={blink} accent={accent} />
      </div>
    </div>
  );
}