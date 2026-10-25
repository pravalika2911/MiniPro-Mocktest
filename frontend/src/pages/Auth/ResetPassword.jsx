import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Lock,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Access keys do not match.');
    if (password.length < 8) return setError('Key must be at least 8 characters.');

    setIsSubmitting(true);
    setError('');

    try {
      // Logic for backend reset
      await api.post(`/auth/reset-password/${token}`, { password });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-300 font-sans">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-black tracking-[0.4em] uppercase">Sentinel Protocol</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Key Restoration</h1>
          <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">Update your security credentials</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-2xl shadow-2xl p-8">
           {isSuccess ? (
             <div className="text-center py-8">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
               </div>
               <h3 className="text-white font-black uppercase tracking-widest mb-2">Restoration Complete</h3>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Re-routing to Authorization Portal...</p>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> New Access Key
                  </label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••••••"
                    className="w-full px-5 py-4 bg-black/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500/50" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Confirm Access Key
                  </label>
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••••••"
                    className="w-full px-5 py-4 bg-black/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500/50" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <>Update Credentials <ArrowRight className="w-4 h-4" /></>}
                </button>
             </form>
           )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
