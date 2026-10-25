import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock,
  XCircle
} from 'lucide-react';

// ─── Animated Background Clock / Progress Ring ───────────────────────────────
const TimerMotif = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 360 ? 0 : p + 0.5));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const r = 140;
  const cx = 160;
  const cy = 160;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (progress / 360) * circumference;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        className="opacity-[0.04]"
        aria-hidden="true"
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 8" />
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="2"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.02s linear' }}
        />
        <circle cx={cx} cy={cy} r="100" fill="none" stroke="white" strokeWidth="0.5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + 130 * Math.cos(angle);
          const y1 = cy + 130 * Math.sin(angle);
          const x2 = cx + 140 * Math.cos(angle);
          const y2 = cy + 140 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" />;
        })}
        <circle cx={cx} cy={cy} r="4" fill="white" />
      </svg>
    </div>
  );
};

// ─── Loading Screen After Successful Auth ────────────────────────────────────
const SuccessTransition = ({ role }) => {
  const isAdmin = role === 'admin';
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
      <div
        className="w-20 h-20 rounded-full border-4 flex items-center justify-center mb-6 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.4)]"
        style={{ animation: 'pulse 1s ease-in-out infinite' }}
      >
        {isAdmin ? <ShieldCheck className="w-9 h-9 text-indigo-400" /> : <GraduationCap className="w-9 h-9 text-indigo-400" />}
      </div>
      <p className="text-sm font-black tracking-[0.3em] uppercase text-indigo-400">
        {isAdmin ? 'Uplinking to Command Console…' : 'Handshaking with Sentinel…'}
      </p>
    </div>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = () => {
  const [activeRole, setActiveRole] = useState('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });

  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired')) {
      setError('Your security session has expired. Please re-authenticate.');
    }
  }, []);

  useEffect(() => {
    const isAdminRoute =
      location.pathname.includes('/gate/admin') ||
      location.pathname.includes('/admin') ||
      location.pathname.includes('/admin-login');

    const isStudentRoute =
      location.pathname.includes('/gate/student') ||
      location.pathname.includes('/student-login') ||
      location.pathname.includes('/login');

    setActiveRole(isAdminRoute ? 'admin' : isStudentRoute ? 'candidate' : 'candidate');
  }, [location.pathname]);

  const isCandidate = activeRole === 'candidate';

  const accent = isCandidate
    ? {
        ring: 'focus:ring-indigo-500/40 focus:border-indigo-500',
        btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_4px_24px_rgba(79,70,229,0.35)]',
        toggleActive: 'bg-indigo-600 text-white shadow-md',
        labelColor: 'text-indigo-400',
        divider: 'from-transparent via-indigo-500/20 to-transparent'
      }
    : {
        ring: 'focus:ring-indigo-500/40 focus:border-indigo-500',
        btn: 'bg-slate-800 hover:bg-slate-700 shadow-[0_4px_24px_rgba(0,0,0,0.35)]',
        toggleActive: 'bg-slate-800 text-white shadow-md border border-white/10',
        labelColor: 'text-indigo-400',
        divider: 'from-transparent via-indigo-500/20 to-transparent'
      };

  const handleToggle = (role) => {
    if (role === activeRole) return;
    setActiveRole(role);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const portalRole = isCandidate ? 'student' : 'admin';

      if (!email.toLowerCase().endsWith('@gmail.com')) {
        throw new Error('Only Gmail addresses are allowed to register and log in.');
      }

      const loggedUser = await login(email, password, portalRole);
      setIsSuccess(true);
      setTimeout(() => {
        navigate(loggedUser.role === 'admin' ? '/admin-panel' : '/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authorization failed. Check system credentials.');
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    try {
      const response = await forgotPassword(forgotEmail);
      setForgotMsg({
        type: 'success',
        text: response.message || 'If an account exists, a reset link has been sent.'
      });
      setTimeout(() => setShowForgotModal(false), 3000);
    } catch (err) {
      setForgotMsg({
        type: 'error',
        text: err.response?.data?.message || (
          err.request
            ? 'Cannot reach the API. Start the backend server and try again.'
            : err.message || 'Failed to initiate password recovery.'
        )
      });
    } finally {
      setForgotLoading(false);
    }
  };

  if (isSuccess) return <SuccessTransition role={activeRole === 'candidate' ? 'student' : 'admin'} />;

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-300 font-sans">
      
      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#111114] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Password Recovery</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6 leading-relaxed">
              Enter your registered user ID to receive a reset key.
            </p>
            {forgotMsg.text && (
              <div className={`mb-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                forgotMsg.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
              }`}>
                {forgotMsg.text}
              </div>
            )}
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <input
                type="email" required value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="user@sentinel.io"
                className="w-full px-5 py-4 bg-black/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
              <button type="submit" disabled={forgotLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all">
                {forgotLoading ? 'Processing...' : 'Reset Access Key'}
              </button>
              <button type="button" onClick={() => setShowForgotModal(false)} className="w-full py-2 text-slate-500 hover:text-slate-300 font-black text-[9px] uppercase tracking-widest transition-colors">
                Cancel Protocol
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Background Accents ── */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <TimerMotif />

      {/* ── Card ── */}
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-black tracking-[0.4em] uppercase">Sentinel Protocol</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Authentication</h1>
          <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">Level 1 Authorization Required</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-2xl shadow-2xl">
          <div className={`h-1 w-full transition-all duration-500 ${isCandidate ? 'bg-indigo-600' : 'bg-slate-700'}`} />
          <div className="p-8">
            {!isCandidate && (
              <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
                Total Sentinel lock: one secure admin account only. Other admin registrations are disabled to protect platform integrity.
              </div>
            )}
            {/* Role Toggle */}
            <div className="relative flex rounded-xl p-1 mb-8 bg-black/40">
              <div className={`absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg transition-all duration-300 ease-out ${accent.toggleActive}`}
                style={{ left: isCandidate ? '4px' : 'calc(50% + 2px)' }} />
              <button onClick={() => handleToggle('candidate')} className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isCandidate ? 'text-white' : 'text-slate-500'}`}>
                Candidate Node
              </button>
              <button onClick={() => handleToggle('admin')} className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${!isCandidate ? 'text-white' : 'text-slate-500'}`}>
                Admin Node
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${accent.labelColor}`}>
                  <Mail className="w-3.5 h-3.5" /> User ID / Email
                </label>
                <input type="email" required disabled={isSubmitting} value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={isCandidate ? 'student@gmail.com' : 'admin@gmail.com'}
                  className={`w-full px-5 py-4 rounded-xl text-white text-sm outline-none transition-all bg-black/50 border border-white/5 ${accent.ring}`} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${accent.labelColor}`}>
                    <Lock className="w-3.5 h-3.5" /> Access Key
                  </label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-400">Forgot Key?</button>
                </div>
                <input type="password" required disabled={isSubmitting} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full px-5 py-4 rounded-xl text-white text-sm outline-none transition-all bg-black/50 border border-white/5 ${accent.ring}`} />
              </div>

              <button type="submit" disabled={isSubmitting} className={`mt-4 w-full py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${accent.btn}`}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deciphering...</> : <>{isCandidate ? 'Initialize Session' : 'Uplink to Console'} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            {isCandidate && (
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  First time? <Link to="/register" className="text-indigo-400 hover:text-white ml-2">Request Credentials</Link>
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center mt-6 text-slate-700 text-[9px] font-black uppercase tracking-[0.4em]">© 2026 Sentinel Exam Infrastructure</p>
      </div>
    </div>
  );
};

export default Login;
