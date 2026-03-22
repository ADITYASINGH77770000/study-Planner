import { useState } from "react";
import { signIn, signUp } from "./auth.js";

export default function AuthScreen({ onAuth }) {
  const [tab, setTab]           = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const accent = "#8B5CF6";
  const cyan   = "#06B6D4";

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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1117 0%, #161b27 50%, #0d1117 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden",
    }}>
      <style>{"* { box-sizing: border-box; }"}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${cyan}10 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${accent}, #6366f1)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: `0 8px 32px ${accent}44`,
            fontSize: 28,
          }}>📚</div>
          <p style={{ color: "#64748b", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px" }}>Your Personal</p>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0,
            background: `linear-gradient(135deg, #e2e8f0, ${accent})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Study Coach</h1>
          <p style={{ color: "#475569", fontSize: 13, margin: "8px 0 0" }}>🎓 AI-powered exam preparation</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24, padding: "28px 24px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          position: "relative",
        }}>
          {/* Top accent line */}
          <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${accent}, ${cyan}, transparent)`, borderRadius: "0 0 8px 8px" }} />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4 }}>
            {["signin", "signup"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
                flex: 1, padding: "10px 0",
                background: tab === t ? `linear-gradient(135deg, ${accent}33, #6366f133)` : "transparent",
                color: tab === t ? "#e2e8f0" : "#64748b",
                border: `1px solid ${tab === t ? accent + "44" : "transparent"}`,
                borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}>
                {t === "signin" ? "🔑 Sign In" : "✨ Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Username */}
            <div>
              <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>👤 Username</label>
              <input
                style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                placeholder="e.g. priya_student"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handle()}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>🔒 Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ width: "100%", padding: "12px 44px 12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                  type={showPw ? "text" : "password"}
                  placeholder={tab === "signup" ? "min 4 characters" : "your password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handle()}
                />
                <button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, color: "#64748b" }}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#EF444418", border: "1px solid #EF444444", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handle} disabled={loading} style={{
              width: "100%", padding: "14px 0",
              background: loading ? `${accent}66` : `linear-gradient(135deg, ${accent}, #6366f1)`,
              border: "none", borderRadius: 13, color: "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: loading ? "none" : `0 4px 20px ${accent}44`,
              transition: "all 0.2s", marginTop: 4,
            }}>
              {loading ? "⏳ Please wait..." : tab === "signin" ? "Sign In →" : "🚀 Create Account"}
            </button>
          </div>

          {/* Features preview */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20 }}>
            {[["📅","Day-by-Day Plan"],["🎯","Exam Probability"],["🧪","Formula Sheet"],["📚","Learning Resources"]].map(([icon, label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ color: "#475569", fontSize: 11, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>

          <p style={{ color: "#334155", fontSize: 11, textAlign: "center", marginTop: 16, marginBottom: 0, lineHeight: 1.6 }}>
            🔒 Data stays on your device only. No servers, no tracking.
          </p>
        </div>
      </div>
    </div>
  );
}