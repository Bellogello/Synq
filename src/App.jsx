import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Timer from './pages/Timer';
import Archive from './pages/Archive';
import Groups from './pages/Groups';
import SquadWorkspace from './pages/SquadWorkspace';
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

  // 2. THEME HOOK
useEffect(() => {
  const theme = localStorage.getItem('synq_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}, []);

  // 3. THE BOUNCER
  if (!session) {
    return (
      // Removed hardcoded hex, replaced with your theme variable
      <div className="bg-surface min-h-screen font-body-md overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 pt-[5rem] pb-[8rem]">
          <Auth onLogin={setSession} />
        </div>
      </div>
    );
  }

  // If logged in, show the full app!
  return (
    <BrowserRouter>
      {/* 1. Replaced hardcoded hex with bg-surface so your themes span the whole monitor */}
      <div className="bg-surface min-h-screen font-body-md overflow-x-hidden custom-scrollbar">
        
        {/* 🚨 THE FIX: Changed max-w-md to max-w-screen-xl! Removed the border-x so it looks like a fluid desktop app 🚨 */}
        <div className="w-full max-w-screen-xl mx-auto min-h-screen relative pb-safe">
          
          <Header />
          
          <main className="w-full px-4 pt-[5rem] pb-[8rem]">
             <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/squad/:groupId" element={<SquadWorkspace />} />
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