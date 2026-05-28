import { useState, useEffect } from 'react';

export default function Timer() {
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'

  // The main countdown timer
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

  // Controls
  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const skipToNext = () => {
    switchMode(mode === 'focus' ? 'break' : 'focus');
  };

  // Custom Time Adjusters (Fixes the pause bug by updating directly!)
  const changeFocus = (amount) => {
    setFocusDuration(prev => {
      const newVal = Math.max(1, Math.min(120, prev + amount));
      if (!isRunning && mode === 'focus') setTimeLeft(newVal * 60);
      return newVal;
    });
  };

  const changeBreak = (amount) => {
    setBreakDuration(prev => {
      const newVal = Math.max(1, Math.min(60, prev + amount));
      if (!isRunning && mode === 'break') setTimeLeft(newVal * 60);
      return newVal;
    });
  };

  // Formatting display
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4">
      
      {/* Mode Switches */}
      <div className="flex gap-4 p-1 bg-surface-container-high rounded-full border border-outline-variant/20">
        <button 
          onClick={() => switchMode('focus')}
          className={`px-6 py-2 rounded-full font-label-sm transition-all ${mode === 'focus' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Deep Focus
        </button>
        <button 
          onClick={() => switchMode('break')}
          className={`px-6 py-2 rounded-full font-label-sm transition-all ${mode === 'break' ? 'bg-tertiary text-on-tertiary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Short Break
        </button>
      </div>

      {/* The Aesthetic Timer Circle */}
      <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-4 border-surface-container-high shadow-2xl bg-surface-container-lowest transition-all duration-500">
        <h1 className={`font-display text-7xl tracking-tighter ${mode === 'focus' ? 'text-primary' : 'text-tertiary'}`}>
          {minutes}:{seconds}
        </h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button onClick={resetTimer} className="material-symbols-outlined p-4 rounded-full text-on-surface-variant bg-surface-container-high active:scale-95 hover:text-on-surface transition-all">
          replay
        </button>
        
        <button onClick={toggleTimer} className={`p-6 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all hover:brightness-110 ${mode === 'focus' ? 'bg-primary text-on-primary shadow-primary/20' : 'bg-tertiary text-on-tertiary shadow-tertiary/20'}`}>
          <span className="material-symbols-outlined text-4xl">
            {isRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <button onClick={skipToNext} className="material-symbols-outlined p-4 rounded-full text-on-surface-variant bg-surface-container-high active:scale-95 hover:text-on-surface transition-all">
          skip_next
        </button>
      </div>

      {/* Settings Panel (Premium App Style) */}
      <div className={`w-full max-w-xs transition-all duration-300 overflow-hidden ${isRunning ? 'opacity-0 scale-95 pointer-events-none h-0' : 'opacity-100 scale-100 h-24 mt-4'}`}>
        <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 flex justify-between items-center w-full h-full">
          
          {/* Focus Settings */}
          <div className="flex flex-col items-center gap-2 w-1/2">
            <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
              Focus
            </label>
            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/20">
              <button onClick={() => changeFocus(-5)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-display font-bold text-lg w-8 text-center text-on-surface">{focusDuration}</span>
              <button onClick={() => changeFocus(5)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          <div className="w-px h-12 bg-outline-variant/20"></div>

          {/* Break Settings */}
          <div className="flex flex-col items-center gap-2 w-1/2">
            <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary">coffee</span>
              Break
            </label>
            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/20">
              <button onClick={() => changeBreak(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-display font-bold text-lg w-8 text-center text-on-surface">{breakDuration}</span>
              <button onClick={() => changeBreak(1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}