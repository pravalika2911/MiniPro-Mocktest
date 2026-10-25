import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import socketService from '../services/socket';
import { 
  Clock, 
  Send, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Loader2,
  AlertCircle,
  User,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  FileText
} from 'lucide-react';
import ProctoringEngine from '../components/ProctoringEngine';
import OfflineGuard from '../components/OfflineGuard';
import CodingQuestion from '../components/exam/CodingQuestion';
import MultipleChoiceQuestion from '../components/exam/MultipleChoiceQuestion';

const ExamInterface = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [timeLeftStr, setTimeLeftStr] = useState('--:--');
  const [isCritical, setIsCritical] = useState(false);

  const [examType, setExamType] = useState('standard');
  const [scenarioContext, setScenarioContext] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminWarning, setAdminWarning] = useState(null);
  
  // Buffer Key logic for offline resilience
  const bufferKey = `exam_buffer_${sessionId}`;
  const encryptBuffer = (data) => btoa(JSON.stringify(data));
  const decryptBuffer = (str) => JSON.parse(atob(str));

  const submitFinal = useCallback(async (reason = 'USER_SUBMIT') => {
    if (submitting) return;
    
    if (reason === 'USER_SUBMIT') {
      if (!navigator.onLine) {
        alert("Authentication lost. Reconnect to submit final responses.");
        return;
      }
      if (!window.confirm('Are you ready to commit your current responses to the mainframe?')) return;
    }

    setSubmitting(true);
    const payload = Object.entries(answers).map(([qId, opt]) => ({
      questionId: qId,
      selectedOption: opt
    }));

    try {
      await api.post(`/sessions/${sessionId}/submit`, { answers: payload, reason });
      localStorage.removeItem(bufferKey);
      navigate(`/dashboard/results/${sessionId}`);
    } catch {
      alert('Transmission failed. Your progress is buffered locally.');
      setSubmitting(false);
    }
  }, [answers, sessionId, submitting, navigate, bufferKey]);

  const handleAutoSubmit = useCallback((reason = 'AUTO_SUBMIT') => {
    submitFinal(reason);
  }, [submitFinal]);

  // 1. WebSocket & Initial Load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = socketService.connect(token);

    socket.on('session_terminated', () => {
      console.warn('[SOCKET] Administrative termination received');
      handleAutoSubmit('ADMIN_TERMINATION');
    });

    socket.on('admin_warning', (data) => {
      setAdminWarning(data.message);
      // Auto-clear after 15 seconds
      setTimeout(() => setAdminWarning(null), 15000);
    });

    socket.on('time_sync', (data) => {
      if (data.endTime) {
         setEndTime(new Date(data.endTime).getTime());
      }
    });

    const initSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/sessions/${sessionId}/sync`);
        
        // If already submitted/terminated, block access
        if (data.data.status !== 'In-Progress') {
          navigate(`/dashboard/results/${sessionId}`);
          return;
        }

        if (data.data.isExpired) {
          handleAutoSubmit('EXPIRED');
          return;
        }

        if (!data.data.questions || data.data.questions.length === 0) {
          setError("No questions available in the database. Please contact an admin.");
          setIsLoading(false);
          return;
        }

        setQuestions(data.data.questions);
        setEndTime(new Date(data.data.endTime).getTime());
        setExamType(data.data.examType || 'standard');
        setScenarioContext(data.data.scenarioContext || '');

        // Join room after sync confirms session is active
        socketService.joinSession(sessionId);

        // Restore answers from server
        let restored = {};
        if (data.data.answers) {
          data.data.answers.forEach(ans => { 
            restored[ans.questionId] = ans.selectedOption; 
          });
        }

        // Merge with local buffer if exists (offline recovery)
        const localBuffer = localStorage.getItem(bufferKey);
        if (localBuffer) {
          try {
            const decoded = decryptBuffer(localBuffer);
            restored = { ...restored, ...decoded };
          } catch {
            localStorage.removeItem(bufferKey);
          }
        }

        setAnswers(restored);
        setIsLoading(false);

      } catch (err) {
        console.error("Fetch error:", err);
        setError("Security handshake failed. Please refresh or check your connection.");
        setIsLoading(false);
      }
    };

    initSession();

    return () => {
      socketService.disconnect();
    };
    // eslint-disable-next-line
  }, [sessionId]);

  // 2. Timer Logic
  useEffect(() => {
    if (!endTime) return;

    const tick = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('00:00');
        handleAutoSubmit('EXPIRED');
      } else {
        setIsCritical(diff < 300000); // Pulse under 5 min
        const mins = Math.floor(diff / (1000 * 60)).toString().padStart(2, '0');
        const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setTimeLeftStr(`${mins}:${secs}`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime, handleAutoSubmit]);

  const handleRankingMove = (questionId, currentArr, index, direction) => {
    const newArr = [...currentArr];
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === 'down' && index < newArr.length - 1) {
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    }
    handleAnswerChange(questionId, newArr);
  };

  const handleAnswerChange = (questionId, value) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);
    localStorage.setItem(bufferKey, encryptBuffer(updatedAnswers));

    // Async save in background if online
    if (navigator.onLine) {
      const payload = Object.entries(updatedAnswers).map(([qId, opt]) => ({ 
        questionId: qId, 
        selectedOption: opt 
      }));
      api.put(`/sessions/${sessionId}/draft`, { answers: payload }).catch(() => {});
    }
  };

  // ── Render Helpers ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Synchronizing Environment...</h2>
        <p className="text-slate-500 mt-2 text-sm">Validating security tokens and loading modules.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-full max-w-md bg-white border border-red-100 shadow-2xl rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight mb-3">Assessment Blocked</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
          >
            Retry Validation
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <ProctoringEngine 
      sessionId={sessionId}
      maxStrikes={3} 
      onMaxStrikesReached={() => handleAutoSubmit('SECURITY_BREACH')}
    >
      <OfflineGuard />

      {/* ── Admin Warning Overlay ── */}
      {adminWarning && (
        <div className="fixed inset-x-0 top-24 z-[100] flex justify-center px-6 animate-in slide-in-from-top-full duration-500">
          <div className="w-full max-w-2xl bg-red-600 border-4 border-slate-900 shadow-[8px_8px_0px_#000] p-6 flex items-start gap-6 relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert className="w-24 h-24 text-white" />
             </div>
             <div className="bg-white p-3 rounded-lg border-2 border-slate-900 shrink-0">
                <AlertCircle className="w-8 h-8 text-red-600" />
             </div>
             <div className="relative z-10 flex-1">
                <h3 className="text-white font-black uppercase tracking-widest text-lg mb-1">Administrative Warning</h3>
                <p className="text-red-50 font-bold leading-relaxed">{adminWarning}</p>
                <p className="text-[10px] text-red-200 mt-4 uppercase font-black tracking-widest">This notification will persist for 15 seconds.</p>
             </div>
             <button 
               onClick={() => setAdminWarning(null)}
               className="relative z-20 text-white/50 hover:text-white transition-colors p-2"
             >
               <XCircle className="w-6 h-6" />
             </button>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        
        {/* ── Top Bar ── */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold tracking-tight">Assessment Gateway</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Candidate: {sessionId.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all duration-300 font-mono ${
              isCritical 
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Clock className={`w-5 h-5 ${isCritical ? 'animate-bounce' : ''}`} />
              <span className="text-2xl font-black">{timeLeftStr}</span>
            </div>

            <button
              onClick={() => submitFinal('USER_SUBMIT')}
              disabled={submitting}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 disabled:opacity-50 transition-all tracking-tight"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{submitting ? 'Transmitting...' : 'Submit Exam'}</span>
            </button>
          </div>
        </header>

        {/* ── Main Layout ── */}
        <div className="flex-1 flex flex-col lg:flex-row w-full mx-auto p-6 gap-6 overflow-hidden max-w-full">
          
          {examType === 'scenario-based' && scenarioContext && (
            <aside className="w-full lg:w-[35%] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden text-slate-100 h-full">
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black tracking-widest text-sm uppercase text-indigo-100">Scenario Briefing</h3>
              </div>
              <div className="p-8 overflow-y-auto flex-1 prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-300 font-medium text-lg">{scenarioContext}</p>
              </div>
            </aside>
          )}

          {/* Main Question Surface */}
          <main className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative min-w-0">
            
            {/* Question Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                  {currentIdx + 1}
                </span>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question Module</span>
              </div>
              <div className="flex gap-1.5">
                {questions.map((_, i) => (
                  <div key={i} className={`w-8 h-1 rounded-full transition-all duration-500 ${i === currentIdx ? 'bg-indigo-600 w-12' : i < currentIdx ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            {/* Question Body */}
            <div className="flex-1 overflow-auto p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 leading-[1.4] mb-12">
                  {currentQuestion.questionText}
                </h2>

                <div className="grid gap-4">
                  {currentQuestion.type === 'coding' ? (
                    <CodingQuestion 
                      question={currentQuestion} 
                      value={answers[currentQuestion._id] || ''} 
                      onChange={(val) => handleAnswerChange(currentQuestion._id, val)}
                    />
                  ) : currentQuestion.type === 'ranking' ? (
                    (() => {
                       const currentArr = Array.isArray(answers[currentQuestion._id]) 
                           ? answers[currentQuestion._id] 
                           : currentQuestion.options;
                       return currentArr.map((option, idx) => (
                         <div key={idx} className={`group flex items-center gap-6 p-4 rounded-2xl border-2 transition-all duration-300 ${Array.isArray(answers[currentQuestion._id]) ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-slate-200'}`}>
                           <div className="flex flex-col items-center justify-center gap-1">
                             <button onClick={() => handleRankingMove(currentQuestion._id, currentArr, idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"><ChevronUp className="w-6 h-6"/></button>
                             <button onClick={() => handleRankingMove(currentQuestion._id, currentArr, idx, 'down')} disabled={idx === currentArr.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"><ChevronDown className="w-6 h-6"/></button>
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-white border shadow-sm flex items-center justify-center font-bold text-lg text-indigo-600">
                             {idx + 1}
                           </div>
                           <span className="text-lg font-semibold text-slate-700 flex-1">{option}</span>
                         </div>
                       ));
                    })()
                  ) : currentQuestion.type === 'sjt' ? (
                    currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion._id] === option;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerChange(currentQuestion._id, option)}
                          className={`group relative flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-500 shadow-xl shadow-amber-100/50' 
                              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50 hover:shadow-lg'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                            isSelected 
                              ? 'bg-amber-500 border-amber-500 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-white group-hover:border-amber-300 group-hover:text-amber-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-lg font-semibold transition-all duration-300 ${isSelected ? 'text-amber-900' : 'text-slate-700'}`}>
                            {option}
                          </span>
                          {isSelected && (
                            <div className="ml-auto animate-in zoom-in duration-300">
                               <CheckCircle2 className="w-7 h-7 text-amber-500 fill-amber-50" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <MultipleChoiceQuestion 
                      question={currentQuestion}
                      value={answers[currentQuestion._id]}
                      onChange={(val) => handleAnswerChange(currentQuestion._id, val)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pagination Controls */}
            <footer className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-6 py-3 font-bold text-slate-600 flex items-center gap-2 hover:bg-white hover:text-indigo-600 disabled:opacity-30 rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                <ChevronLeft className="w-5 h-5" /> Previous Module
              </button>
              
              <div className="hidden sm:flex text-sm font-bold text-slate-400 tracking-widest uppercase">
                Progress: {Object.keys(answers).length}/{questions.length} Answered
              </div>

              <button
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
                className="px-6 py-3 font-bold text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all flex items-center gap-2 disabled:opacity-30"
              >
                Next Module <ChevronRight className="w-5 h-5" />
              </button>
            </footer>
          </main>

          {/* Navigation Grid (Sidebar) */}
          <aside className="w-full lg:w-80 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden h-[fit-content]">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Sequence Map</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-5 gap-3">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q._id];
                  const isCurrent = currentIdx === idx;
                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${
                        isCurrent 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 z-10' 
                          : isAnswered 
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 tracking-widest uppercase">
                  <div className="w-3 h-3 rounded bg-indigo-600" /> Current Module
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 tracking-widest uppercase">
                  <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Validated Response
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 tracking-widest uppercase">
                  <div className="w-3 h-3 rounded bg-slate-50 border border-slate-100" /> Pending Analysis
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </ProctoringEngine>
  );
};

export default ExamInterface;
