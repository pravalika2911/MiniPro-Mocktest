/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const LockoutModal = ({ violationCount, maxStrikes, onRestore }) => {
  const [canRestore, setCanRestore] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const isPermanent = violationCount >= maxStrikes;

  useEffect(() => {
    if (isPermanent) return;

    setCanRestore(false);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanRestore(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [violationCount, isPermanent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-critical/40 backdrop-blur-md"></div>
      
      <div className="relative z-10 bg-slate-900 border border-critical shadow-[0_0_50px_rgba(225,29,72,0.4)] p-10 rounded-2xl max-w-lg w-full text-center">
        <div className="w-24 h-24 bg-critical/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-12 h-12 text-critical animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 tracking-widest font-mono">
          CRITICAL SYSTEM LOCKOUT
        </h2>
        
        <p className="text-red-300 font-mono text-sm mb-8 uppercase tracking-widest px-4">
          Environment breach detected. Unauthorized tab switching or loss of window focus.
        </p>

        <div className="bg-black/40 rounded-lg p-6 mb-8 border border-red-500/30">
          <div className="flex items-center justify-center text-red-500 mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-bold tracking-widest">VIOLATION ALERT</span>
          </div>
          <div className="text-4xl font-black text-white font-mono">
            STRIKE {violationCount} / {maxStrikes}
          </div>
          {isPermanent && (
            <div className="mt-4 text-red-400 text-sm font-bold animate-pulse">
              MAXIMUM VIOLATIONS REACHED. SESSION TERMINATED AND FLAGGED FOR REVIEW.
            </div>
          )}
        </div>

        {!isPermanent && (
          <button
            onClick={onRestore}
            disabled={!canRestore}
            className={`w-full py-4 rounded-xl font-bold font-mono tracking-widest transition-all duration-300 ${
              canRestore 
                ? 'bg-critical hover:bg-red-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)] cursor-pointer' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {canRestore ? 'RESTORE SECURE ENVIRONMENT' : `ENFORCING PROTOCOL... (${countdown}s)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default LockoutModal;
