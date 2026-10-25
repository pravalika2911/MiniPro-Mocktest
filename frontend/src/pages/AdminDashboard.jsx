import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, Users, Database, FileText, Activity, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-[#3b82f6] font-mono tracking-widest text-xl">AUTHORIZING ADMIN...</div>;
  }

  const { stats, violationFeed } = data || { stats: {}, violationFeed: [] };

  const getViolationColor = (type) => {
     if (type === 'TAB_SWITCH') return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
     if (type === 'EXIT_FULLSCREEN') return 'text-red-400 bg-red-500/10 border-red-500/20';
     return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="mb-12 border-l-4 border-red-500 pl-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white uppercase flex items-center">
              <ShieldAlert className="w-8 h-8 mr-4 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              Overwatch Console
            </h1>
            <p className="text-slate-400 mt-2 font-mono text-sm tracking-widest uppercase">Lead Architect: {user?.name}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-slate-700 bg-[#1f2937]/50 text-slate-300 font-mono text-xs font-bold uppercase hover:bg-slate-700 hover:text-white transition-all duration-300 rounded-lg shadow-sm hover:shadow-md"
          >
            Access Sentinel (Student View)
          </button>
        </div>

        {/* Stats Bar Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-[#1f2937]/50 backdrop-blur-md border border-slate-700/50 p-6 flex flex-col items-center justify-center rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 hover:border-[#3b82f6]/50 group">
             <Users className="w-10 h-10 text-[#3b82f6] mb-4 group-hover:scale-110 transition-transform duration-300" />
             <h2 className="text-4xl font-black text-white">{stats.totalStudents}</h2>
             <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mt-2">Active Candidates</p>
           </div>
           <div className="bg-[#1f2937]/50 backdrop-blur-md border border-slate-700/50 p-6 flex flex-col items-center justify-center rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 hover:border-[#3b82f6]/50 group">
             <Database className="w-10 h-10 text-[#3b82f6] mb-4 group-hover:scale-110 transition-transform duration-300" />
             <h2 className="text-4xl font-black text-white">{stats.totalExams}</h2>
             <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mt-2">Total Modules</p>
           </div>
           <div className="bg-red-950/20 backdrop-blur-md border border-red-900/30 p-6 flex flex-col items-center justify-center rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all duration-300 hover:border-red-500/50 group">
             <AlertTriangle className="w-10 h-10 text-red-500 mb-4 animate-pulse group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
             <h2 className="text-4xl font-black text-red-400">{stats.totalViolations}</h2>
             <p className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase mt-2">System Violations</p>
           </div>
        </div>

        {/* Violation Feed */}
        <div className="bg-[#1f2937]/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-slate-600">
          <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-black tracking-widest text-white uppercase flex items-center">
              <FileText className="w-5 h-5 mr-3 text-red-500" /> Security Logs
            </h3>
            
            {/* Live Proctoring Pulse Indicator */}
            <div className="flex items-center px-4 py-1.5 bg-slate-900/60 rounded-full border border-slate-700">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-3 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
               <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">Live Proctoring Active</span>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {violationFeed.length === 0 ? (
               <div className="p-12 text-center text-emerald-500 bg-emerald-500/5 font-mono text-sm uppercase tracking-widest border-t border-emerald-500/10">
                 System Secure. No proctoring breaches recorded.
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#0f172a]/80 font-mono text-[10px] md:text-xs text-slate-500 uppercase tracking-widest border-b border-slate-700/50">
                     <th className="p-5 font-bold whitespace-nowrap">Timestamp</th>
                     <th className="p-5 font-bold whitespace-nowrap">Recruit</th>
                     <th className="p-5 font-bold whitespace-nowrap">Module</th>
                     <th className="p-5 font-bold whitespace-nowrap">Intrusion Type</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {violationFeed.map((log, i) => (
                     <tr key={i} className={`border-b border-slate-700/30 transition-colors duration-300 hover:bg-slate-800/50`}>
                       <td className="p-5 font-mono text-slate-400 whitespace-nowrap group-hover:text-slate-300">{new Date(log.timestamp).toLocaleString()}</td>
                       <td className="p-5 font-bold text-white whitespace-nowrap">
                         {log.studentName} 
                         <span className="block text-xs text-slate-500 font-normal mt-1">{log.studentEmail}</span>
                       </td>
                       <td className="p-5 text-slate-300 font-medium whitespace-nowrap">{log.examName}</td>
                       <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-md font-mono text-[10px] md:text-xs tracking-wider uppercase font-bold border ${getViolationColor(log.violationType)} transition-all duration-300 shadow-sm`}>
                             {log.violationType.replace('_', ' ')}
                          </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
