import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

const statusStyle = {
  applied: 'badge badge-blue',
  reviewed: 'badge badge-amber',
  shortlisted: 'badge badge-green',
  rejected: 'badge badge-red'
}

// Handles all possible status formats from backend
function getStatus(raw) {
  if (!raw) return 'applied'
  if (typeof raw === 'string') {
    // handles "shortlisted" or "ApplicationStatus.shortlisted"
    return raw.includes('.') ? raw.split('.').pop() : raw
  }
  if (typeof raw === 'object' && raw.value) return raw.value
  return 'applied'
}

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/applications/me')
      .then(r => {
        console.log('apps data:', JSON.stringify(r.data, null, 2))
        setApps(r.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: apps.length,
    shortlisted: apps.filter(a => getStatus(a.status) === 'shortlisted').length,
    rejected: apps.filter(a => getStatus(a.status) === 'rejected').length
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 32 }} className="fade-up">
          <p style={{ color: '#00d4b4', fontSize: 13, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Dashboard</p>
          <h1 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: '#f0f4ff', lineHeight: 1.2, marginBottom: 8 }}>
            Welcome, {user?.first_name} 👋
          </h1>
          <p style={{ color: '#8892a4', fontSize: 14 }}>Track your applications and career progress</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Applications', value: stats.total, color: '#60a5fa', icon: '📋' },
            { label: 'Shortlisted', value: stats.shortlisted, color: '#00d4b4', icon: '⭐' },
            { label: 'Rejected', value: stats.rejected, color: '#f87171', icon: '✕' },
          ].map(({ label, value, color, icon }, i) => (
            <div key={label} className={`fade-up-${i + 1}`}
              style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color }}>
                  {loading ? '—' : value}
                </span>
              </div>
              <p style={{ color: '#8892a4', fontSize: 13 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Applications */}
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 16 }}>My Applications</h2>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4a5568', fontSize: 14 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #00d4b4', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Loading...
              </div>
            ) : apps.length === 0 ? (
              <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 16 }}>No applications yet</p>
                <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {apps.map(a => {
                  const statusVal = getStatus(a.status)
                  return (
                    <div key={a.application_id}
                      style={{
                        background: '#111827',
                        border: `1px solid ${
                          statusVal === 'shortlisted' ? 'rgba(0,212,180,0.3)' :
                          statusVal === 'rejected' ? 'rgba(248,113,113,0.3)' :
                          '#1e2d45'
                        }`,
                        borderRadius: 12, padding: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#f0f4ff', fontSize: 14, marginBottom: 4 }}>{a.job_title}</p>
                        <p style={{ color: '#8892a4', fontSize: 13, marginBottom: 4 }}>{a.company_name}</p>
                        <p style={{ color: '#4a5568', fontSize: 12 }}>{new Date(a.applied_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span className={statusStyle[statusVal] || 'badge badge-blue'}>
                          {statusVal === 'shortlisted' ? '⭐ shortlisted' :
                           statusVal === 'rejected' ? '✕ rejected' :
                           statusVal}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { to: '/jobs', icon: '🔍', label: 'Browse Jobs', desc: 'Find new opportunities' },
                { to: '/resume/upload', icon: '📄', label: 'Upload Resume', desc: 'Apply with your CV' },
                { to: '/saved-jobs', icon: '⭐', label: 'Saved Jobs', desc: 'Your bookmarked roles' },
              ].map(({ to, icon, label, desc }) => (
                <Link key={to} to={to} style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 18, width: 36, height: 36, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: '#f0f4ff', fontSize: 14 }}>{label}</p>
                    <p style={{ color: '#4a5568', fontSize: 12 }}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}