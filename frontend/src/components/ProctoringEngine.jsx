import React, { useEffect, useState, createContext, useCallback } from 'react';
import LockoutModal from './LockoutModal';
import api from '../services/api';
import { Maximize, ShieldAlert } from 'lucide-react';

const ProctoringContext = createContext();

const ProctoringEngine = ({ children, sessionId, maxStrikes = 3, onMaxStrikesReached }) => {
  const [violationCount, setViolationCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const logViolationToBackend = useCallback(async (type) => {
    if (!sessionId) return;
    try {
      await api.put(`/sessions/${sessionId}/violation`, { type });
    } catch (err) {
      console.error("Failed to transmit violation telemetry:", err);
    }
  }, [sessionId]);

  const triggerViolation = useCallback((type = 'UNSPECIFIED_BREACH') => {
    setViolationCount((prev) => {
      const newCount = prev + 1;
      
      // Send to server
      logViolationToBackend(type);
      
      setIsLocked(true);
      
      if (newCount >= maxStrikes) {
        if (onMaxStrikesReached) {
          onMaxStrikesReached();
        }
      }
      return newCount;
    });
  }, [maxStrikes, onMaxStrikesReached, logViolationToBackend]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('CONTEXT_MENU_ATTEMPT');
    };
    
    const handleCopyPaste = (e) => {
      e.preventDefault();
      triggerViolation('CLIPBOARD_TAMPER');
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_SWITCH');
      }
    };

    const handleBlur = () => {
      triggerViolation('WINDOW_BLUR');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        setIsFullscreen(false);
        // Only trigger violation if they were already in the exam (had strikes or just general exit)
        // We'll trigger it because leaving fullscreen is a strict violation during the exam.
        triggerViolation('EXIT_FULLSCREEN');
      } else {
        setIsFullscreen(true);
      }
    };

    const handleKeyDown = (e) => {
      // Block F12, F5, Ctrl+R, Ctrl+P, Ctrl+S, Ctrl+U
      const forbiddenKeys = ['F12', 'F5'];
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (forbiddenKeys.includes(e.key) || (isCtrlOrCmd && ['r', 'R', 'p', 'P', 's', 'S', 'u', 'U', 'c', 'C', 'v', 'V'].includes(e.key))) {
        e.preventDefault();
        triggerViolation('UNAUTHORIZED_KEYSTROKE');
      }
    };

    // Attach strict listeners
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [triggerViolation]);

  const handleRestore = () => {
    if (violationCount >= maxStrikes) return;
    setIsLocked(false);
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  return (
    <ProctoringContext.Provider value={{ violationCount, isLocked }}>
      {isLocked && (
        <LockoutModal 
          violationCount={violationCount} 
          maxStrikes={maxStrikes}
          onRestore={handleRestore}
        />
      )}
      
      {/* Fullscreen Enforcer Overlay */}
      {!isFullscreen && !isLocked && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg text-center border-2 border-indigo-100">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <Maximize className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-4">Secure Screen Lock Required</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              This assessment requires a secure boundary. You must enter fullscreen mode to begin or continue the exam. Exiting fullscreen will flag a security violation.
            </p>
            <button
              onClick={enterFullscreen}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 w-full text-lg"
            >
              <ShieldAlert className="w-5 h-5" />
              Initialize Secure Lock
            </button>
          </div>
        </div>
      )}

      {/* Hide the exam content completely from the DOM if locked or not in fullscreen */}
      {(!isLocked && isFullscreen) && (
        <div className="opacity-100 transition-opacity duration-500">
          {children}
        </div>
      )}
    </ProctoringContext.Provider>
  );
};

export default ProctoringEngine;
