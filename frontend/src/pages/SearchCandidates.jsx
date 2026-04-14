import { useState, useEffect } from 'react'
import apiClient from '../api/client'

export default function SearchCandidates() {
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [topK, setTopK] = useState(10)
  const [minScore, setMinScore] = useState(0)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient.get('/jobs/recruiter/all-jobs')
      .then(res => setJobs(res.data))
      .catch(() => {})
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!selectedJobId) { setError('Please select a job first.'); return }
    setLoading(true); setError(''); setResults(null)
    try {
      const { data } = await apiClient.post('/search/candidates', {
        job_id: selectedJobId,
        top_k: topK,
        min_score: minScore / 100,
      })
      setResults(data)
    } catch (err) {
      setError(err.userMessage || 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  const scoreStyle = (score) => {
    if (score >= 70) return { stroke: '#00d4b4', cls: 'badge-green', label: 'Strong Match' }
    if (score >= 40) return { stroke: '#f59e0b', cls: 'badge-amber', label: 'Moderate Match' }
    return { stroke: '#f87171', cls: 'badge-red', label: 'Weak Match' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 fade-up">
          <p style={{
            color: 'var(--teal)', fontSize: 13, fontFamily: 'Syne',
            fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4
          }}>
            AI Search
          </p>
          <h1 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>
            Find Talent
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Semantic AI matching — find candidates whose skills align with your job requirements
          </p>
        </div>

        {/* Search Form */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24, marginBottom: 32
        }} className="fade-up-1">
          <form onSubmit={handleSearch}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>
                Select Job Posting
              </label>
              <select value={selectedJobId}
                onChange={(e) => { setSelectedJobId(e.target.value); setError('') }}
                className="input">
                <option value="">-- Choose a job --</option>
                {jobs.map((job) => (
                  <option key={job.job_id} value={job.job_id}>{job.title}</option>
                ))}
              </select>
              {jobs.length === 0 && (
                <p style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>
                  No jobs found. Post a job first.
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  Number of Results
                </label>
                <input type="number" min={1} max={100} value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))} className="input" />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  Minimum Match % (0–100)
                </label>
                <input type="number" min={0} max={100} value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))} className="input" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full"
              style={{ padding: 13, width: '100%' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid #0a0f1e', borderTopColor: 'transparent',
                    display: 'inline-block', animation: 'spin 0.8s linear infinite'
                  }} />
                  Searching with AI...
                </span>
              ) : '🔍 Find Matching Candidates'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171', borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 24
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                <span style={{ color: 'var(--teal)', fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>
                  {results.total_found}
                </span>{' '}
                candidate{results.total_found !== 1 ? 's' : ''} found
              </p>
            </div>

            {results.total_found === 0 ? (
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 48, textAlign: 'center'
              }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  No candidates matched. Try lowering the minimum score or uploading more resumes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {results.matches.map((c, i) => {
                  const { stroke, cls, label } = scoreStyle(c.match_score)
                  return (
                    <div key={c.candidate_id} style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: 20,
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          {/* Rank badge */}
                          <div style={{
                            width: 40, height: 40,
                            background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
                            borderRadius: 10, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontFamily: 'Syne',
                            fontWeight: 700, color: 'var(--teal)', fontSize: 14, flexShrink: 0
                          }}>
                            #{i + 1}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16, marginBottom: 4 }}>
                              {c.first_name} {c.last_name}
                            </p>
                            {c.headline && (
                              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.headline}</p>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span className={`badge ${cls}`}>{label}</span>
                          <div style={{ position: 'relative', width: 64, height: 64 }}>
                            <svg viewBox="0 0 36 36" style={{ width: 64, height: 64, transform: 'rotate(-90deg)' }}>
                              <circle cx="18" cy="18" r="15.9" fill="none"
                                stroke="var(--border)" strokeWidth="2.5" />
                              <circle cx="18" cy="18" r="15.9" fill="none"
                                stroke={stroke} strokeWidth="2.5"
                                strokeDasharray={`${c.match_score} ${100 - c.match_score}`}
                                strokeLinecap="round" />
                            </svg>
                            <span style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#f0f4ff'
                            }}>
                              {c.match_score}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}