import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
    };

    fetchUserAndProfile();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => await supabase.auth.signOut();

  // Determine what to show
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest';
  
  // Prioritize real uploaded photo -> fallback to illustration
  const avatarImage = profile?.avatar_url || (profile?.avatar_seed 
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatar_seed}&backgroundColor=transparent`
    : null);

  return (
    <header className="fixed top-0 inset-x-0 mx-auto w-full max-w-screen-xl bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 z-50 px-4 py-3 flex justify-between items-center transition-all duration-300">
      
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[1.5rem]">analytics</span>
        <h1 className="font-display font-bold text-[1.25rem] text-on-surface">Synq</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-10 h-10 rounded-full border-2 border-outline-variant/30 overflow-hidden bg-surface-container-highest hover:border-primary transition-all active:scale-95 flex items-center justify-center"
        >
          {avatarImage ? (
            <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant text-[1.5rem]">account_circle</span>
          )}
        </button>

        <div 
          className={`absolute right-0 mt-3 w-[14rem] backdrop-blur-2xl rounded-xl border border-outline-variant/30 py-2 shadow-2xl z-50 transition-all origin-top-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
          style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}
        >
          <div className="px-4 py-3 border-b border-outline-variant/10 mb-1 flex items-center gap-3">
            {avatarImage && (
              <img src={avatarImage} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-outline-variant/20 bg-surface-container-highest" />
            )}
            <div className="min-w-0">
              <p className="text-[0.875rem] font-bold text-on-surface truncate">{displayName}</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[0.875rem] text-error hover:bg-error-container/10 transition-colors flex items-center gap-3 font-bold">
            <span className="material-symbols-outlined text-[1.25rem]">logout</span>
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}