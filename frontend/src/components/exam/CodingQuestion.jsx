import React from 'react';
import { Terminal } from 'lucide-react';

const CodingQuestion = ({ value = '', onChange }) => {
  return (
    <div className="flex flex-col h-[500px] border border-slate-700 bg-[#0f172a] rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center px-4 py-3 bg-[#1e293b] border-b border-slate-700 select-none">
        <Terminal className="w-4 h-4 text-emerald-400 mr-2" />
        <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-widest">Interactive Secure Terminal</span>
        <div className="ml-auto flex gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e293b] border-r border-slate-700 flex flex-col text-right font-mono text-slate-500 text-sm py-4 select-none pointer-events-none z-10 hidden sm:block overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
             <div key={i} className="pr-3 opacity-50 leading-[24px]">{i + 1}</div>
          ))}
        </div>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck="false"
          placeholder="// Write your secure code implementation here..."
          className="absolute inset-0 w-full h-full pl-4 sm:pl-16 pr-4 py-4 bg-transparent text-emerald-400 font-mono text-[15px] leading-[24px] resize-none outline-none focus:ring-0 selection:bg-slate-700/50"
        />
      </div>
    </div>
  );
};

export default CodingQuestion;
