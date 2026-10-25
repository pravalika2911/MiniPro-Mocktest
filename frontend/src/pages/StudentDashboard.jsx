import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Clock, PlayCircle, ShieldAlert, FileCode2, Cloud, Shield, Database } from 'lucide-react';

const categoryIcons = {
  'Cloud': Cloud,
  'Frontend': FileCode2,
  'Coding Type': FileCode2,
  'Security': ShieldAlert,
  'Architecture': Database,
  'General': FileCode2
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await api.get('/exams');
        setExams(data.data.exams);
      } catch (error) {
        console.error('Failed to fetch exams', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleStartExam = async (examId) => {
    const isReady = window.confirm("WARNING: Beginning this module enforces strict proctoring (Fullscreen Lock, Tab Monitoring, Input Disables). Ensure you are ready.");
    
    if (isReady) {
      try {
        const { data } = await api.post('/sessions/start', { examId });
        // Use the session ID from either a fresh start or a resumption
        const sessionId = data.data.sessionId || data.data.session._id;
        navigate(`/exam/${sessionId}`);
      } catch (error) {
        // Only alert if it's NOT a session existence issue (though backend now handles it)
        if (error.response?.status !== 400) {
          alert('Failed to initialize session. System integrity check required.');
        }
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8 font-mono animate-pulse text-[#3b82f6]">INITIALIZING MAINFRAME...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="mb-12 border-l-4 border-[#3b82f6] pl-4">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white uppercase flex items-center">
            <Shield className="w-8 h-8 mr-4 text-[#3b82f6]" />
            Sentinel Network
            </h1>
            <p className="text-slate-400 mt-2 font-mono text-sm tracking-widest uppercase">Level 1 Authorized: {user?.name}</p>
            </div>

        {exams.length === 0 ? (
          <div className="bg-[#1f2937]/50 backdrop-blur-md border border-slate-700/50 p-12 text-center rounded-2xl shadow-xl">
            <h3 className="text-xl font-bold text-slate-500 font-mono tracking-widest">NO ACTIVE MODULES FOUND in DATABASE</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const Icon = categoryIcons[exam.category] || FileCode2;
              
              const diffColors = {
                'Easy': 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
                'Medium': 'text-amber-400 bg-amber-400/10 border-amber-500/20',
                'Hard': 'text-red-400 bg-red-500/10 border-red-500/20'
              };
              
              return (
                <div key={exam._id} className="bg-[#1f2937]/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#3b82f6] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
                  
                  <div className="p-6 flex-1 flex flex-col pt-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2 transition-all duration-300">
                        <div className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg group-hover:border-[#3b82f6]/50 transition-colors duration-300">
                           <Icon className="w-5 h-5 text-[#3b82f6]" />
                        </div>
                        <span className="text-xs font-mono font-bold text-[#3b82f6] uppercase tracking-wider">{exam.category}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 tracking-widest rounded-md border uppercase transition-colors duration-300 ${diffColors[exam.difficulty] || diffColors['Medium']}`}>
                        {exam.difficulty}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white leading-tight mb-3 group-hover:text-[#3b82f6] transition-colors duration-300">{exam.title}</h3>
                    <p className="text-slate-400 text-sm mb-6 flex-1 leading-relaxed">{exam.description || 'Enterprise exam module.'}</p>
                    
                    <div className="space-y-3 mt-auto bg-[#0f172a]/50 p-4 rounded-xl border border-slate-700/30">
                      <div className="flex items-center text-xs font-mono font-medium text-slate-300">
                        <Clock className="w-4 h-4 mr-3 text-emerald-400" />
                        DURATION: {exam.durationMinutes} MIN
                      </div>
                      <div className="flex items-center text-xs font-mono font-medium text-slate-300">
                        <ShieldAlert className="w-4 h-4 mr-3 text-amber-400" />
                        PROCTORING: ULTIMATE
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0 mt-2">
                    <button 
                      onClick={() => handleStartExam(exam._id)}
                      className="w-full flex items-center justify-center p-3 text-sm font-bold tracking-widest text-white bg-[#3b82f6] hover:bg-blue-500 transition-all duration-300 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5 rounded-lg border border-transparent"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      INITIALIZE SEQUENCE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
