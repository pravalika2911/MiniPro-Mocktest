import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  ShieldAlert, 
  Users, 
  FileText, 
  AlertTriangle,
  PlusCircle,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'questions' | 'security'
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Live Data States
  const [stats, setStats] = useState({ totalStudents: 0, totalExams: 0, totalViolations: 0 });
  const [violationFeed, setViolationFeed] = useState([]);
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form States
  const [newExam, setNewExam] = useState({ title: '', description: '', category: 'General', difficulty: 'Medium', durationMinutes: 60, totalMarks: 100, isActive: true });
  const [newQuestion, setNewQuestion] = useState({ examId: '', questionText: '', options: ['', '', '', ''], correctOption: '', marks: 10 });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, examsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/exams')
      ]);
      
      setStats(dashRes.data.data.stats);
      setViolationFeed(dashRes.data.data.violationFeed);
      setExams(examsRes.data.data.exams);
      setIsLoading(false);
    } catch {
      setError("Telemetry synchronization failed. Access denied or server unreachable.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.post('/exams', newExam);
      alert("New Exam Node Initialized.");
      setNewExam({ title: '', description: '', category: 'General', difficulty: 'Medium', durationMinutes: 60, totalMarks: 100, isActive: true });
      fetchAdminData();
    } catch {
      alert("Failed to create exam node.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.examId) return alert("Select a target repository (Exam) first.");
    
    setIsProcessing(true);
    try {
      await api.post(`/exams/${newQuestion.examId}/questions`, newQuestion);
      alert("Logic Module Injected.");
      setNewQuestion({ examId: '', questionText: '', options: ['', '', '', ''], correctOption: '', marks: 10 });
    } catch {
      alert("Failed to inject question.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !newQuestion.examId) {
       alert("Select a target repository first.");
       return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim());
      
      // Expected Format: questionText,OptionA,OptionB,OptionC,OptionD,CorrectOption,Marks
      const questions = rows.slice(1).map(row => {
        const [qText, optA, optB, optC, optD, correct, marks] = row.split(',');
        return {
          questionText: qText.trim(),
          options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
          correctOption: correct.trim(),
          marks: parseInt(marks) || 10
        };
      });

      if (questions.length === 0) return alert("Empty or invalid CSV.");

      setIsProcessing(true);
      try {
        await api.post(`/exams/${newQuestion.examId}/questions/bulk`, { questions });
        alert(`SUCCESS: ${questions.length} modules initialized.`);
        fetchAdminData();
      } catch {
        alert("Bulk injection failed. Check CSV structure.");
      } finally {
        setIsProcessing(false);
        e.target.value = null; // Clear input
      }
    };
    reader.readAsText(file);
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm("CRITICAL: This will immediately end the student's session and log an Admin Override. Proceed?")) return;
    try {
      await api.put(`/admin/sessions/${sessionId}/terminate`);
      alert("Session Terminated. User redirected.");
      fetchAdminData();
    } catch {
      alert("Override failed.");
    }
  };

  const handleSendWarning = async (sessionId) => {
    const msg = window.prompt("Enter Warning Message for Candidate:", "Suspicious activity detected. Maintain integrity or session will be terminated.");
    if (!msg) return;
    
    try {
      await api.post(`/admin/sessions/${sessionId}/warn`, { message: msg });
      alert("Warning Transmitted.");
    } catch {
      alert("Transmission failed.");
    }
  };

  const handleExportResults = async () => {
    setIsProcessing(true);
    try {
      const { data } = await api.get('/admin/sessions');
      const sessions = data.data.sessions;
      
      const csvRows = [
        "Candidate,Email,Exam,Status,Score,Violations,Date",
        ...sessions.map(s => [
          s.userId?.name || 'Unknown',
          s.userId?.email || 'N/A',
          s.examId?.title || 'Unknown Exam',
          s.status,
          `${s.score || 0}/${s.examId?.totalMarks || 100}`,
          s.violationCount,
          new Date(s.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvRows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `MTRX_REPORT_${Date.now()}.csv`);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Export failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const metrics = [
    { label: 'Total Candidates', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Exams', value: stats.totalExams, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'System Breaches', value: stats.totalViolations, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Decrypting Command Uplink...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-red-600 text-white font-bold rounded-xl">Retry Authentication</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* ── Sidebar ── */}
      <aside className="w-72 bg-slate-900 flex flex-col shrink-0 overflow-hidden relative">
        {/* Brand */}
        <div className="p-8 pb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <ShieldAlert className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-white text-xl font-black uppercase tracking-widest">Command</span>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">System Administrator</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'overview' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'questions' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <Database className="w-5 h-5" />
            Question Bank
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'security' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            Security Logs
          </button>
        </nav>

        {/* Bottom Profile / Logout */}
        <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-900 shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-bold truncate">{user?.name || 'Administrator'}</p>
              <p className="text-amber-500 text-[10px] font-bold tracking-widest uppercase truncate">Clearance: Level 5</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Shutdown Session
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header Overlay */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'Status Overview'}
              {activeTab === 'questions' && 'Question Repositories'}
              {activeTab === 'security' && 'Integrity Analysis'}
            </h2>
            <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">Live Feedback</div>
          </div>
          
          <div className="flex items-center gap-6">
             {activeTab === 'security' && (
                <button 
                  onClick={handleExportResults}
                  disabled={isProcessing}
                  className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  Download Global Result Analytics
                </button>
             )}
             <div className="relative group hidden lg:block">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search nodes..." 
                 className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none w-64 focus:border-amber-500 focus:bg-white transition-all"
               />
             </div>
             <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               Node: Sentinel-EX-01
             </div>
          </div>
        </header>

        {/* Dynamic Content Scrollable */}
        <section className="flex-1 p-10 overflow-auto scroll-smooth">
          
          {/* TAB: SYSTEM OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${m.bg} ${m.color} transition-all duration-300 group-hover:scale-110`}>
                        <m.icon className="w-6 h-6" />
                      </div>
                      <span className="text-emerald-500 text-xs font-black bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                        +12% <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                      </span>
                    </div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">{m.label}</p>
                    <h4 className="text-4xl font-black text-slate-900 tracking-tight">{m.value}</h4>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                   <h5 className="text-lg font-bold mb-6 flex items-center gap-3">
                     <AlertTriangle className="w-5 h-5 text-amber-500" />
                     Recent Incident Log
                   </h5>
                   <div className="space-y-4">
                     {violationFeed.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl">
                           Zero Breaches Detected
                        </div>
                     ) : (
                       violationFeed.slice(0, 5).map((log, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-red-500 font-bold font-mono">
                               {i + 1}
                             </div>
                             <div className="flex-1">
                               <p className="text-sm font-bold">{log.violationType.replace('_', ' ')}</p>
                               <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">Candidate: {log.studentName} | {log.examName}</p>
                             </div>
                             <span className="text-[10px] font-bold text-slate-400 shrink-0">
                               {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                       ))
                     )}
                   </div>
                 </div>
                 <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <ShieldAlert className="w-32 h-32 text-white" />
                   </div>
                   <div className="relative z-10">
                     <h5 className="text-lg font-bold text-white mb-2">Automated Oversight</h5>
                     <p className="text-slate-400 text-sm mb-8 leading-relaxed">The Sentinel Protocol proctoring engine is running at 99.8% precision across all active modules.</p>
                     <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm shadow-lg hover:bg-amber-400 transition-colors">Audit Engine Parameters</button>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: QUESTION BANK */}
          {activeTab === 'questions' && (
            <div className="max-w-5xl space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
              
              {/* Form 1: Create Exam */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h5 className="text-lg font-bold flex items-center gap-3 text-slate-900">
                    <PlusCircle className="w-5 h-5 text-indigo-600" />
                    Initialize Exam Node
                  </h5>
                </div>
                <div className="p-8">
                  <form onSubmit={handleCreateExam} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Title</label>
                          <input 
                            type="text" 
                            required
                            value={newExam.title}
                            onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            placeholder="e.g. AWS Solutions Architect"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Tag</label>
                          <select 
                            value={newExam.category}
                            onChange={(e) => setNewExam({...newExam, category: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          >
                             {['Cloud', 'Frontend', 'Security', 'Architecture', 'General'].map(cat => <option key={cat}>{cat}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Minutes)</label>
                          <input 
                            type="number" 
                            required
                            value={newExam.durationMinutes}
                            onChange={(e) => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty Level</label>
                          <select 
                            value={newExam.difficulty}
                            onChange={(e) => setNewExam({...newExam, difficulty: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          >
                             {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                          </select>
                       </div>
                       <div className="flex items-end">
                         <button 
                           type="submit" 
                           disabled={isProcessing}
                           className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                           Initialize Node
                         </button>
                       </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Form 2: Create Question */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h5 className="text-lg font-bold flex items-center gap-3 text-slate-900">
                    <Database className="w-5 h-5 text-amber-500" />
                    Inject Logic Question
                  </h5>
                </div>
                <div className="p-8">
                  <form onSubmit={handleAddQuestion} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Repository (Select Exam)</label>
                       <select 
                         required
                         value={newQuestion.examId}
                         onChange={(e) => setNewQuestion({...newQuestion, examId: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                       >
                          <option value="">-- Choose Repository --</option>
                          {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Content</label>
                       <textarea 
                         rows="3" 
                         required
                         value={newQuestion.questionText}
                         onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                         placeholder="e.g. What is the complexity of binary search?"
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {newQuestion.options.map((opt, i) => (
                         <div key={i} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option {String.fromCharCode(65 + i)}</label>
                            <input 
                              type="text" 
                              required
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...newQuestion.options];
                                newOpts[i] = e.target.value;
                                setNewQuestion({...newQuestion, options: newOpts});
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                              placeholder={`Input value for Choice ${String.fromCharCode(65 + i)}...`}
                            />
                         </div>
                       ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correct Response (Select from options)</label>
                        <select 
                          required
                          value={newQuestion.correctOption}
                          onChange={(e) => setNewQuestion({...newQuestion, correctOption: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                        >
                          <option value="">-- Select Correct Answer --</option>
                          {newQuestion.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Weight (Marks)</label>
                        <input 
                          type="number" 
                          required
                          value={newQuestion.marks}
                          onChange={(e) => setNewQuestion({...newQuestion, marks: parseInt(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alternative: Bulk Initialization (.csv)</label>
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                            Upload CSV Repos
                            <input 
                              type="file" 
                              accept=".csv" 
                              className="hidden" 
                              onChange={handleBulkUpload}
                            />
                          </label>
                          <div className="text-[10px] text-slate-400 font-mono leading-tight">
                            Format: questionText, OptA, OptB, OptC, OptD, CorrectAns, Marks
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="submit" 
                          disabled={isProcessing}
                          className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-xl shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                          Inject to Repository
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="font-bold">Active Repositories</h5>
                    <span className="text-xs font-bold text-slate-400">Total Nodes: {exams.length}</span>
                 </div>
                 <div className="divide-y divide-slate-100">
                   {exams.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                         No Exam Modules Initialized
                      </div>
                   ) : (
                     exams.map((exam) => (
                        <div key={exam._id} className="p-8 hover:bg-slate-50 transition-colors flex items-start justify-between">
                           <div className="space-y-2">
                              <h6 className="font-bold text-slate-900">{exam.title}</h6>
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  {exam.category}
                                </p>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                  {exam.difficulty}
                                </p>
                              </div>
                           </div>
                           <button className="px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all">
                              Configure Node
                           </button>
                        </div>
                     ))
                   )}
                 </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY LOGS */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate Details</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Node</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Violation Type</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {violationFeed.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">
                           System Integrity Verified - No Incidents Found
                        </td>
                      </tr>
                    ) : (
                      violationFeed.map((log, i) => (
                        <tr key={i} className="hover:bg-red-50/30 transition-all">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-red-100 text-red-700">
                                  {log.studentName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-700">{log.studentName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{log.studentEmail}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 font-mono font-bold text-xs text-slate-600 truncate max-w-[200px]">{log.examName}</td>
                          <td className="px-8 py-6">
                             <span className="px-3 py-1.5 bg-red-100 text-red-600 text-[10px] font-black rounded-lg border border-red-200 uppercase tracking-widest">
                               {log.violationType}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right font-mono text-xs text-slate-400">
                             <div className="flex items-center justify-end gap-4">
                               <span>{new Date(log.timestamp).toLocaleString()}</span>
                               <button 
                                 onClick={() => handleSendWarning(log.sessionId)}
                                 className="px-4 py-2 bg-amber-500 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-amber-400 shadow-lg shadow-amber-100 transition-all active:scale-95"
                               >
                                 Issue Warning
                               </button>
                               <button 
                                 onClick={() => handleTerminateSession(log.sessionId)}
                                 className="px-4 py-2 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95"
                               >
                                 Terminate Node
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                   <p className="text-xs font-bold text-slate-400">Showing 4 of 1,284 sessions</p>
                   <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-slate-300 transition-all">Previous</button>
                      <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-slate-300 transition-all">Next</button>
                   </div>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default AdminPanel;
