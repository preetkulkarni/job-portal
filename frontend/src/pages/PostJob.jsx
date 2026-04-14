import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function PostJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', company: '', location: '', salary_range: '', job_type: 'full-time', skills_required: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/jobs', form)
      navigate('/dashboard/recruiter')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post job')
    } finally { setLoading(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/dashboard/recruiter')} className="text-sm text-primary-600 mb-6 hover:underline">← Back</button>
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="font-display text-2xl font-bold text-slate-800 mb-6">Post a Job</h1>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['Job Title', 'title', 'text', 'e.g. Senior React Developer'], ['Company', 'company', 'text', 'e.g. Acme Corp'], ['Location', 'location', 'text', 'e.g. Remote / Bangalore'], ['Salary Range', 'salary_range', 'text', 'e.g. ₹12–18 LPA']].map(([label, key, type, placeholder]) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
              <input type={type} required value={form[key]} onChange={e => f(key, e.target.value)} placeholder={placeholder}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Job Type</label>
            <select value={form.job_type} onChange={e => f('job_type', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {['full-time', 'part-time', 'remote', 'contract', 'internship'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Skills Required (comma separated)</label>
            <input value={form.skills_required} onChange={e => f('skills_required', e.target.value)} required
              placeholder="React, Node.js, PostgreSQL"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Job Description</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} required rows={6}
              placeholder="Describe the role, responsibilities, requirements..."
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60">
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  )
}
