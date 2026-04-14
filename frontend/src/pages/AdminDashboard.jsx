import { useState, useEffect } from 'react'
import apiClient from '../api/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, jobsRes, usersRes] = await Promise.all([
          apiClient.get('/admin/stats'),
          apiClient.get('/jobs', { params: { limit: 100 } }),
          apiClient.get('/admin/users'),
        ])
        setStats(statsRes.data)
        setJobs(jobsRes.data)
        setUsers(usersRes.data)
      } catch (err) {
        setError(err.userMessage || 'Failed to load analytics.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  function getUserDetails(email) {
    const user = users.find(u => u.email === email)
    setSelectedUser(user || null)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0f1e', gap: 8, color: '#4a5568', fontSize: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #00d4b4', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      Loading analytics...
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 12, padding: '16px 24px', fontSize: 14 }}>
        {error}
      </div>
    </div>
  )

  const statCards = [
    { label: 'Total Users', value: stats.total_users, color: '#a78bfa', icon: '👥' },
    { label: 'Candidates', value: stats.total_candidates, color: '#60a5fa', icon: '🧑' },
    { label: 'Recruiters', value: stats.total_recruiters, color: '#f59e0b', icon: '🏢' },
    { label: 'Total Jobs', value: stats.total_jobs, color: '#00d4b4', icon: '💼' },
    { label: 'Active Jobs', value: stats.active_jobs, color: '#34d399', icon: '✅' },
    { label: 'Inactive Jobs', value: stats.inactive_jobs, color: '#4a5568', icon: '⏸️' },
    { label: 'Total Applications', value: stats.total_applications, color: '#818cf8', icon: '📋' },
    { label: 'Shortlisted', value: stats.shortlisted, color: '#00d4b4', icon: '⭐' },
    { label: 'Rejected', value: stats.rejected, color: '#f87171', icon: '✕' },
  ]

  const roleColor = {
    candidate: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
    recruiter: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    admin: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: '#00d4b4', fontSize: 13, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Admin Panel</p>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>Platform Analytics</h1>
          <p style={{ color: '#8892a4', fontSize: 14 }}>Platform-wide statistics and insights</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {statCards.map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color }}>{value}</span>
              </div>
              <p style={{ color: '#8892a4', fontSize: 13 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

          {/* Top Recruiters */}
          <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e2d45' }}>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>Top Recruiters</h2>
              <p style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>Click name to view details</p>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.top_recruiters.length === 0 ? (
                <p style={{ color: '#4a5568', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No recruiters yet</p>
              ) : stats.top_recruiters.map((r, i) => (
                <div key={i}
                  onClick={() => getUserDetails(r.email)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', transition: 'border 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,180,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2d45'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, color: '#00d4b4', fontSize: 12 }}>
                      #{i + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#00d4b4', fontSize: 13, textDecoration: 'underline' }}>{r.name}</p>
                      <p style={{ color: '#4a5568', fontSize: 11 }}>{r.email}</p>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(0,212,180,0.1)', color: '#00d4b4', border: '1px solid rgba(0,212,180,0.3)', fontSize: 12, fontWeight: 700, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                    {r.job_count} jobs
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Applied Jobs */}
          <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e2d45' }}>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>Most Applied Jobs</h2>
              <p style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>By number of applications</p>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.most_applied_jobs.length === 0 ? (
                <p style={{ color: '#4a5568', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No applications yet</p>
              ) : stats.most_applied_jobs.map((j, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, color: '#60a5fa', fontSize: 12 }}>
                      #{i + 1}
                    </div>
                    <p style={{ fontWeight: 600, color: '#f0f4ff', fontSize: 13 }}>{j.title}</p>
                  </div>
                  <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontSize: 12, fontWeight: 700, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                    {j.applications} apps
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Application Status Breakdown */}
        <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16, marginBottom: 16 }}>Application Status Breakdown</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Applied', value: stats.applied, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
              { label: 'Shortlisted', value: stats.shortlisted, color: '#00d4b4', bg: 'rgba(0,212,180,0.1)', border: 'rgba(0,212,180,0.3)' },
              { label: 'Rejected', value: stats.rejected, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color, marginBottom: 4 }}>{value}</p>
                <p style={{ color, fontSize: 13, fontWeight: 600 }}>{label}</p>
                <p style={{ color: '#4a5568', fontSize: 11, marginTop: 4 }}>
                  {stats.total_applications > 0
                    ? `${Math.round((value / stats.total_applications) * 100)}% of total`
                    : '0% of total'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* All Users Table */}
        <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e2d45' }}>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>All Users</h2>
            <span style={{ color: '#4a5568', fontSize: 13 }}>{users.length} total</span>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#4a5568', fontSize: 14 }}>No users yet.</div>
          ) : (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2d45' }}>
                  {['Name', 'Email', 'Role'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#4a5568', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Syne' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const rc = roleColor[u.role] || roleColor.candidate
                  return (
                    <tr key={u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{ borderBottom: '1px solid #1e2d45', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#162030'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 24px', fontWeight: 600, color: '#00d4b4', textDecoration: 'underline' }}>
                        {u.first_name} {u.last_name}
                      </td>
                      <td style={{ padding: '14px 24px', color: '#8892a4' }}>{u.email}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontSize: 11, fontWeight: 600, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* All Jobs Table */}
        <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e2d45' }}>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>All Job Postings</h2>
            <span style={{ color: '#4a5568', fontSize: 13 }}>{jobs.length} total</span>
          </div>
          {jobs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#4a5568', fontSize: 14 }}>No jobs posted yet.</div>
          ) : (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2d45' }}>
                  {['Title', 'Description', 'Status', 'Posted'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#4a5568', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Syne' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ borderBottom: '1px solid #1e2d45' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#162030'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#f0f4ff' }}>{job.title}</td>
                    <td style={{ padding: '16px 24px', color: '#8892a4', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ background: job.is_active ? 'rgba(0,212,180,0.1)' : '#1a2236', color: job.is_active ? '#00d4b4' : '#4a5568', border: `1px solid ${job.is_active ? 'rgba(0,212,180,0.3)' : '#1e2d45'}`, fontSize: 11, fontWeight: 600, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#4a5568' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Details Popup */}
      {selectedUser && (
        <>
          <div onClick={() => setSelectedUser(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#111827', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 16, width: 400, zIndex: 50, padding: 0, overflow: 'hidden' }}>

            {/* Popup Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#00d4b4', fontSize: 11, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>User Details</p>
              <button onClick={() => setSelectedUser(null)}
                style={{ color: '#4a5568', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Popup Body */}
            <div style={{ padding: 24 }}>

              {/* Avatar and name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, color: '#00d4b4', fontSize: 20, flexShrink: 0 }}>
                  {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 18 }}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <span style={{
                    background: roleColor[selectedUser.role]?.bg || 'rgba(96,165,250,0.1)',
                    color: roleColor[selectedUser.role]?.color || '#60a5fa',
                    border: `1px solid ${roleColor[selectedUser.role]?.border || 'rgba(96,165,250,0.3)'}`,
                    fontSize: 11, fontWeight: 600, fontFamily: 'Syne',
                    padding: '3px 10px', borderRadius: 20
                  }}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Email', value: selectedUser.email, icon: '📧' },
                  { label: 'First Name', value: selectedUser.first_name, icon: '👤' },
                  { label: 'Last Name', value: selectedUser.last_name, icon: '👤' },
                  { label: 'Role', value: selectedUser.role, icon: '🔑' },
                  { label: 'User ID', value: selectedUser.id?.slice(0, 8) + '...', icon: '🆔' },
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
              <button onClick={() => setSelectedUser(null)}
                style={{ width: '100%', marginTop: 20, padding: '10px 0', borderRadius: 10, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', color: '#00d4b4', fontFamily: 'Syne', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}