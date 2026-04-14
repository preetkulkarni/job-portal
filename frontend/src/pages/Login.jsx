import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const from = location.state?.from?.pathname || null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }
    setLoading(true); setError("");
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) { setError(result.error || "Login failed."); return; }
    navigate(from || "/", { replace: true });
  }

  const roles = [
    {
      key: 'candidate',
      icon: '🧑',
      label: 'Candidate',
      desc: 'Find jobs and apply with your resume',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.25)',
      activeBorder: '#60a5fa',
    },
    {
      key: 'recruiter',
      icon: '🏢',
      label: 'Recruiter',
      desc: 'Post jobs and find top talent using AI',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.25)',
      activeBorder: '#f59e0b',
    },
    {
      key: 'admin',
      icon: '🔑',
      label: 'Admin',
      desc: 'Manage platform and view analytics',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.25)',
      activeBorder: '#a78bfa',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex' }}>

      {/* Left panel */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        width: '50%', padding: '48px 56px',
        background: '#111827', borderRight: '1px solid #1e2d45',
        gap: 40
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#00d4b4', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#0a0f1e', fontSize: 18, fontWeight: 800, fontFamily: 'Syne' }}>T</span>
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 20 }}>TalentBridge</span>
        </div>

        {/* Headline */}
        <div>
          <p style={{ color: '#00d4b4', fontSize: 12, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            AI-Powered Hiring Platform
          </p>
          <h2 style={{ fontFamily: 'Syne', fontSize: 52, fontWeight: 800, lineHeight: 1.05, color: '#f0f4ff', marginBottom: 20 }}>
            Find your next<br />
            <span style={{ color: '#00d4b4' }}>opportunity.</span>
          </h2>
          <p style={{ color: '#8892a4', fontSize: 15, lineHeight: 1.8, maxWidth: 380 }}>
            Semantic AI matching connects the right talent with the right roles — faster and smarter than ever before.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🔍', title: 'Semantic Resume Matching', desc: 'FAISS vector search finds the best fit instantly' },
            { icon: '⚡', title: 'AI-Ranked Candidates', desc: 'Relevance scores powered by HuggingFace embeddings' },
            { icon: '🔒', title: 'Secure & Role-Based', desc: 'JWT authentication with candidate & recruiter access' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: 'rgba(0,212,180,0.04)', border: '1px solid rgba(0,212,180,0.12)', borderRadius: 12, padding: '14px 16px' }}>
              <span style={{ fontSize: 20, marginTop: 1 }}>{icon}</span>
              <div>
                <p style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Syne', fontWeight: 600, marginBottom: 2 }}>{title}</p>
                <p style={{ color: '#4a5568', fontSize: 12, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="fade-up">
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ color: '#8892a4', fontSize: 14, marginBottom: 24 }}>
            New here?{" "}
            <Link to="/register" style={{ color: '#00d4b4', textDecoration: 'none', fontWeight: 600 }}>
              Create an account
            </Link>
          </p>

          {/* Role Selection */}
          <p style={{ color: '#8892a4', fontSize: 13, marginBottom: 10 }}>Sign in as</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {roles.map(r => (
              <button
                key={r.key}
                onClick={() => setSelectedRole(r.key)}
                style={{
                  background: selectedRole === r.key ? r.bg : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${selectedRole === r.key ? r.activeBorder : '#1e2d45'}`,
                  borderRadius: 12,
                  padding: '14px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}>
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, color: selectedRole === r.key ? r.color : '#f0f4ff', fontSize: 13 }}>{r.label}</p>
                <p style={{ color: '#4a5568', fontSize: 10, lineHeight: 1.4 }}>{r.desc}</p>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 16, padding: 28 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Email</label>
                <input className="input" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com" autoComplete="email" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
                <input className="input" type="password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Your password" autoComplete="current-password" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: 13 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #0a0f1e', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Signing in…
                  </span>
                ) : (
                  selectedRole
                    ? `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                    : "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Role hint */}
          {selectedRole && (
            <p style={{ color: '#4a5568', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
              Make sure you are using your <span style={{ color: roles.find(r => r.key === selectedRole)?.color }}>{selectedRole}</span> account credentials
            </p>
          )}

        </div>
      </div>
    </div>
  );
}