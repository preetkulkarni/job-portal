import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, isCandidate, isRecruiter, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const isActive = (path) => location.pathname === path;

  const roleColor = {
    candidate: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
    recruiter: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    admin: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  }

  const rc = roleColor[user?.role] || roleColor.candidate

  return (
    <>
      <nav style={{ background: 'var(--navy-2)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div style={{ background: 'var(--teal)', width: 28, height: 28, borderRadius: 8 }}
              className="flex items-center justify-center">
              <span style={{ color: 'var(--navy)', fontSize: 14, fontWeight: 800, fontFamily: 'Syne' }}>J</span>
            </div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>
              TalentBridge
            </span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-6">

              {/* Candidate Links */}
              {isCandidate && (
                <>
                  <NavLink to="/jobs" active={isActive('/jobs')}>Browse Jobs</NavLink>
                  <NavLink to="/saved-jobs" active={isActive('/saved-jobs')}>Saved</NavLink>
                  <NavLink to="/resume/upload" active={isActive('/resume/upload')}>Apply</NavLink>
                  <NavLink to="/candidate/dashboard" active={isActive('/candidate/dashboard')}>Dashboard</NavLink>
                </>
              )}

              {/* Recruiter Links */}
              {isRecruiter && (
                <>
                  <NavLink to="/jobs" active={isActive('/jobs')}>Jobs</NavLink>
                  <NavLink to="/search-candidates" active={isActive('/search-candidates')}>Find Talent</NavLink>
                  <NavLink to="/recruiter/applicants" active={isActive('/recruiter/applicants')}>Applicants</NavLink>
                  <NavLink to="/recruiter/dashboard" active={isActive('/recruiter/dashboard')}>Dashboard</NavLink>
                </>
              )}

              {/* User Info + Logout */}
              <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>

                {/* Clickable name button */}
                <button
                  onClick={() => setShowProfile(true)}
                  style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>
                  <span style={{ color: 'var(--teal)', fontSize: 13, fontFamily: 'Syne', fontWeight: 600 }}>
                    {user?.first_name} {user?.last_name?.charAt(0)}.
                  </span>
                </button>

                <button onClick={handleLogout}
                  style={{ color: 'var(--text-muted)', fontSize: 13 }}
                  className="hover:text-red-400 transition-colors">
                  Sign out
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login"
                style={{ color: 'var(--text-secondary)', fontSize: 14 }}
                className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 18px' }}>
                Get started
              </Link>
            </div>
          )}

        </div>
      </nav>

      {/* Profile Popup */}
      {showProfile && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowProfile(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />

          {/* Popup */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#111827',
            border: '1px solid rgba(0,212,180,0.25)',
            borderRadius: 16,
            width: 380,
            zIndex: 50,
            overflow: 'hidden'
          }}>

            {/* Popup Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#00d4b4', fontSize: 11, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>My Profile</p>
              <button onClick={() => setShowProfile(false)}
                style={{ color: '#4a5568', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Popup Body */}
            <div style={{ padding: 24 }}>

              {/* Avatar and name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, color: '#00d4b4', fontSize: 20, flexShrink: 0 }}>
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 18 }}>
                    {user?.first_name} {user?.last_name}
                  </p>
                  <span style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontSize: 11, fontWeight: 600, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'First Name', value: user?.first_name, icon: '👤' },
                  { label: 'Last Name', value: user?.last_name, icon: '👤' },
                  { label: 'Email', value: user?.email, icon: '📧' },
                  { label: 'Role', value: user?.role, icon: '🔑' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span style={{ color: '#4a5568', fontSize: 13 }}>{label}</span>
                    </div>
                    <span style={{ color: '#f0f4ff', fontSize: 13, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowProfile(false)}
                style={{ width: '100%', marginTop: 20, padding: '10px 0', borderRadius: 10, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', color: '#00d4b4', fontFamily: 'Syne', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link to={to} style={{
      color: active ? 'var(--teal)' : 'var(--text-secondary)',
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      textDecoration: 'none',
      transition: 'color 0.2s'
    }}
      className="hover:text-white transition-colors">
      {children}
    </Link>
  );
}