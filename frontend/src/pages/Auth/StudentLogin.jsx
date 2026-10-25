import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Terminal, KeyRound, User, Loader2, ShieldCheck, Zap } from 'lucide-react';

const BOOT_LINES = [
  '> Initializing secure tunnel...',
  '> Loading candidate profile schema...',
  '> Handshaking with exam server...',
  '> Environment verified. Ready for Synchronization.',
];

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [isBooting, setIsBooting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Boot sequence animation on successful login
  const runBootSequence = () => {
    setIsBooting(true);
    let i = 0;
    const interval = setInterval(() => {
      setBootLines((prev) => [...prev, BOOT_LINES[i]]);
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setTimeout(() => navigate('/dashboard'), 700);
      }
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password, 'student');
      runBootSequence();
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied. Check credentials.');
      setIsSubmitting(false);
    }
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-[#020c18] flex flex-col items-center justify-center font-mono p-8">
        <div className="w-full max-w-lg">
          <div className="text-cyan-400 text-sm mb-4 tracking-widest font-bold uppercase">
            SECURE TERMINAL — AUTH SEQUENCE COMPLETE
          </div>
          <div className="bg-black border border-cyan-500/30 rounded-lg p-6 space-y-2">
            {bootLines.map((line, i) => (
              <p
                key={i}
                className={`text-sm ${i === bootLines.length - 1 ? 'text-cyan-300 font-bold' : 'text-cyan-600'}`}
              >
                {line}
              </p>
            ))}
            {bootLines.length < BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020c18] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Animated grid scan */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e905_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e905_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {/* Glowing top orb */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase">
            <Zap className="w-3 h-3 mr-2" />
            SECTOR: CANDIDATE ACCESS
          </div>
        </div>

        <div className="bg-[#081525]/80 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.07)] rounded-2xl overflow-hidden">
          {/* Top accent bar — scanline effect */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <Terminal className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-black tracking-widest text-white mb-1 font-mono uppercase">
                Access Terminal
              </h1>
              <p className="text-cyan-600 text-xs font-medium uppercase tracking-[0.3em] font-mono">
                Candidate Authentication Protocol
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center font-mono">
                <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.25em] flex items-center font-mono">
                  <User className="w-3 h-3 mr-2" /> Candidate ID
                </label>
                <input
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@sentinel.io"
                  className="w-full p-3.5 bg-black/40 border border-cyan-500/20 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all duration-300 rounded-lg font-mono placeholder-slate-700 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.25em] flex items-center font-mono">
                  <KeyRound className="w-3 h-3 mr-2" /> Access Key
                </label>
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-3.5 bg-black/40 border border-cyan-500/20 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all duration-300 rounded-lg font-mono placeholder-slate-700 text-sm tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold tracking-[0.2em] text-sm flex items-center justify-center transition-all duration-300 disabled:opacity-50 rounded-lg font-mono group"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                    AUTHENTICATING...
                  </span>
                ) : (
                  'INITIATE ACCESS'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-cyan-500/10 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-mono">No credentials?</span>
              <Link to="/register" className="text-cyan-500 hover:text-cyan-300 font-bold font-mono transition-colors">
                Request Provisioning →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer nav to admin */}
        <p className="text-center mt-4 text-slate-700 text-xs font-mono">
          Admin personnel?{' '}
          <Link to="/gate/admin" className="text-slate-500 hover:text-slate-300 transition-colors">
            Admin Node →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
