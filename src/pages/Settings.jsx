import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'dark', name: 'Synq Classic', bg: '#0b111e', primary: '#14b8a6', secondary: '#818cf8' },
  { id: 'midnight-rose', name: 'Midnight Rose', bg: '#F8E9EB', primary: '#051F45', secondary: '#8E3B46' },
  { id: 'slate-peach', name: 'Slate Peach', bg: '#1A2226', primary: '#FFCDC1', secondary: '#E07A5F' },
  { id: 'crimson-night', name: 'Crimson Night', bg: '#120812', primary: '#C30F45', secondary: '#F4A261' },
  { id: 'mint-marine', name: 'Mint Marine', bg: '#001A33', primary: '#DCF4A2', secondary: '#FFB703' },
  { id: 'warm-mocha', name: 'Warm Mocha', bg: '#F5EBE0', primary: '#6C584C', secondary: '#A98467' },
];

export default function Settings() {
  const [activeTheme, setActiveTheme] = useState('dark');

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('synq-theme') || 'dark';
    setActiveTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const changeTheme = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('synq-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };
  
  const clearData = () => {
    if(window.confirm("Are you sure? This will log you out and clear local caches.")) {
      localStorage.removeItem('synq-theme');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-headline-md text-2xl text-on-surface mb-2">Settings</h2>

      {/* Theme Selector */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">palette</span>
          <div>
            <p className="text-on-surface font-bold text-sm">App Theme</p>
            <p className="text-on-surface-variant text-xs">Select your aesthetic</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => changeTheme(theme.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95 ${
                activeTheme === theme.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-outline-variant/30 hover:border-outline-variant'
              }`}
            >
                <div 
                className="w-6 h-6 rounded-full border-2 border-on-surface/20 shadow-inner"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.bg} 33%, ${theme.primary} 33% 66%, ${theme.secondary} 66%)` 
                }}
              ></div>
              <span className="text-xs font-bold text-on-surface">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <h3 className="font-headline-md text-sm text-on-surface-variant uppercase tracking-wider mt-8 mb-2">Danger Zone</h3>
      
      <button 
        onClick={clearData}
        className="w-full glass-card rounded-xl p-4 flex items-center justify-center gap-2 text-error hover:bg-error-container/10 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
        <span className="font-bold text-sm">Reset App</span>
      </button>

    </div>
  );
}