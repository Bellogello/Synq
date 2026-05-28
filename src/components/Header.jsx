import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    // Expanded to max-w-screen-xl for laptop view
    <header className="fixed top-0 inset-x-0 mx-auto w-full max-w-screen-xl bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 z-50 px-4 py-3 flex justify-between items-center transition-all duration-300">
      
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[1.5rem]">analytics</span>
        <h1 className="font-display font-bold text-[1.25rem] text-on-surface">Synq</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors active:scale-95 text-[1.75rem]"
        >
          account_circle
        </button>

        <div 
          className={`absolute right-0 mt-3 w-[14rem] backdrop-blur-2xl rounded-xl border border-outline-variant/30 py-2 shadow-2xl z-50 transition-all origin-top-right ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
          }`}
          style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}
        >
          <div className="px-4 py-3 border-b border-outline-variant/10 mb-1">
            <p className="text-[0.75rem] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-[0.875rem] font-bold text-on-surface truncate">
              {user?.is_anonymous ? 'Guest User' : user?.email}
            </p>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full text-left px-4 py-2 text-[0.875rem] text-error hover:bg-error-container/10 transition-colors flex items-center gap-3 font-bold"
          >
            <span className="material-symbols-outlined text-[1.25rem]">logout</span>
            Log Out
          </button>
        </div>
      </div>

    </header>
  );
}