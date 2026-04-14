import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", requirements: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Edit state
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", requirements: "" });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Side panel state
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchJobs() }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await apiClient.get("/jobs/recruiter/all-jobs");
      setJobs(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.requirements.trim()) { setFormError("Requirements are required."); return; }
    setSubmitting(true); setFormError("");
    try {
      await apiClient.post("/jobs", form);
      setForm({ title: "", description: "", requirements: "" });
      setShowModal(false);
      fetchJobs();
    } catch (err) { setFormError(err.userMessage || "Failed to create job."); }
    finally { setSubmitting(false); }
  }

  async function handleEditJob(e) {
    e.preventDefault();
    if (!editForm.title.trim()) { setEditError("Title is required."); return; }
    if (!editForm.description.trim()) { setEditError("Description is required."); return; }
    if (!editForm.requirements.trim()) { setEditError("Requirements are required."); return; }
    setEditSubmitting(true); setEditError("");
    try {
      await apiClient.patch(`/jobs/${editingJob.job_id}`, editForm);
      setEditingJob(null);
      fetchJobs();
    } catch (err) { setEditError(err.userMessage || "Failed to update job."); }
    finally { setEditSubmitting(false); }
  }

  async function handleDelete(jobId) {
    setDeletingId(jobId);
    try {
      await apiClient.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.job_id !== jobId));
      if (selectedJob?.job_id === jobId) setSelectedJob(null);
    } catch (err) { alert(err.userMessage || "Failed to delete job."); }
    finally { setDeletingId(null); }
  }

  async function handleToggleActive(jobId, currentStatus) {
    try {
      await apiClient.patch(`/jobs/${jobId}`, { is_active: !currentStatus });
      setJobs(prev => prev.map(j => j.job_id === jobId ? { ...j, is_active: !currentStatus } : j));
    } catch (err) { alert(err.userMessage || "Failed to update job."); }
  }

  async function openPanel(job) {
    setSelectedJob(job);
    setPanelLoading(true);
    setApplicants([]);
    try {
      const res = await apiClient.get(`/dashboard/jobs/${job.job_id}`);
      setApplicants(res.data.applicants || res.data.applications || []);
    } catch (err) {
      console.error(err);
      setApplicants([]);
    } finally {
      setPanelLoading(false);
    }
  }

  async function updateStatus(applicationId, status) {
    setUpdatingId(applicationId);
    try {
      await apiClient.patch(`/dashboard/applications/${applicationId}/status`, { status });
      setApplicants(prev => prev.map(a =>
        (a.id === applicationId || a.application_id === applicationId)
          ? { ...a, status }
          : a
      ));
    } catch (err) { alert(err.userMessage || "Failed to update status."); }
    finally { setUpdatingId(null); }
  }

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.is_active).length;
  const inactiveJobs = totalJobs - activeJobs;

  const statusColor = {
    applied: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    reviewed: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    shortlisted: { bg: 'rgba(0,212,180,0.1)', color: '#00d4b4', border: 'rgba(0,212,180,0.3)' },
    rejected: { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }} className="fade-up">
          <div>
            <p style={{ color: '#00d4b4', fontSize: 13, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Recruiter Dashboard</p>
            <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>Welcome, {user?.first_name}</h1>
            <p style={{ color: '#8892a4', fontSize: 14 }}>Manage your job postings and find top talent</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>+ Post a Job</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Jobs', value: totalJobs, color: '#3b82f6', icon: '💼' },
            { label: 'Active', value: activeJobs, color: '#00d4b4', icon: '✅' },
            { label: 'Inactive', value: inactiveJobs, color: '#4a5568', icon: '⏸️' },
          ].map(({ label, value, color, icon }, i) => (
            <div key={label} className={`fade-up-${i + 1}`}
              style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color }}>{value}</span>
              </div>
              <p style={{ color: '#8892a4', fontSize: 13 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {[
            { to: '/search-candidates', icon: '🔍', label: 'Find Talent', desc: 'AI semantic search' },
            { to: '/jobs', icon: '👁️', label: 'Browse All Jobs', desc: 'See candidate view' },
          ].map(({ to, icon, label, desc }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none', background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, width: 40, height: 40, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 600, color: '#f0f4ff', fontSize: 14 }}>{label}</p>
                  <p style={{ color: '#4a5568', fontSize: 12 }}>{desc}</p>
                </div>
              </div>
              <span style={{ color: '#00d4b4', fontSize: 18 }}>→</span>
            </Link>
          ))}
        </div>

        {/* Jobs Table */}
        <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e2d45' }}>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>My Job Postings</h2>
            <span style={{ color: '#4a5568', fontSize: 13 }}>{jobs.length} total</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0', gap: 8, color: '#4a5568', fontSize: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #00d4b4', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Loading jobs…
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 16 }}>No jobs posted yet.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">Post your first job →</button>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2d45' }}>
                  {['Title', 'Requirements', 'Status', 'Posted', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#4a5568', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Syne' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.job_id}
                    style={{ borderBottom: '1px solid #1e2d45', background: selectedJob?.job_id === job.job_id ? '#162030' : 'transparent', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <button onClick={() => openPanel(job)}
                        style={{ fontWeight: 600, color: selectedJob?.job_id === job.job_id ? '#00d4b4' : '#f0f4ff', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                        {job.title}
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#8892a4', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.requirements}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={job.is_active ? 'badge badge-green' : 'badge'}
                        style={!job.is_active ? { background: '#1a2236', color: '#4a5568', border: '1px solid #1e2d45' } : {}}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#4a5568', fontSize: 13 }}>{new Date(job.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                        {/* View Applicants */}
                        <button onClick={() => openPanel(job)}
                          style={{ color: '#00d4b4', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne', fontWeight: 600 }}>
                          👥 Applicants
                        </button>

                        {/* Edit */}
                        <button onClick={() => {
                          setEditingJob(job);
                          setEditForm({ title: job.title, description: job.description, requirements: job.requirements });
                          setEditError("");
                        }}
                          style={{ color: '#f59e0b', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne', fontWeight: 600 }}>
                          ✏️ Edit
                        </button>

                        {/* Toggle Active */}
                        <button onClick={() => handleToggleActive(job.job_id, job.is_active)}
                          style={{ color: job.is_active ? '#f59e0b' : '#00d4b4', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne', fontWeight: 600 }}>
                          {job.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete */}
                        <button onClick={() => handleDelete(job.job_id)} disabled={deletingId === job.job_id}
                          style={{ color: '#f87171', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', opacity: deletingId === job.job_id ? 0.5 : 1, fontFamily: 'Syne', fontWeight: 600 }}>
                          {deletingId === job.job_id ? 'Deleting…' : 'Delete'}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {selectedJob && (
        <>
          <div onClick={() => setSelectedJob(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: '#111827', borderLeft: '1px solid #1e2d45', zIndex: 50, overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#111827', zIndex: 1 }}>
              <div>
                <p style={{ color: '#00d4b4', fontSize: 11, fontFamily: 'Syne', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Applicants</p>
                <h2 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#f0f4ff' }}>{selectedJob.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ color: '#4a5568', fontSize: 12 }}>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)}
                style={{ color: '#4a5568', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {panelLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', gap: 8, color: '#4a5568', fontSize: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #00d4b4', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  Loading applicants…
                </div>
              ) : applicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
                  <p style={{ color: '#8892a4', fontSize: 15, fontFamily: 'Syne', fontWeight: 600, marginBottom: 8 }}>No applicants yet</p>
                  <p style={{ color: '#4a5568', fontSize: 13 }}>Share the job to attract candidates</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {applicants.map((a, i) => {
                    const appId = a.id || a.application_id
                    const statusVal = a.status?.value || a.status || 'applied'
                    const sc = statusColor[statusVal] || statusColor.applied
                    return (
                      <div key={appId} style={{ background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, background: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, color: '#00d4b4', fontSize: 13 }}>
                              #{i + 1}
                            </div>
                            <div>
                              <p style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 14 }}>
                                {a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : `Candidate ${i + 1}`}
                              </p>
                              <p style={{ color: '#4a5568', fontSize: 12 }}>Applied {new Date(a.applied_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {a.semantic_match_score != null && (
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ fontFamily: 'Syne', fontWeight: 800, color: '#00d4b4', fontSize: 18 }}>{Math.round(a.semantic_match_score * 100)}%</p>
                              <p style={{ color: '#4a5568', fontSize: 11 }}>match</p>
                            </div>
                          )}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: 11, fontWeight: 600, fontFamily: 'Syne', padding: '3px 10px', borderRadius: 20 }}>
                            {statusVal}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => updateStatus(appId, 'shortlisted')} disabled={updatingId === appId || statusVal === 'shortlisted'}
                            style={{ flex: 1, padding: '7px 0', fontSize: 12, borderRadius: 8, cursor: statusVal === 'shortlisted' ? 'default' : 'pointer', border: '1px solid rgba(0,212,180,0.3)', background: statusVal === 'shortlisted' ? 'rgba(0,212,180,0.15)' : 'rgba(0,212,180,0.05)', color: '#00d4b4', fontFamily: 'Syne', fontWeight: 600, opacity: updatingId === appId ? 0.5 : 1 }}>
                            ⭐ Shortlist
                          </button>
                          <button onClick={() => updateStatus(appId, 'rejected')} disabled={updatingId === appId || statusVal === 'rejected'}
                            style={{ flex: 1, padding: '7px 0', fontSize: 12, borderRadius: 8, cursor: statusVal === 'rejected' ? 'default' : 'pointer', border: '1px solid rgba(248,113,113,0.3)', background: statusVal === 'rejected' ? 'rgba(248,113,113,0.15)' : 'rgba(248,113,113,0.05)', color: '#f87171', fontFamily: 'Syne', fontWeight: 600, opacity: updatingId === appId ? 0.5 : 1 }}>
                            ✕ Reject
                          </button>
                          <button onClick={() => updateStatus(appId, 'applied')} disabled={updatingId === appId || statusVal === 'applied'}
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
          </div>
        </>
      )}

      {/* Create Job Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '0 16px', background: 'rgba(0,0,0,0.75)' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(0,212,180,0.25)', borderRadius: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1e2d45' }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>Post a New Job</h3>
              <button onClick={() => { setShowModal(false); setFormError(''); }} style={{ color: '#4a5568', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleCreateJob} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '12px 16px', fontSize: 14 }}>{formError}</div>}
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Job Title</label>
                <input className="input" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior React Developer" />
              </div>
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role…" rows={3} style={{ resize: 'none' }} />
              </div>
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Requirements</label>
                <textarea className="input" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="e.g. 3+ years React…" rows={3} style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setFormError(''); }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>{submitting ? 'Posting…' : 'Post Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '0 16px', background: 'rgba(0,0,0,0.75)' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1e2d45' }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#f0f4ff', fontSize: 16 }}>✏️ Edit Job</h3>
              <button onClick={() => { setEditingJob(null); setEditError(''); }} style={{ color: '#4a5568', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleEditJob} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {editError && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '12px 16px', fontSize: 14 }}>{editError}</div>}
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Job Title</label>
                <input className="input" type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ resize: 'none' }} />
              </div>
              <div>
                <label style={{ color: '#8892a4', fontSize: 13, display: 'block', marginBottom: 6 }}>Requirements</label>
                <textarea className="input" value={editForm.requirements} onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })} rows={3} style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => { setEditingJob(null); setEditError(''); }}>Cancel</button>
                <button type="submit" disabled={editSubmitting} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', fontFamily: 'Syne', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}