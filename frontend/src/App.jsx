import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import ResumeUpload from "./pages/ResumeUpload";
import SearchCandidates from "./pages/SearchCandidates";
import SavedJobs from "./pages/SavedJobs";
import AllApplicants from "./pages/AllApplicants";
import Navbar from "./components/Navbar";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function CandidateRoute({ children }) {
  const { isAuthenticated, isCandidate, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isCandidate) return <Navigate to="/recruiter/dashboard" replace />;
  return children;
}

function RecruiterRoute({ children }) {
  const { isAuthenticated, isRecruiter, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isRecruiter) return <Navigate to="/candidate/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isCandidate, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (isAuthenticated)
    return <Navigate to={isCandidate ? "/candidate/dashboard" : "/recruiter/dashboard"} replace />;
  return children;
}

function RootRedirect() {
  const { isAuthenticated, isCandidate, user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to={isCandidate ? "/candidate/dashboard" : "/recruiter/dashboard"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />

          {/* Candidate only */}
          <Route path="/candidate/dashboard" element={
            <CandidateRoute><Layout><CandidateDashboard /></Layout></CandidateRoute>
          } />
          <Route path="/resume/upload" element={
            <CandidateRoute><Layout><ResumeUpload /></Layout></CandidateRoute>
          } />
          <Route path="/saved-jobs" element={
            <CandidateRoute><Layout><SavedJobs /></Layout></CandidateRoute>
          } />

          {/* Recruiter only */}
          <Route path="/recruiter/dashboard" element={
            <RecruiterRoute><Layout><RecruiterDashboard /></Layout></RecruiterRoute>
          } />
          <Route path="/search-candidates" element={
            <RecruiterRoute><Layout><SearchCandidates /></Layout></RecruiterRoute>
          } />
          <Route path="/post-job" element={
            <RecruiterRoute><Layout><PostJob /></Layout></RecruiterRoute>
          } />
          <Route path="/recruiter/applicants" element={
  <RecruiterRoute><Layout><AllApplicants /></Layout></RecruiterRoute>
} />
          {/* Admin only */}
          <Route path="/admin/dashboard" element={
            <AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>
          } />

          {/* Shared authenticated */}
          <Route path="/jobs" element={
            <PrivateRoute><Layout><Jobs /></Layout></PrivateRoute>
          } />
          <Route path="/jobs/:id" element={
            <PrivateRoute><Layout><JobDetail /></Layout></PrivateRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                <p className="text-gray-500 mb-4">Page not found.</p>
                <a href="/" className="text-blue-600 hover:underline text-sm">Go home</a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}