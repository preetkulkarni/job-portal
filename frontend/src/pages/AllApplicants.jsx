import { useState, useEffect } from 'react'
import apiClient from '../api/client'

export default function AllApplicants() {
  const [jobsWithApplicants, setJobsWithApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedJobs, setExpandedJobs] = useState({})

  useEffect(() => {
    async function loadAll() {
      try {
        const jobsRes = await apiClient.get('/jobs/recruiter/all-jobs')
        const jobs = jobsRes.data

        const results = await Promise.all(
          jobs.map(async (job) => {
            try {
              const res = await apiClient.get(`/dashboard/jobs/${job.job_id}`)
              return {
                ...job,
                applicants: res.data.applicants || res.data.applications || []
              }
            } catch {
              return { ...job, applicants: [] }
            }
          })
        )
        setJobsWithApplicants(results)

        // Auto expand jobs that have applicants
        const expanded = {}
        results.forEach(j => {
          if (j.applicants.length > 0) expanded[j.job_id] = true
        })
        setExpandedJobs(expanded)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  async function updateStatus(jobId, applicationId, status) {
    setUpdatingId(applicationId)
    try {
      await apiClient.patch(`/dashboard/applications/${applicationId}/status`, { status })
      setJobsWithApplicants(prev => prev.map(job => {
        if (job.job_id !== jobId) return job
        return {
          ...job,
          applicants: job.applicants.map(a =>
            (a.id === applicationId || a.application_id === applicationId)
              ? { ...a, status }
              : a
          )
        }
      }))
    } catch (err) {
      alert(err.userMessage || 'Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  function toggleJob(jobId) {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }))
  }

  const statusColor = {
    applied: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    reviewed: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    shortlisted: { bg: 'rgba(0,212,180,0.1)', color: '#00d4b4', border: 'rgba(0,212,180,0.3)' },
    rejected: { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
  }

  const totalApplicants = jobsWithApplicants.reduce((sum, j) => sum + j.applicants.length, 0)
  const totalShortlisted = jobsWithApplicants.reduce((sum, j) =>
    sum + j.applicants.filter(a => (a.status?.value || a.status) === 'shortlisted').length, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#4a5568', fontSize: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #00d4b4', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      Loading all applicants...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: '#00d4b4', fontSize: 13, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Recruiter</p>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>All Applicants</h1>
          <p style={{ color: '#8892a4', fontSize: 14 }}>View and manage applicants across all your job postings</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Jobs', value: jobsWithApplicants.length, color: '#3b82f6', icon: '💼' },
            { label: 'Total Applicants', value: totalApplicants, color: '#00d4b4', icon: '👥' },
            { label: 'Shortlisted', value: totalShortlisted, color: '#34d399', icon: '⭐' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color }}>{value}</span>
              </div>
              <p style={{ color: '#8892a4', fontSize: 13 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Jobs with applicants */}
        {jobsWithApplicants.length === 0 ? (
          <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: '#4a5568', fontSize: 14 }}>No jobs posted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobsWithApplicants.map(job => {
              const isExpanded = expandedJobs[job.job_id]
              return (
                <div key={job.job_id} style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden' }}>

                  {/* Job Header — clickable to expand/collapse */}
                  <button onClick={() => toggleJob(job.job_id)}
                    style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderBottom: isExpanded ? '1px solid #1e2d45' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 15 }}>{job.title}</p>
                        <p style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>{job.requirements?.slice(0, 60)}...</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        background: job.is_active ? 'rgba(0,212,180,0.1)' : '#1a2236',
                        color: job.is_active ? '#00d4b4' : '#4a5568',
                        border: `1px solid ${job.is_active ? 'rgba(0,212,180,0.3)' : '#1e2d45'}`,
                        fontSize: 11, fontWeight: 600, fontFamily: 'Syne',
                        padding: '3px 10px', borderRadius: 20
                      }}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontSize: 12, fontWeight: 700, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                        {job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ color: '#4a5568', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Applicants list */}
                  {isExpanded && (
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {job.applicants.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                          <p style={{ color: '#4a5568', fontSize: 13 }}>No applicants yet for this job</p>
                        </div>
                      ) : job.applicants.map((a, i) => {
                        const appId = a.id || a.application_id
                        const statusVal = a.status?.value || a.status || 'applied'
                        const sc = statusColor[statusVal] || statusColor.applied
                        return (
                          <div key={appId} style={{ background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, color: '#00d4b4', fontSize: 13, flexShrink: 0 }}>
                                  #{i + 1}
                                </div>
                                <div>
                                  <p style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 14 }}>
                                    {a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : `Candidate ${i + 1}`}
                                  </p>
                                  <p style={{ color: '#4a5568', fontSize: 12 }}>
                                    Applied {new Date(a.applied_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {a.semantic_match_score != null && (
                                  <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontFamily: 'Syne', fontWeight: 800, color: '#00d4b4', fontSize: 18 }}>
                                      {Math.round(a.semantic_match_score * 100)}%
                                    </p>
                                    <p style={{ color: '#4a5568', fontSize: 11 }}>match</p>
                                  </div>
                                )}
                                <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: 11, fontWeight: 600, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                                  {statusVal}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => updateStatus(job.job_id, appId, 'shortlisted')}
                                disabled={updatingId === appId || statusVal === 'shortlisted'}
                                style={{ flex: 1, padding: '7px 0', fontSize: 12, borderRadius: 8, cursor: statusVal === 'shortlisted' ? 'default' : 'pointer', border: '1px solid rgba(0,212,180,0.3)', background: statusVal === 'shortlisted' ? 'rgba(0,212,180,0.15)' : 'rgba(0,212,180,0.05)', color: '#00d4b4', fontFamily: 'Syne', fontWeight: 600, opacity: updatingId === appId ? 0.5 : 1 }}>
                                ⭐ Shortlist
                              </button>
                              <button onClick={() => updateStatus(job.job_id, appId, 'rejected')}
                                disabled={updatingId === appId || statusVal === 'rejected'}
                                style={{ flex: 1, padding: '7px 0', fontSize: 12, borderRadius: 8, cursor: statusVal === 'rejected' ? 'default' : 'pointer', border: '1px solid rgba(248,113,113,0.3)', background: statusVal === 'rejected' ? 'rgba(248,113,113,0.15)' : 'rgba(248,113,113,0.05)', color: '#f87171', fontFamily: 'Syne', fontWeight: 600, opacity: updatingId === appId ? 0.5 : 1 }}>
                                ✕ Reject
                              </button>
                              <button onClick={() => updateStatus(job.job_id, appId, 'applied')}
                                disabled={updatingId === appId || statusVal === 'applied'}
                                style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #1e2d45', background: 'transparent', color: '#4a5568', fontFamily: 'Syne', fontWeight: 600, opacity: updatingId === appId ? 0.5 : 1 }}>
                                ↺
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}