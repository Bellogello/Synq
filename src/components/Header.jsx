export default function Header() {
  return (
    // Added max-w-[420px], left-1/2, and -translate-x-1/2 to keep it locked to the center column
    <header className="fixed top-0 w-full max-w-[420px] left-1/2 -translate-x-1/2 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="flex items-center justify-between px-md py-sm w-full">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">analytics</span>
          <h1 className="font-headline-md text-[20px] font-bold text-primary">Synq</h1>
        </div>
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-primary-container/10 p-2 rounded-full transition-all active:scale-90">
            account_circle
          </button>
        </div>
      </div>
    </header>
  );
}