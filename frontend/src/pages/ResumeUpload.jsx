import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

export default function ResumeUpload() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    apiClient.get('/jobs')
      .then(res => setJobs(res.data))
      .catch(() => {})
  }, [])

  function handleFileChange(e) { validateAndSetFile(e.target.files[0]) }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    validateAndSetFile(e.dataTransfer.files[0])
  }

  function validateAndSetFile(f) {
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Only PDF files are supported.'); setFile(null); return }
    if (f.size > 10 * 1024 * 1024) { setError('File size must be under 10MB.'); setFile(null); return }
    setFile(f); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedJobId) { setError('Please select a job to apply for.'); return }
    if (!file) { setError('Please upload your resume PDF.'); return }
    setUploading(true); setError(''); setSuccess('')
    const formData = new FormData()
    formData.append('job_id', selectedJobId)
    formData.append('resume_file', file)
    try {
      await apiClient.post('/applications/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess('Application submitted! Your resume is being processed.')
      setFile(null); setSelectedJobId(''); setSkills(''); setExperience('')
    } catch (err) {
      setError(err.userMessage || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="fade-up">
          <p style={{
            color: '#00d4b4', fontSize: 13, fontFamily: 'Syne',
            fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4
          }}>
            Apply
          </p>
          <h1 style={{
            fontFamily: 'Syne', fontSize: 36, fontWeight: 800,
            color: '#f0f4ff', marginBottom: 8, lineHeight: 1.2
          }}>
            Upload Resume
          </h1>
          <p style={{ color: '#8892a4', fontSize: 14 }}>
            Our AI will extract your skills and match you with the role
          </p>
        </div>

        <form onSubmit={handleSubmit} className="fade-up-1">

          {/* Job selector */}
          <div style={{
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: 12, padding: 20, marginBottom: 16
          }}>
            <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>
              Select Job to Apply For <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => { setSelectedJobId(e.target.value); setError('') }}
              className="input"
            >
              <option value="">-- Choose a job --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            {jobs.length === 0 && (
              <p style={{ color: '#f59e0b', fontSize: 12, marginTop: 6 }}>
                No jobs available right now.
              </p>
            )}
          </div>

          {/* Skills + Experience */}
          <div style={{
            background: '#111827', border: '1px solid #1e2d45',
            borderRadius: 12, padding: 20, marginBottom: 16
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>
                Your Skills
                <span style={{ color: '#4a5568', marginLeft: 6 }}>
                  (comma separated — improves match accuracy)
                </span>
              </label>
              <input
                className="input"
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Python, React, FastAPI, PostgreSQL, Docker"
              />
            </div>
            <div>
              <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>
                Years of Experience
              </label>
              <input
                className="input"
                type="number"
                min="0"
                max="50"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
          </div>

          {/* File drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              borderRadius: 12, padding: 32, textAlign: 'center',
              border: `2px dashed ${dragging ? '#00d4b4' : file ? '#00d4b4' : '#1e2d45'}`,
              background: dragging || file ? 'rgba(0,212,180,0.05)' : '#111827',
              transition: 'all 0.2s', marginBottom: 16
            }}
          >
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, color: '#00d4b4', fontSize: 14 }}>{file.name}</p>
                  <p style={{ color: '#4a5568', fontSize: 12 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={{
                    color: '#4a5568', fontSize: 22, background: 'none',
                    border: 'none', cursor: 'pointer', lineHeight: 1, marginLeft: 8
                  }}
                >×</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📁</p>
                <p style={{ color: '#8892a4', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  Drag & drop your resume here
                </p>
                <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 16 }}>
                  PDF only, max 10MB
                </p>
                <label style={{ cursor: 'pointer' }}>
                  <span className="btn-primary" style={{ display: 'inline-block', padding: '8px 20px' }}>
                    Browse File
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', borderRadius: 8, padding: '12px 16px',
              fontSize: 14, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)',
              color: '#00d4b4', borderRadius: 8, padding: '12px 16px',
              fontSize: 14, marginBottom: 16
            }}>
              {success}
              <button
                type="button"
                onClick={() => navigate('/candidate/dashboard')}
                style={{
                  marginLeft: 12, textDecoration: 'underline', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer', color: '#00d4b4'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !file || !selectedJobId}
            className="btn-primary"
            style={{ width: '100%', padding: 13 }}
          >
            {uploading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid #0a0f1e', borderTopColor: 'transparent',
                  display: 'inline-block', animation: 'spin 0.8s linear infinite'
                }} />
                Uploading & Processing...
              </span>
            ) : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}