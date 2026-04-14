import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [file, setFile] = useState(null)
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    apiClient.get(`/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    if (user?.role === 'candidate') {
      apiClient.get('/applications/me')
        .then(r => setApplied(r.data.some(a => String(a.job_id) === String(id))))
        .catch(() => {})
    }
  }, [id])

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Only PDF files are supported.'); return }
    if (f.size > 10 * 1024 * 1024) { setError('File size must be under 10MB.'); return }
    setFile(f); setError('')
  }

  async function handleApply(e) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!file) { setError('Please upload your resume PDF.'); return }
    setSubmitting(true); setError('')
    const formData = new FormData()
    formData.append('job_id', id)
    formData.append('resume_file', file)
    try {
      await apiClient.post('/applications/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setApplied(true)
      setSuccess('Application submitted successfully!')
      setFile(null)
    } catch (err) {
      setError(err.userMessage || 'Failed to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20 gap-2"
      style={{ color: 'var(--text-muted)', fontSize: 14 }}>
      <div className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
      Loading...
    </div>
  )

  if (!job) return (
    <div className="text-center py-20" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
      Job not found.
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/jobs')}
        style={{ color: 'var(--teal)', fontSize: 14, background: 'none', border: 'none',
          cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back to Jobs
      </button>

      <div className="card p-8 fade-up">
        {/* Header */}
        <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="badge badge-green mb-3" style={{ display: 'inline-block' }}>Active</span>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800,
            color: 'var(--text-primary)' }} className="mb-2">
            {job.title}
          </h1>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-muted)',
            fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }} className="mb-3">
            Job Description
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>
            {job.description}
          </p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="mb-6">
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-muted)',
              fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }} className="mb-3">
              Skills Required
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requirements.split(',').map(s => (
                <span key={s} style={{ background: 'var(--teal-dim)', color: 'var(--teal)',
                  border: '1px solid var(--teal-border)', fontSize: 13,
                  padding: '4px 12px', borderRadius: 20 }}>
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply section */}
        {user?.role === 'candidate' && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            {applied ? (
              <div className="rounded-xl p-4"
                style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-border)' }}>
                <p style={{ color: 'var(--teal)', fontFamily: 'Syne', fontWeight: 600, fontSize: 14 }}>
                  ✓ You have already applied for this position
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-primary)',
                  fontSize: 16 }}>
                  Apply for this position
                </h3>

                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 13 }} className="block mb-1.5">
                    Your Skills
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                      (comma separated — improves match accuracy)
                    </span>
                  </label>
                  <input className="input" type="text" value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. Python, React, FastAPI, PostgreSQL" />
                </div>

                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 13 }} className="block mb-1.5">
                    Years of Experience
                  </label>
                  <input className="input" type="number" min="0" max="50"
                    value={experience} onChange={e => setExperience(e.target.value)}
                    placeholder="e.g. 3" />
                </div>

                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 13 }} className="block mb-1.5">
                    Resume <span style={{ color: '#f87171' }}>*</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>(PDF only)</span>
                  </label>
                  <div className="rounded-xl p-6 text-center transition-colors"
                    style={{ border: `2px dashed ${file ? 'var(--teal)' : 'var(--border)'}`,
                      background: file ? 'var(--teal-dim)' : 'var(--navy-3)' }}>
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <span style={{ fontSize: 20 }}>📄</span>
                        <span style={{ color: 'var(--teal)', fontWeight: 600, fontSize: 14 }}>
                          {file.name}
                        </span>
                        <button type="button" onClick={() => setFile(null)}
                          style={{ color: 'var(--text-muted)', fontSize: 20, background: 'none',
                            border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }} className="mb-2">
                          Drop your resume here or{' '}
                          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>browse</span>
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>PDF only, max 10MB</p>
                        <input type="file" accept="application/pdf"
                          onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg px-4 py-3 text-sm"
                    style={{ background: '#f8717120', border: '1px solid #f8717140', color: '#f87171' }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg px-4 py-3 text-sm"
                    style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
                      color: 'var(--teal)' }}>
                    {success}
                  </div>
                )}

                <button type="submit" disabled={submitting || !file}
                  className="btn-primary w-full" style={{ padding: '13px' }}>
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
                      Submitting...
                    </span>
                  ) : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        )}

        {!user && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={() => navigate('/login')} className="btn-primary"
              style={{ padding: '12px 24px' }}>
              Login to Apply
            </button>
          </div>
        )}
      </div>
    </div>
  )
}