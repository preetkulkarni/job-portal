import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

export default function SavedJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    apiClient.get('/saved-jobs/me')
      .then(r => setJobs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const unsave = async (jobId) => {
    setRemovingId(jobId)
    try {
      await apiClient.delete(`/saved-jobs/${jobId}`)
      setJobs(prev => prev.filter(j => j.job_id !== jobId))
    } catch (err) {
      alert(err.userMessage || 'Failed to remove.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 896, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <p style={{
            color: '#00d4b4', fontSize: 13, fontFamily: 'Syne',
            fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4
          }}>
            Bookmarks
          </p>
          <h1 style={{
            fontFamily: 'Syne', fontSize: 36, fontWeight: 800,
            color: '#f0f4ff', marginBottom: 8, lineHeight: 1.2
          }}>
            Saved Jobs
          </h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            color: '#4a5568', fontSize: 14 }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid #00d4b4', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite'
            }} />
            Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div style={{
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: 12, padding: 48, textAlign: 'center'
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>⭐</p>
            <p style={{
              fontFamily: 'Syne', fontWeight: 600,
              color: '#8892a4', fontSize: 16, marginBottom: 8
            }}>
              No saved jobs yet
            </p>
            <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 24 }}>
              Browse jobs and save the ones you like
            </p>
            <button onClick={() => navigate('/jobs')} className="btn-primary">
              Browse Jobs
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map((j, i) => (
              <div key={j.job_id}
                className={`fade-up-${Math.min(i + 1, 3)}`}
                style={{
                  background: '#111827', border: '1px solid #1e2d45',
                  borderRadius: 12, padding: 20, transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,180,0.25)'
                  e.currentTarget.style.background = '#162030'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1e2d45'
                  e.currentTarget.style.background = '#111827'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{
                      fontFamily: 'Syne', fontWeight: 700,
                      color: '#f0f4ff', fontSize: 16, marginBottom: 4
                    }}>
                      {j.job_title}
                    </h2>
                    <p style={{ color: '#8892a4', fontSize: 13, marginBottom: 4 }}>
                      {j.company_name}
                    </p>
                    <p style={{ color: '#4a5568', fontSize: 12 }}>
                      Saved {new Date(j.saved_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => navigate(`/jobs/${j.job_id}`)}
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => unsave(j.job_id)}
                      disabled={removingId === j.job_id}
                      style={{
                        padding: '8px 18px', fontSize: 13,
                        borderRadius: 8, cursor: 'pointer',
                        border: '1px solid rgba(248,113,113,0.3)',
                        background: 'rgba(248,113,113,0.08)',
                        color: removingId === j.job_id ? '#4a5568' : '#f87171',
                        opacity: removingId === j.job_id ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {removingId === j.job_id ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}