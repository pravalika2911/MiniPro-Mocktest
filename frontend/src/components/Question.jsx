import React from 'react';

const Question = ({ question, selectedOption, onSelect, index }) => {
  if (!question) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 bg-surface border border-slate-700/50 rounded-xl p-6 shadow-xl transition-all font-sans">
      <div className="flex items-start mb-6">
        <div className="flex-shrink-0 w-8 h-8 bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-center text-primary font-mono font-bold mr-4">
          {index + 1}
        </div>
        <h3 className="text-xl text-white font-medium leading-relaxed">
          {question.text}
        </h3>
      </div>

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 border flex items-center ${isSelected
                ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-primary'
                : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${isSelected ? 'border-primary' : 'border-slate-500'
                  }`}
              >
                {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <span className="font-medium text-lg">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Question;
