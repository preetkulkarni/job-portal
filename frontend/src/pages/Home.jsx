import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl font-bold mb-4 leading-tight">Find Your Perfect Match<br />with AI-Powered Hiring</h1>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">TalentBridge uses semantic vector search to match candidates with jobs based on actual skills and experience, not just keywords.</p>
          <div className="flex justify-center gap-4">
            <Link to="/jobs" className="bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition">Browse Jobs</Link>
            {!user && <Link to="/register" className="bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition">Get Started</Link>}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-3 gap-6">
          {[['🔍 Semantic Search', 'Vector embeddings match resumes to jobs by meaning, not just keywords'],
            ['⚡ Instant Matching', 'See similarity scores instantly when recruiters search candidates'],
            ['🎯 Smart Shortlisting', 'Recruiters can shortlist, track, and manage applications in one place']].map(([title, desc]) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-2xl mb-3">{title.split(' ')[0]}</div>
              <h3 className="font-semibold text-slate-800 mb-2">{title.slice(3)}</h3>
              <p className="text-slate-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
