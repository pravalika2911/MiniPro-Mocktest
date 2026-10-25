import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Password Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Only Gmail email addresses are allowed to register.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Hardcoded student role as per security requirements
      await register(formData.name, formData.email, formData.password, 'student');
      setIsSuccess(true);

      // Redirect explicitly to the student login portal after successful registration.
      setTimeout(() => {
        navigate('/gate/student', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ── Google Font preload ── */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      />

      {/* ── Background Watermark ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.05]">
        <UserPlus className="w-[400px] h-[400px] text-white" />
      </div>

      {/* ── Subtle dot-grid texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Card ── */}
      <div className="w-full max-w-md relative z-10 transition-all duration-500">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 opacity-80" />
            <span className="text-white/60 text-xs font-semibold tracking-[0.25em] uppercase">
              Recruitment Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Initiate Sequence
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Create your candidate credentials to access the Sentinel Protocol.
          </p>
        </div>

        {/* Glassmorphism card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Top accent line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          <div className="p-8">
            {/* ── Success Overlay ── */}
            {isSuccess && (
              <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Registration Validated</h3>
                <p className="text-slate-400 text-sm">Redirecting to Authorization Portal...</p>
              </div>
            )}

            {/* ── Error Banner ── */}
            {error && (
              <div
                className="mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm text-red-300"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 text-emerald-400">
                  <User className="w-3.5 h-3.5" />
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 placeholder-slate-600"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 text-emerald-400">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 placeholder-slate-600"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 placeholder-slate-600 tracking-widest"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                
                {/* Password Strength Indicator (Static UI as requested) */}
                {formData.password && (
                  <div className="flex gap-1 pt-1 px-1">
                    <div className="h-1 flex-1 bg-emerald-500 rounded-full" />
                    <div className="h-1 flex-1 bg-emerald-500/40 rounded-full" />
                    <div className="h-1 flex-1 bg-white/10 rounded-full" />
                    <div className="h-1 flex-1 bg-white/10 rounded-full" />
                  </div>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 placeholder-slate-600 tracking-widest"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full py-4 rounded-xl text-white font-bold text-sm bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.55)] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Register Candidate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <p className="text-slate-400 text-sm">
                Already have clearance?{' '}
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 transition-colors duration-200"
                >
                  Return to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
