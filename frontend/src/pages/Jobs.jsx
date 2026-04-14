import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Jobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState(new Set())
  const [savingId, setSavingId] = useState(null)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/jobs', { params: search ? { search } : {} })
      setJobs(data)
    } catch {}
    finally { setLoading(false) }
  }

  const fetchSaved = async () => {
    if (!user || user.role !== 'candidate') return
    try {
      const { data } = await apiClient.get('/saved-jobs/me')
      setSavedIds(new Set(data.map(j => j.job_id)))
    } catch {}
  }

  useEffect(() => { fetchJobs(); fetchSaved() }, [])

  const handleSearch = (e) => { e.preventDefault(); fetchJobs() }

  const toggleSave = async (jobId) => {
    if (!user || user.role !== 'candidate') { navigate('/login'); return }
    setSavingId(jobId)
    try {
      if (savedIds.has(jobId)) {
        await apiClient.delete(`/saved-jobs/${jobId}`)
        setSavedIds(prev => { const s = new Set(prev); s.delete(jobId); return s })
      } else {
        await apiClient.post('/saved-jobs/', { job_id: jobId })
        setSavedIds(prev => new Set(prev).add(jobId))
      }
    } catch (err) {
      alert(err.userMessage || 'Failed to save job.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <p style={{
            color: '#00d4b4', fontSize: 13, fontFamily: 'Syne',
            fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4
          }}>
            Opportunities
          </p>
          <h1 style={{
            fontFamily: 'Syne', fontSize: 36, fontWeight: 800,
            color: '#f0f4ff', marginBottom: 20, lineHeight: 1.2
          }}>
            Browse Jobs
          </h1>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 560 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, skills, keywords..."
              className="input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', whiteSpace: 'nowrap' }}>
              Search
            </button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '80px 0', gap: 8, color: '#4a5568', fontSize: 14 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid #00d4b4', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite'
            }} />
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div style={{
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: 12, padding: 48, textAlign: 'center'
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p style={{ color: '#8892a4', fontSize: 14 }}>No jobs found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map((job, i) => (
              <div key={job.id} style={{
                background: '#111827',
                border: '1px solid #1e2d45',
                borderRadius: 12,
                padding: 24,
                transition: 'all 0.2s',
              }}
                className={`fade-up-${Math.min(i + 1, 3)}`}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,180,0.25)'
                  e.currentTarget.style.background = '#162030'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1e2d45'
                  e.currentTarget.style.background = '#111827'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* Left */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h2 style={{
                        fontFamily: 'Syne', fontWeight: 700,
                        color: '#f0f4ff', fontSize: 18, margin: 0
                      }}>
                        {job.title}
                      </h2>
                      <span className="badge badge-green">Active</span>
                    </div>
                    <p style={{
                      color: '#8892a4', fontSize: 14, lineHeight: 1.6,
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {job.description}
                    </p>
                    {job.requirements && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {job.requirements.split(',').slice(0, 5).map(s => (
                          <span key={s} style={{
                            background: '#1a2236', color: '#8892a4',
                            fontSize: 12, padding: '3px 10px',
                            borderRadius: 20, border: '1px solid #1e2d45'
                          }}>
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ color: '#4a5568', fontSize: 12 }}>
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right — buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 24, flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="btn-primary"
                      style={{ padding: '8px 20px' }}
                    >
                      View & Apply
                    </button>
                    {user?.role === 'candidate' && (
                      <button
                        onClick={() => toggleSave(job.id)}
                        disabled={savingId === job.id}
                        style={{
                          padding: '8px 20px', fontSize: 14, borderRadius: 8,
                          border: `1px solid ${savedIds.has(job.id) ? 'rgba(245,158,11,0.4)' : '#1e2d45'}`,
                          background: savedIds.has(job.id) ? 'rgba(245,158,11,0.08)' : 'transparent',
                          color: savedIds.has(job.id) ? '#f59e0b' : '#8892a4',
                          cursor: 'pointer', transition: 'all 0.2s',
                          opacity: savingId === job.id ? 0.5 : 1
                        }}
                      >
                        {savingId === job.id ? '...' : savedIds.has(job.id) ? '★ Saved' : '☆ Save'}
                      </button>
                    )}
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