import { useState, useEffect } from 'react';

export default function Timer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(time => time - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play a sound here in the future!
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      
      {/* Mode Switches */}
      <div className="flex gap-4 p-1 bg-surface-container-high rounded-full border border-outline-variant/20">
        <button 
          onClick={() => switchMode('focus')}
          className={`px-6 py-2 rounded-full font-label-sm transition-all ${mode === 'focus' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
        >
          Deep Focus
        </button>
        <button 
          onClick={() => switchMode('break')}
          className={`px-6 py-2 rounded-full font-label-sm transition-all ${mode === 'break' ? 'bg-tertiary text-on-tertiary' : 'text-on-surface-variant'}`}
        >
          Short Break
        </button>
      </div>

      {/* The Aesthetic Timer Circle */}
      <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-4 border-surface-container-high shadow-2xl bg-surface-container-lowest">
        <h1 className={`font-display text-6xl tracking-tighter ${mode === 'focus' ? 'text-primary' : 'text-tertiary'}`}>
          {minutes}:{seconds}
        </h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button onClick={resetTimer} className="material-symbols-outlined p-4 rounded-full text-on-surface-variant bg-surface-container-high active:scale-95 transition-all">
          replay
        </button>
        
        <button onClick={toggleTimer} className={`p-6 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${mode === 'focus' ? 'bg-primary text-on-primary shadow-primary/20' : 'bg-tertiary text-on-tertiary shadow-tertiary/20'}`}>
          <span className="material-symbols-outlined text-3xl">
            {isRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <button className="material-symbols-outlined p-4 rounded-full text-on-surface-variant bg-surface-container-high active:scale-95 transition-all">
          skip_next
        </button>
      </div>

    </div>
  );
}