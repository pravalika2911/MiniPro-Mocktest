import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import MainLayout from './components/Layout/MainLayout';

// Auth Portals
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ResetPassword from './pages/Auth/ResetPassword';

// App Pages
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ExamInterface from './pages/ExamInterface';
import ResultPage from './pages/ResultPage';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';

// ─── Protected Route Guard ───────────────────────────────────────────────────
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user.role.toLowerCase() !== roleRequired.toLowerCase()) {
    // Role mismatch — redirect admin to admin-panel, student to dashboard
    return <Navigate to={user.role.toLowerCase() === 'admin' ? '/admin-panel' : '/dashboard'} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Landing Page ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Unified Auth Portal ── */}
        <Route path="/gate/student"   element={<Login />} />
        <Route path="/gate/admin"     element={<Login />} />
        <Route path="/student-login"  element={<Login />} />
        <Route path="/admin"          element={<Login />} />
        <Route path="/admin-login"    element={<Login />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ── Student Protected Routes (inside sidebar layout) ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route
            path="results/:id"
            element={
              <ProtectedRoute roleRequired="student">
                <ResultPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roleRequired="admin">
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Protected Routes ── */}
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* ── Exam (full-screen, no sidebar layout) ── */}
        <Route
          path="/exam/:id"
          element={
            <ProtectedRoute roleRequired="student">
              <ExamInterface />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
