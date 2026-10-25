import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const MultipleChoiceQuestion = ({ question, value, onChange }) => {
  return (
    <div className="grid gap-4">
      {question.options.map((option, idx) => {
        const isSelected = value === option;
        
        return (
          <button
            key={idx}
            onClick={() => onChange(option)}
            className={`group relative flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
              isSelected 
                ? 'bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-100/50' 
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-lg'
            }`}
          >
            <div className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center font-bold text-lg transition-all duration-300 ${
              isSelected 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-white group-hover:border-indigo-300 group-hover:text-indigo-600'
            }`}>
              {String.fromCharCode(65 + idx)}
            </div>
            <span className={`text-lg font-semibold transition-all duration-300 ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
              {option}
            </span>
            {isSelected && (
              <div className="ml-auto animate-in zoom-in duration-300 shrink-0">
                 <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-50" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MultipleChoiceQuestion;
