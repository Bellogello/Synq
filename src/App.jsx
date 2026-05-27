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

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // THE BOUNCER: If the user is NOT logged in, ONLY show the Auth screen
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