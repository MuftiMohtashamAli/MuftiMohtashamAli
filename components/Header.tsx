import React from 'react';
import { Bot, User, Award, BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
            {/* Avatar Placeholder */}
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-emerald-500 shadow-lg">
               <Bot size={48} className="text-emerald-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                AI Expert
            </div>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Mufti Mohtasham Ali</h1>
          <p className="text-emerald-700 font-medium">Islamic Scholar | Head of AI Institute | Educator</p>
          <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-3">
             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                <BookOpen size={14} /> Islamic Studies
             </span>
             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                <Award size={14} /> AI Leadership
             </span>
             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                <User size={14} /> Youth Mentor
             </span>
          </div>
        </div>
      </div>
    </header>
  );
};
