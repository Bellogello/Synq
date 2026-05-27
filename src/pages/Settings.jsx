export default function Settings() {
  
  const clearData = () => {
    if(window.confirm("Are you sure? This will delete all your study topics.")) {
      localStorage.removeItem('synq_data');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-headline-md text-2xl text-on-surface mb-2">Settings</h2>

      <div className="glass-card rounded-xl overflow-hidden divide-y divide-outline-variant/10">
        
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">dark_mode</span>
            <div>
              <p className="text-on-surface font-bold text-sm">App Theme</p>
              <p className="text-on-surface-variant text-xs">Currently locked to Dark Mode</p>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <div>
              <p className="text-on-surface font-bold text-sm">Focus Alerts</p>
              <p className="text-on-surface-variant text-xs">Play sound when timer ends</p>
            </div>
          </div>
          {/* A visual-only toggle for aesthetics */}
          <div className="w-10 h-6 bg-primary rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full"></div>
          </div>
        </div>

      </div>

      <h3 className="font-headline-md text-sm text-on-surface-variant uppercase tracking-wider mt-8 mb-2">Danger Zone</h3>
      
      <button 
        onClick={clearData}
        className="w-full glass-card rounded-xl p-4 flex items-center justify-center gap-2 text-error hover:bg-error-container/10 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-lg">delete_forever</span>
        <span className="font-bold text-sm">Clear All Study Data</span>
      </button>

    </div>
  );
}