import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { CheckCircle, XCircle, HelpCircle, ArrowLeft, Award, Clock } from 'lucide-react';

const ResultPage = () => {
  const { id: sessionId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/sessions/${sessionId}/result`);
        setResult(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [sessionId]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold tracking-widest uppercase tracking-widest text-primary animate-pulse">Analyzing Telemetry...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold tracking-widest text-center mt-20">{error}</div>;

  const { session, stats } = result;
  
  const chartData = [
    { name: 'Correct', value: stats.correctCount, color: '#0ea5e9' }, // Primary Azure
    { name: 'Incorrect', value: stats.incorrectCount, color: '#ef4444' }, // Red
    { name: 'Omitted', value: stats.unattemptedCount, color: '#94a3b8' } // Slate
  ];

  const percentage = Math.round((session.score / session.examId.totalMarks) * 100) || 0;
  const passed = percentage >= 50; 

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <Link to="/dashboard" className="inline-flex items-center text-sm font-bold tracking-widest text-slate-500 hover:text-slate-900 mb-8 uppercase transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Protocol
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Score Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-sharp p-8 xl:p-12 relative overflow-hidden">
           {/* Brutalist Watermark */}
           <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
             <h1 className="text-[15rem] font-black tracking-tighter mix-blend-multiply">EVAL</h1>
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="text-center md:text-left">
               <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-2">Performance Assessment</h2>
               <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                 {session.examId.title}
               </h1>
               
               <div className="flex items-center justify-center md:justify-start space-x-6 mt-8">
                 <div className="flex items-center text-slate-600">
                   <Clock className="w-5 h-5 mr-3 text-slate-400" />
                   <span className="font-bold">{session.examId.durationMinutes} Min Module</span>
                 </div>
                 <div className="flex items-center text-slate-600">
                   <Award className="w-5 h-5 mr-3 text-slate-400" />
                   <span className="font-bold">ID: {session._id.slice(-6).toUpperCase()}</span>
                 </div>
               </div>
             </div>

             <div className="shrink-0 flex flex-col items-center">
               <div className={`w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${passed ? 'border-primary bg-primary/5 text-primary' : 'border-red-500 bg-red-50 text-red-600'}`}>
                 <span className="text-6xl font-black tracking-tighter leading-none">{percentage}</span>
                 <span className="text-sm font-bold tracking-widest uppercase mt-2">%</span>
               </div>
               <p className={`mt-6 font-bold tracking-widest uppercase px-6 py-2 rounded-sharp border ${passed ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-100 text-red-600 border-red-200'}`}>
                 {passed ? 'Verification Passed' : 'Verification Failed'}
               </p>
             </div>
           </div>

           <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-100">
             <div className="bg-slate-50 p-6 rounded-sharp text-center border border-slate-200">
                <p className="text-2xl font-black text-slate-900">{session.score} <span className="text-base text-slate-500 font-medium">/ {session.examId.totalMarks}</span></p>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2">Aggregate Score</p>
             </div>
             <div className="bg-slate-50 p-6 rounded-sharp text-center border border-slate-200">
                <p className="text-2xl font-black text-slate-900">{stats.totalQuestions}</p>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2">Total Queries</p>
             </div>
             <div className="bg-slate-50 p-6 rounded-sharp text-center border border-slate-200">
                <p className="text-2xl font-black text-slate-900">{session.status === 'Auto-Submitted' ? 'AUTO' : 'MANUAL'}</p>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2">Submit Trigger</p>
             </div>
           </div>
        </div>

        {/* Telemetry Sidebar */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sharp flex flex-col">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold tracking-widest text-slate-900 uppercase">Response Telemetry</h3>
           </div>
           
           <div className="p-6 flex-1 flex flex-col min-h-[300px]">
             <div className="flex-1 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={2}
                     dataKey="value"
                     stroke="none"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ borderRadius: '2px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontWeight: 'bold' }}
                     itemStyle={{ color: '#0f172a' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>

             <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sharp border border-slate-100">
                  <div className="flex items-center text-sm font-bold text-slate-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-primary" /> Correct
                  </div>
                  <span className="font-bold text-slate-900">{stats.correctCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sharp border border-slate-100">
                  <div className="flex items-center text-sm font-bold text-slate-700">
                    <XCircle className="w-4 h-4 mr-3 text-red-500" /> Incorrect
                  </div>
                  <span className="font-bold text-slate-900">{stats.incorrectCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sharp border border-slate-100">
                  <div className="flex items-center text-sm font-bold text-slate-700">
                    <HelpCircle className="w-4 h-4 mr-3 text-slate-400" /> Omitted
                  </div>
                  <span className="font-bold text-slate-900">{stats.unattemptedCount}</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* ── Detailed Analysis Module ── */}
      <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-sharp overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold tracking-widest text-slate-900 uppercase">Module Breakdown</h3>
        </div>
        <div className="p-6 md:p-8 space-y-8">
          {result.detailedAnalysis && result.detailedAnalysis.map((item, idx) => (
            <div key={item.questionId} className={`p-6 rounded-sharp border ${item.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : item.studentAnswer ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start gap-4 mb-4">
                <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm text-white mt-1 ${item.isCorrect ? 'bg-emerald-500' : item.studentAnswer ? 'bg-red-500' : 'bg-slate-400'}`}>
                  {idx + 1}
                </span>
                <span className="font-bold text-slate-900 text-lg leading-snug">{item.questionText}</span>
              </div>
              
              {item.type === 'coding' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 font-mono text-sm max-w-full">
                  <div className="border border-slate-300 rounded-md overflow-hidden flex flex-col">
                    <div className="bg-slate-100 p-2 font-bold text-slate-600 border-b border-slate-300 tracking-widest text-xs uppercase">Your Secure Input</div>
                    <div className="p-4 bg-slate-50 flex-1 whitespace-pre-wrap text-slate-700 overflow-x-auto">
                      {item.studentAnswer || 'NO INPUT DETECTED'}
                    </div>
                  </div>
                  <div className="border border-emerald-300 rounded-md overflow-hidden flex flex-col">
                    <div className="bg-emerald-50 p-2 font-bold text-emerald-800 border-b border-emerald-300 tracking-widest text-xs uppercase">Target Signature (Expected)</div>
                    <div className="p-4 bg-emerald-500/10 flex-1 whitespace-pre-wrap text-emerald-900 overflow-x-auto">
                      {item.correctOption}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-white border rounded-sharp border-slate-200 text-sm">
                    <span className="font-bold text-slate-500 block mb-1 uppercase tracking-widest text-xs">Your Protocol</span>
                    <span className={item.isCorrect ? 'text-emerald-600 font-bold text-base' : item.studentAnswer ? 'text-red-600 font-bold text-base' : 'text-slate-400'}>
                      {item.studentAnswer || 'OMITTED'}
                    </span>
                  </div>
                  <div className="p-4 bg-white border rounded-sharp border-emerald-200 text-sm">
                    <span className="font-bold text-emerald-600 block mb-1 uppercase tracking-widest text-xs">Target Protocol</span>
                    <span className="text-emerald-800 font-bold text-base">{item.correctOption}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ResultPage;
