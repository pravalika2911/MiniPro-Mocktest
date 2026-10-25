import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Zap, 
  Lock, 
  BarChart3, 
  ChevronRight, 
  Globe, 
  Github, 
  MonitorCheck, 
  UserCheck, 
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Clock
} from 'lucide-react';

// --- Shared Timer Motif Component ---
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
        className="opacity-[0.06]"
        aria-hidden="true"
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 8" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
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
        <line
          x1={cx}
          y1={cy}
          x2={cx + 80 * Math.cos((progress / 360) * 2 * Math.PI - Math.PI / 2)}
          y2={cy + 80 * Math.sin((progress / 360) * 2 * Math.PI - Math.PI / 2)}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + 50 * Math.cos((progress / 60) * 2 * Math.PI - Math.PI / 2)}
          y2={cy + 50 * Math.sin((progress / 60) * 2 * Math.PI - Math.PI / 2)}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// --- Feature Card Component ---
const FeatureCard = ({ icon, title, description, accentColor }) => {
  const IconComponent = icon;

  return (
    <div
      className="group p-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${accentColor}/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:${accentColor}/10 transition-colors`} />
      <div className={`w-14 h-14 rounded-xl ${accentColor}/10 flex items-center justify-center mb-6 group-hover:${accentColor}/20 transition-colors`}>
        <IconComponent className={`w-7 h-7 ${accentColor.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight uppercase">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm font-medium">{description}</p>
    </div>
  );
};

// --- Security Item Component ---
const SecurityItem = ({ icon, title, subtitle, description }) => {
  const IconComponent = icon;

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
        <IconComponent className="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <h4 className="text-white font-black text-lg uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest mb-2">{subtitle}</p>
        <p className="text-slate-500 text-sm leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* ── Navbar ── */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-black uppercase tracking-widest hidden sm:block">Sentinel</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">Features</a>
          <a href="#security" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">Security Metrics</a>
          <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">System Login</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/gate/admin" 
            className="px-4 py-2.5 border border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-white/10 transition-all"
          >
            Admin Node
          </Link>
          <Link 
            to="/register" 
            className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="relative pt-32 pb-48 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            v2.0 Network Active
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] mb-8">
            SECURE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-400">EXAMINATION</span> <br />
            PROTOCOL
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12 lowercase tracking-tight">
            The next generation of online testing. Powered by AI proctoring, 
            real-time telemetry, and enterprise-grade integrity controls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-lg uppercase tracking-widest rounded-xl hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 group"
            >
              Start Session
              <ChevronRight className="inline-block ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/gate/admin" 
              className="w-full sm:w-auto px-10 py-5 border-2 border-indigo-500/40 text-indigo-300 font-black text-lg uppercase tracking-widest rounded-xl hover:bg-indigo-500/10 transition-all active:scale-95"
            >
              Admin Node
            </Link>
          </div>

          <div className="mt-16 h-80 relative flex items-center justify-center pointer-events-none">
            <TimerMotif />
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <ChevronDown className="w-8 h-8 text-white" />
        </div>
      </header>

      {/* ── Features Matrix ── */}
      <section id="features" className="py-32 relative bg-black/40 border-y border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                Advanced <br />
                <span className="text-indigo-500">Infrastructure</span>
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                A hardened ecosystem designed to eliminate integrity vulnerabilities while providing real-time performance insights.
              </p>
            </div>
            <div className="flex items-center gap-3 text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">
              <Globe className="w-5 h-5" />
              Deployment Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={MonitorCheck}
              title="AI Proctoring Node"
              accentColor="bg-indigo-600"
              description="High-frequency event tracking detects tab switching, hardware changes, and unusual activity patterns with millisecond precision."
            />
            <FeatureCard 
              icon={Zap}
              title="Dynamic Exam Core"
              accentColor="bg-emerald-600"
              description="Drift-resistant timers and encrypted local state management ensure exam stability even under unstable network environments."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Telemetry Hub"
              accentColor="bg-amber-600"
              description="Deep candidates insights through percentile tracking, visual performance rings, and violation intensity heatmaps."
            />
          </div>
        </div>
      </section>

      {/* ── Security Section ── */}
      <section id="security" className="py-32 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            
            <div className="space-y-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <ShieldCheck className="w-3 h-3" />
                  Hardened protocol
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
                  Security-First <br />
                  <span className="text-emerald-500">Framework</span>
                </h2>
              </div>

              <div className="space-y-10">
                <SecurityItem 
                  icon={Lock}
                  title="E2E Data Encryption"
                  subtitle="AES-256 Standard"
                  description="All assessment telemetry is encrypted at rest and in transit. Secure buffering prevents data loss during synchronization."
                />
                <SecurityItem 
                  icon={UserCheck}
                  title="Identity Verification"
                  subtitle="Hardware Fingerprinting"
                  description="Verified login sessions paired with unique device signatures prevent unauthorized proxy participation."
                />
                <SecurityItem 
                  icon={ShieldAlert}
                  title="Anti-Cheat Kernel"
                  subtitle="40+ Browser Events"
                  description="Advanced detection of screen sharing, dual monitors, and non-standard browser behavior maintained in real-time."
                />
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent flex items-center justify-center p-1 relative group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-20 filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-1000"></div>
                
                <div className="relative z-10 text-center p-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl max-w-xs shadow-2xl">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
                  </div>
                  <h4 className="text-white font-black uppercase tracking-tight mb-2">Integrity Status</h4>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active monitoring cycle</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">Node 0x4F2A verifying session signature. All telemetry buffers clear.</p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-8 left-8 w-12 h-px bg-indigo-500" />
                <div className="absolute top-8 left-8 w-px h-12 bg-indigo-500" />
                <div className="absolute bottom-8 right-8 w-12 h-px bg-indigo-500" />
                <div className="absolute bottom-8 right-8 w-px h-12 bg-indigo-500" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Global Network Stats ── */}
      <section className="py-32 bg-indigo-950/10 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Global Node <br />
              <span className="text-indigo-500">Distribution</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Our platform is deployed across multiple cloud nodes to ensure maximum uptime and architectural resilience, regardless of your geographic location.
            </p>
            <div className="grid grid-cols-2 gap-12 pt-8">
              <div>
                <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">1.2M+</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Assessments Delivered</p>
              </div>
              <div>
                <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">99.9%</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Real-time Uptime</p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative flex justify-center">
             <div className="w-80 h-80 lg:w-96 lg:h-96 bg-indigo-600/5 rounded-full border border-white/5 flex items-center justify-center relative">
               <Globe className="w-48 h-48 lg:w-64 lg:h-64 text-indigo-500/10 animate-[spin_30s_linear_infinite]" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final Node ── */}
      <section className="py-40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-[3rem] p-12 md:p-24 overflow-hidden text-center border border-indigo-500/10 bg-white/[0.02]">
            <div className="absolute inset-0 bg-indigo-600/5 backdrop-blur-[100px]" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            
            <div className="relative z-10 space-y-12">
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">Ready to secure your <br /> Infrastructure?</h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto lowercase leading-relaxed">
                Join hundreds of institutions using Sentinel to deliver high-stakes exams with uncompromising integrity and deep telemetry.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  to="/register"
                  className="w-full sm:w-auto px-12 py-6 bg-white text-black rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                >
                  Register Node
                </Link>
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-12 py-6 bg-slate-900 text-white rounded-2xl font-black text-lg uppercase tracking-widest border border-white/10 hover:bg-slate-800 transition-all active:scale-95"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-20 border-t border-white/5 bg-black/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <ShieldAlert className="w-6 h-6 text-indigo-500" />
              <span className="text-white font-black uppercase tracking-widest text-lg">Sentinel Infrastructure</span>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-none">© 2026 Secured Examination Protocol. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-10">
            <Link to="#" className="text-slate-500 hover:text-white transition-colors"><Github className="w-7 h-7" /></Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Safety Protocol</Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Privacy Node</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
