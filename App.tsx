import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Power, Activity } from 'lucide-react';
import { useLiveAudio } from './hooks/useLiveAudio';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { ConnectionState } from './types';

const App: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    connectionState, 
    transcripts, 
    analyser,
    volume
  } = useLiveAudio();
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const handleToggleConnection = () => {
    if (isConnected || isConnecting) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        
        {/* Connection Status & Instructions */}
        {!isConnected && !isConnecting && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-slate-800">Welcome to your Personal AI Mentorship</h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              Connect to speak with Mufti Mohtasham Ali's AI persona about Islamic studies, AI technology, career guidance, and finding balance in the modern world.
            </p>
            <div className="flex justify-center pt-4">
                 <button 
                  onClick={handleToggleConnection}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-white transition-all duration-200 bg-emerald-600 rounded-full hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                 >
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Start Voice Session</span>
                 </button>
            </div>
          </div>
        )}

        {/* Live Interface */}
        {(isConnected || isConnecting) && (
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative">
             
             {/* Visualizer Area */}
             <div className="h-48 md:h-64 bg-slate-900 relative flex items-center justify-center">
                {isConnecting ? (
                  <div className="flex flex-col items-center gap-3 text-emerald-400 animate-pulse">
                    <Activity size={32} />
                    <span className="text-sm font-medium tracking-wide">ESTABLISHING CONNECTION...</span>
                  </div>
                ) : (
                  <>
                     <div className="absolute top-4 right-4 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                         <span className="text-xs text-white/70 font-mono">LIVE</span>
                     </div>
                     <Visualizer analyser={analyser} isActive={isConnected} color="#34d399" />
                  </>
                )}
             </div>

             {/* Transcript Area */}
             <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 min-h-[300px] max-h-[500px]">
                {transcripts.length === 0 && isConnected && (
                    <div className="text-center text-slate-400 text-sm mt-10 italic">
                        Listening... Ask me about AI, Faith, or Career.
                    </div>
                )}
                {transcripts.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                        item.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
             </div>

             {/* Bottom Controls */}
             <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-medium px-2">
                    {isConnected ? 'Microphone Active' : 'Connecting...'}
                </div>
                <button 
                  onClick={disconnect}
                  className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors border border-red-200 font-medium text-sm"
                >
                    <Power size={16} />
                    <span>End Session</span>
                </button>
             </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-400 text-xs">
        <p>AI Powered by Google Gemini 2.5 • Developed for Educational Purposes</p>
      </footer>
    </div>
  );
};

export default App;
