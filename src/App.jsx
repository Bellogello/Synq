import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Timer from './pages/Timer';
import Archive from './pages/Archive';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      {/* Outer background for the monitor */}
      <div className="bg-[#0b111e] min-h-screen font-body-md overflow-x-hidden custom-scrollbar">
        
        {/* Centered column using rem-based max-width (max-w-md) instead of px */}
        <div className="max-w-md mx-auto min-h-screen relative bg-surface shadow-2xl border-x border-outline-variant/10 pb-safe">
          <Header />
          
          <main className="pt-20 pb-28 px-4 space-y-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          <BottomNav />
        </div>

      </div>
    </BrowserRouter>
  );
}