import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, AtSign, Loader2, AlertTriangle, Activity } from 'lucide-react';

const BOOT_SEQUENCE = [
  '[ SYS ] Booting secure kernel modules...',
  '[ NET ] Establishing encrypted control channel...',
  '[ DB  ] Loading administrative privilege manifest...',
  '[ OK  ] All subsystems nominal.',
  '[ OK  ] Monitoring Active. Welcome, Administrator.',
];

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [isBooting, setIsBooting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleRecovery = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryMessage(null);
    try {
      const response = await forgotPassword(recoveryEmail || email);
      setRecoveryMessage({
        type: 'success',
        text: response.message || 'If an account exists, a reset link has been sent.'
      });
    } catch (err) {
      setRecoveryMessage({
        type: 'error',
        text: err.response?.data?.message || (
          err.request
            ? 'Cannot reach the API. Start the backend server and try again.'
            : err.message || 'Unable to start password recovery.'
        )
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const runBootSequence = () => {
    setIsBooting(true);
    let i = 0;
    const interval = setInterval(() => {
      setBootLines((prev) => [...prev, BOOT_SEQUENCE[i]]);
      i++;
      if (i >= BOOT_SEQUENCE.length) {
        clearInterval(interval);
        setTimeout(() => navigate('/admin-panel'), 800);
      }
    }, 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password, 'admin');
      runBootSequence();
    } catch (err) {
      setError(err.response?.data?.message || 'Command rejected. Verify credentials.');
      setIsSubmitting(false);
    }
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono p-8">
        <div className="w-full max-w-xl">
          <div className="flex items-center mb-4">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-3" />
            <span className="text-amber-500 text-xs tracking-widest uppercase font-bold">
              ADMIN COMMAND CENTRE — BOOT SEQUENCE INITIALIZING
            </span>
          </div>
          <div className="bg-black border border-amber-500/20 rounded-lg p-6 space-y-2 shadow-[0_0_40px_rgba(245,158,11,0.05)]">
            {bootLines.map((line, i) => (
              <p
                key={i}
                className={`text-xs ${
                  line.startsWith('[ OK')
                    ? 'text-amber-400 font-bold'
                    : i === bootLines.length - 1
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                {line}
              </p>
            ))}
            {bootLines.length < BOOT_SEQUENCE.length && (
              <span className="inline-block w-2 h-3.5 bg-amber-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Industrial texture grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      {/* Corner accent blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Security clearance badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-4 py-1.5 rounded border border-amber-500/30 bg-amber-500/5 text-amber-500/80 text-[10px] font-mono font-bold tracking-[0.3em] uppercase">
            <AlertTriangle className="w-3 h-3 mr-2" />
            RESTRICTED — HIGH SECURITY CLEARANCE REQUIRED
          </div>
        </div>

        <div className="bg-[#111111] border border-slate-700/50 shadow-2xl rounded-xl overflow-hidden">
          {/* Top accent — crimson industrial bar */}
          <div className="h-1 w-full bg-gradient-to-r from-red-700 via-amber-500 to-red-700" />

          {/* Side accent stripe */}
          <div className="flex">
            <div className="w-1 bg-gradient-to-b from-amber-500/60 to-transparent flex-shrink-0" />

            <div className="flex-1 p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                  <Shield className="w-8 h-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-black tracking-widest text-white mb-1 font-mono uppercase">
                  Admin Node
                </h1>
                <p className="text-amber-600/70 text-[10px] font-bold uppercase tracking-[0.3em] font-mono">
                  Administrative Authentication — Level 5 Clearance
                </p>
                <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300/80 font-mono">
                  Total Sentinel lock: one secure admin account only.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded flex items-center font-mono">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] flex items-center font-mono">
                    <AtSign className="w-3 h-3 mr-2 text-amber-600" />
                    Administrator Ident
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full p-3.5 bg-black border border-slate-700 text-white focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-200 rounded font-mono placeholder-slate-800 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] flex items-center font-mono">
                    <Lock className="w-3 h-3 mr-2 text-amber-600" />
                    Encryption Pass
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full p-3.5 bg-black border border-slate-700 text-white focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-200 rounded font-mono placeholder-slate-800 text-sm tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400/70 text-amber-400 font-bold tracking-[0.2em] text-sm flex items-center justify-center transition-all duration-300 disabled:opacity-50 rounded font-mono"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                      VERIFYING CLEARANCE...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-3" />
                      AUTHENTICATE COMMAND
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery((visible) => !visible);
                    setRecoveryEmail(email);
                    setRecoveryMessage(null);
                  }}
                  className="w-full text-center text-xs font-mono text-amber-500/80 hover:text-amber-400"
                >
                  {showRecovery ? 'Return to admin login' : 'Forgot admin password?'}
                </button>
                {showRecovery && (
                  <form onSubmit={handleRecovery} className="mt-4 space-y-3">
                    <label htmlFor="admin-recovery-email" className="sr-only">Admin account email</label>
                    <input
                      id="admin-recovery-email"
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="admin@gmail.com"
                      className="w-full p-3 bg-black border border-slate-700 text-white rounded font-mono text-sm"
                    />
                    {recoveryMessage && (
                      <div className={`rounded border p-3 text-xs font-mono ${
                        recoveryMessage.type === 'success'
                          ? 'border-emerald-500/30 text-emerald-300'
                          : 'border-red-500/30 text-red-300'
                      }`}>
                        <p>{recoveryMessage.text}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="w-full rounded border border-amber-500/30 py-3 text-xs font-mono text-amber-300 disabled:opacity-50"
                    >
                      {recoveryLoading ? 'SENDING...' : 'SEND RESET LINK'}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <p className="text-slate-700 text-[10px] font-mono tracking-widest uppercase">
                  Unauthorized access attempts are monitored and logged.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav back to student */}
        <p className="text-center mt-4 text-slate-700 text-xs font-mono">
          Candidate?{' '}
          <Link to="/gate/student" className="text-slate-500 hover:text-slate-300 transition-colors">
            Student Terminal →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
