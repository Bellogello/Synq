import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // 1. Get the current user
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    // 2. Listen for outside clicks to close the dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // This instantly clears the session and kicks you back to Auth.jsx
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 w-full max-w-md bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 z-50 px-4 py-3 flex justify-between items-center">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        <h1 className="font-display font-bold text-xl text-on-surface">Synq</h1>
      </div>

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors active:scale-95"
        >
          account_circle
        </button>

        {/* Dropdown Menu */}
        <div 
          className={`absolute right-0 mt-3 w-56 glass-card rounded-xl border border-outline-variant/30 py-2 shadow-2xl transition-all origin-top-right ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
          }`}
        >
          <div className="px-4 py-3 border-b border-outline-variant/10 mb-1">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-sm font-bold text-on-surface truncate">
              {/* Check if user is a guest, otherwise show their email */}
              {user?.is_anonymous ? 'Guest User' : user?.email}
            </p>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-container/10 transition-colors flex items-center gap-3 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Log Out
          </button>
        </div>
      </div>

    </header>
  );
}