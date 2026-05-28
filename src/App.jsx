import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Timer from './pages/Timer';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

export default function App() {
  const [session, setSession] = useState(null);

  // 1. SUPABASE AUTH HOOK
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. THEME HOOK (Moved up here!)
  useEffect(() => {
    const savedTheme = localStorage.getItem('synq-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // 3. THE BOUNCER (Hooks are NOT allowed below this point!)
  if (!session) {
    return (
      <div className="bg-[#0b111e] min-h-screen font-body-md overflow-hidden">
        <div className="max-w-md mx-auto min-h-screen relative bg-surface shadow-2xl border-x border-outline-variant/10 flex flex-col justify-center">
          <Auth onLogin={setSession} />
        </div>
      </div>
    );
  }

  // If logged in, show the full app!
  return (
    <BrowserRouter>
      <div className="bg-[#0b111e] min-h-screen font-body-md overflow-x-hidden custom-scrollbar">
        <div className="max-w-md mx-auto min-h-screen relative bg-surface shadow-2xl border-x border-outline-variant/10 pb-safe">
          <Header />
          
          <main className="pt-20 pb-28 px-4 space-y-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  );
}