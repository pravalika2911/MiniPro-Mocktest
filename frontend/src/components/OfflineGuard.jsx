import React, { useState, useEffect } from 'react';
import { WifiOff, Search } from 'lucide-react';

const OfflineGuard = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md font-sans">
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full text-center border border-slate-700 shadow-2xl">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Connection Lost</h3>
        <p className="text-slate-400 mb-6 text-sm">
          Your exam is paused and answers are secured locally. We are waiting for your network connection to return.
        </p>
        <div className="flex items-center justify-center text-primary text-sm font-medium">
          <Search className="w-4 h-4 mr-2 animate-spin" />
          Attempting to reconnect...
        </div>
      </div>
    </div>
  );
};

export default OfflineGuard;
