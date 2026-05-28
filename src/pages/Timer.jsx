import { useState, useEffect } from 'react';

export default function Timer() {
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus');
  const [endTime, setEndTime] = useState(null);

  // 1. Recover timer state from local storage on load
  useEffect(() => {
    const savedEnd = localStorage.getItem('synq_timer_end');
    const savedMode = localStorage.getItem('synq_timer_mode') || 'focus';
    
    setMode(savedMode);

    if (savedEnd) {
      const endTimestamp = parseInt(savedEnd, 10);
      if (endTimestamp > Date.now()) {
        setEndTime(endTimestamp);
        setIsRunning(true);
        setTimeLeft(Math.ceil((endTimestamp - Date.now()) / 1000));
      } else {
        localStorage.removeItem('synq_timer_end');
        setTimeLeft(0);
      }
    }
  }, []);

  // 2. The Bulletproof Tick (Uses System Clock)
  useEffect(() => {
    let interval = null;
    if (isRunning && endTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          setIsRunning(false);
          localStorage.removeItem('synq_timer_end');
          // Optional: Play sound here
        }
      }, 1000); // We still check every second to update the UI
    }
    return () => clearInterval(interval);
  }, [isRunning, endTime]);

  // Controls
  const toggleTimer = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      localStorage.removeItem('synq_timer_end');
    } else {
      // Play
      const newEnd = Date.now() + timeLeft * 1000;
      setEndTime(newEnd);
      localStorage.setItem('synq_timer_end', newEnd.toString());
      localStorage.setItem('synq_timer_mode', mode);
      setIsRunning(true);
    }
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    localStorage.removeItem('synq_timer_end');
    setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    localStorage.removeItem('synq_timer_end');
    localStorage.setItem('synq_timer_mode', newMode);
    setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const skipToNext = () => switchMode(mode === 'focus' ? 'break' : 'focus');

  // Adjust time functions (when paused)
  const changeTime = (type, amount) => {
    if (type === 'focus') {
      setFocusDuration(prev => {
        const val = Math.max(1, Math.min(120, prev + amount));
        if (!isRunning && mode === 'focus') setTimeLeft(val * 60);
        return val;
      });
    } else {
      setBreakDuration(prev => {
        const val = Math.max(1, Math.min(60, prev + amount));
        if (!isRunning && mode === 'break') setTimeLeft(val * 60);
        return val;
      });
    }
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4">
      {/* Mode Switches */}
      <div className="flex gap-4 p-1 bg-surface-container-high rounded-full border border-outline-variant/20">
        <button onClick={() => switchMode('focus')} className={`px-6 py-2 rounded-full font-label-sm transition-all ${mode === 'focus' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Deep Focus</button>
        <button onClick={() => switchMode('break')} className={`px-6 py-2 rounded-full font-label-sm transition-all ${mode === 'break' ? 'bg-tertiary text-on-tertiary' : 'text-on-surface-variant'}`}>Short Break</button>
      </div>

      {/* The Timer Circle */}
      <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-4 border-surface-container-high shadow-2xl bg-surface-container-lowest">
        <h1 className={`font-display text-7xl tracking-tighter ${mode === 'focus' ? 'text-primary' : 'text-tertiary'}`}>{minutes}:{seconds}</h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button onClick={resetTimer} className="material-symbols-outlined p-4 rounded-full text-on-surface-variant bg-surface-container-high active:scale-95">replay</button>
        <button onClick={toggleTimer} className={`p-6 rounded-full flex items-center justify-center shadow-lg active:scale-95 ${mode === 'focus' ? 'bg-primary text-on-primary' : 'bg-tertiary text-on-tertiary'}`}>
          <span className="material-symbols-outlined text-4xl">{isRunning ? 'pause' : 'play_arrow'}</span>
        </button>
        <button onClick={skipToNext} className="material-symbols-outlined p-4 rounded-full text-on-surface-variant bg-surface-container-high active:scale-95">skip_next</button>
      </div>

      {/* Settings Panel (Only show when paused) */}
      <div className={`w-full max-w-xs transition-all duration-300 overflow-hidden ${isRunning ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100 h-24 mt-4'}`}>
        <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 flex justify-between items-center h-full">
          <div className="flex flex-col items-center gap-2 w-1/2">
            <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1">Focus</label>
            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/20">
              <button onClick={() => changeTime('focus', -5)} className="w-7 h-7 rounded-lg material-symbols-outlined text-sm">remove</button>
              <span className="font-display font-bold text-lg w-8 text-center text-on-surface">{focusDuration}</span>
              <button onClick={() => changeTime('focus', 5)} className="w-7 h-7 rounded-lg material-symbols-outlined text-sm">add</button>
            </div>
          </div>
          <div className="w-px h-12 bg-outline-variant/20"></div>
          <div className="flex flex-col items-center gap-2 w-1/2">
            <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1">Break</label>
            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/20">
              <button onClick={() => changeTime('break', -1)} className="w-7 h-7 rounded-lg material-symbols-outlined text-sm">remove</button>
              <span className="font-display font-bold text-lg w-8 text-center text-on-surface">{breakDuration}</span>
              <button onClick={() => changeTime('break', 1)} className="w-7 h-7 rounded-lg material-symbols-outlined text-sm">add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}