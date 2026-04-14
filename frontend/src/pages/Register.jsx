import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CANDIDATE_FORM = { first_name: "", last_name: "", email: "", password: "", headline: "" };
const RECRUITER_FORM = { first_name: "", last_name: "", email: "", password: "", headline: "", company_name: "" };

export default function Register() {
  const { registerCandidate, registerRecruiter } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("candidate");
  const [form, setForm] = useState(CANDIDATE_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleSwitch(r) { setRole(r); setError(""); setForm(r === "candidate" ? CANDIDATE_FORM : RECRUITER_FORM); }
  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); if (error) setError(""); }

  function validate() {
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password.length > 72) return "Password must be 72 characters or fewer.";
    if (role === "recruiter" && !form.company_name?.trim()) return "Company name is required.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    const register = role === "candidate" ? registerCandidate : registerRecruiter;
    const result = await register(form);
    setLoading(false);
    if (!result.success) { setError(result.error || "Registration failed."); return; }
    navigate(role === "candidate" ? "/candidate/dashboard" : "/recruiter/dashboard", { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ background: '#00d4b4', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0a0f1e', fontSize: 16, fontWeight: 800, fontFamily: 'Syne' }}>T</span>
            </div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 18 }}>TalentBridge</span>
          </div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>Create account</h1>
          <p style={{ color: '#8892a4', fontSize: 14 }}>
            Already have one?{" "}
            <Link to="/login" style={{ color: '#00d4b4', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 16, padding: 32 }}>
          {/* Role Toggle */}
          <div style={{ display: 'flex', background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["candidate", "recruiter"].map((r) => (
              <button key={r} type="button" onClick={() => handleRoleSwitch(r)}
                style={{ flex: 1, padding: '8px 0', fontSize: 14, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: role === r ? '#00d4b4' : 'transparent', color: role === r ? '#0a0f1e' : '#8892a4', fontFamily: role === r ? 'Syne' : 'DM Sans', fontWeight: role === r ? 700 : 400 }}>
                {r === "candidate" ? "👤 Candidate" : "🏢 Recruiter"}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>First Name</label>
                <input className="input" type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Jane" />
              </div>
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Last Name</label>
                <input className="input" type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Email</label>
              <input className="input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
              <input className="input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" />
              {form.password.length > 60 && (
                <p style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>{72 - form.password.length} characters remaining</p>
              )}
            </div>

            {role === "recruiter" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Company Name</label>
                <input className="input" type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Corp" />
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>
                Headline <span style={{ color: '#4a5568' }}>(optional)</span>
              </label>
              <input className="input" type="text" name="headline" value={form.headline} onChange={handleChange}
                placeholder={role === "candidate" ? "e.g. Full-Stack Developer" : "e.g. Tech Recruiter at Acme"} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: 13 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #0a0f1e', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Creating account…
                </span>
              ) : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}