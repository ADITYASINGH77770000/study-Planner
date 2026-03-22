// ─────────────────────────────────────────────
//  AuthScreen — Sign In / Sign Up
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { signIn, signUp } from "./Auth.js";

// Inline robot for auth screen (slightly larger)
function AuthRobot({ msg }) {
  const [blink, setBlink] = useState(false);
  const accent = "#8B5CF6";

  useEffect(() => {
    const iv = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 2600 + Math.random() * 600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
      {/* Robot */}
      <div style={{ animation: "robotFloat 3s ease-in-out infinite", marginBottom: "16px", filter: `drop-shadow(0 8px 24px ${accent}66)` }}>
        {/* Antenna */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 3, height: 14, background: `${accent}99`, position: "relative" }}>
            <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: `0 0 10px ${accent}`, animation: "antennaPulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
        {/* Head */}
        <div style={{ width: 68, height: 52, background: "linear-gradient(145deg, #252d45, #161c2e)", border: `2px solid ${accent}88`, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, boxShadow: `3px 3px 0 #0d1117, 0 0 20px ${accent}33` }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[0,1].map(i => <div key={i} style={{ width: 14, height: blink ? 2 : 14, borderRadius: blink ? 2 : "50%", background: `linear-gradient(135deg, ${accent}, #6366f1)`, boxShadow: blink ? "none" : `0 0 10px ${accent}`, transition: "height 0.08s" }} />)}
          </div>
          <div style={{ width: 20, height: 6, borderBottom: `2px solid ${accent}99`, borderLeft: `2px solid ${accent}99`, borderRight: `2px solid ${accent}99`, borderRadius: "0 0 10px 10px" }} />
        </div>
        {/* Neck */}
        <div style={{ width: 20, height: 6, margin: "0 auto", background: "#161c2e", borderLeft: `1px solid ${accent}44`, borderRight: `1px solid ${accent}44` }} />
        {/* Body */}
        <div style={{ width: 76, height: 58, background: "linear-gradient(145deg, #252d45, #161c2e)", border: `2px solid ${accent}77`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `3px 3px 0 #0d1117` }}>
          <div style={{ width: 36, height: 30, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, overflow: "hidden", position: "relative" }}>
            {[0.4, 0.65, 0.9].map((op, i) => <div key={i} style={{ width: 24, height: 3, borderRadius: 2, background: accent, opacity: op, boxShadow: `0 0 5px ${accent}` }} />)}
            <div style={{ position: "absolute", width: "100%", height: 2, background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`, animation: "chestScan 2s ease-in-out infinite" }} />
          </div>
        </div>
        {/* Legs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 2 }}>
          {[0,1].map(i => <div key={i} style={{ width: 18, height: 22, background: "linear-gradient(145deg, #252d45, #161c2e)", border: `1.5px solid ${accent}66`, borderTop: "none", borderRadius: "0 0 7px 7px", boxShadow: "2px 2px 0 #0d1117" }} />)}
        </div>
      </div>

      {/* Speech bubble */}
      <div style={{
        background: "rgba(13,17,23,0.9)", border: `1px solid ${accent}44`,
        borderRadius: "18px 18px 18px 6px", padding: "12px 16px",
        maxWidth: "280px", textAlign: "center",
        color: "#e2e8f0", fontSize: "13px", lineHeight: "1.6",
        boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
      }}>
        {msg}
      </div>
    </div>
  );
}

export default function AuthScreen({ onAuth }) {
  const [tab, setTab]         = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const accent = "#8B5CF6";

  const robotMsg = tab === "signin"
    ? "Hey! 👋 Welcome back! Sign in to pick up where you left off."
    : "Hi! I'm StudyBot 🤖 Create an account and I'll guide you through everything!";

  const S = {
    input: {
      width: "100%", padding: "13px 16px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px", color: "#e2e8f0", fontSize: "14px",
      fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
    },
    btn: {
      width: "100%", padding: "14px", borderRadius: "13px",
      background: accent, border: "none", color: "#fff",
      fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1,
      transition: "all 0.2s",
    },
    tab: (active) => ({
      flex: 1, padding: "10px", background: active ? `${accent}22` : "transparent",
      color: active ? accent : "#64748b",
      border: `1px solid ${active ? accent + "44" : "transparent"}`,
      borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
      fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
    }),
  };

  const handle = async () => {
    setError("");
    setLoading(true);
    try {
      const user = tab === "signin" ? signIn(username, password) : signUp(username, password);
      onAuth(user);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d1117 0%, #161b27 50%, #0d1117 100%)", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <style>{`
        @keyframes robotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes antennaPulse { 0%,100%{box-shadow:0 0 4px #8B5CF6,0 0 8px rgba(139,92,246,0.4);opacity:1} 50%{box-shadow:0 0 12px #8B5CF6,0 0 24px rgba(139,92,246,0.7);opacity:0.8} }
        @keyframes chestScan { 0%{transform:translateY(-15px);opacity:0} 50%{opacity:1} 100%{transform:translateY(15px);opacity:0} }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <p style={{ color: "#64748b", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 4px" }}>Your Personal</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: "800", margin: 0, background: `linear-gradient(135deg, #e2e8f0, ${accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Study Coach</h1>
        </div>

        {/* Robot */}
        <AuthRobot msg={robotMsg} />

        {/* Auth card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px" }}>
            <button style={S.tab(tab === "signin")}  onClick={() => { setTab("signin");  setError(""); }}>Sign In</button>
            <button style={S.tab(tab === "signup")}  onClick={() => { setTab("signup");  setError(""); }}>Sign Up</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>👤 Username</label>
              <input style={S.input} placeholder="e.g. priya_student" value={username} onChange={e => { setUsername(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handle()} />
            </div>

            <div>
              <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>🔒 Password</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...S.input, paddingRight: "44px" }} type={showPw ? "text" : "password"} placeholder={tab === "signup" ? "min 4 characters" : "your password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handle()} />
                <button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>{showPw ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {error && (
              <div style={{ background: "#EF444418", border: "1px solid #EF444444", borderRadius: "10px", padding: "10px 12px", color: "#FCA5A5", fontSize: "13px" }}>
                ⚠️ {error}
              </div>
            )}

            <button style={S.btn} onClick={handle} disabled={loading}>
              {loading ? "⏳ Just a moment..." : tab === "signin" ? "Sign In →" : "Create Account →"}
            </button>
          </div>

          <p style={{ color: "#475569", fontSize: "11px", textAlign: "center", marginTop: "16px", lineHeight: "1.5" }}>
            🔒 Your data stays on this device only — no servers, no tracking.
          </p>
        </div>
      </div>
    </div>
  );
}