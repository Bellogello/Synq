import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  // A helper function to apply the active glow effect to the correct icon
  const navClass = ({ isActive }) => 
    `flex flex-col items-center justify-center p-3 rounded-full transition-all active:scale-90 ${
      isActive 
        ? 'bg-primary-container text-on-primary-container shadow-sm' 
        : 'text-on-surface-variant hover:text-primary'
    }`;

  return (
    <nav className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 z-50 rounded-t-2xl bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-2xl">
      <div className="flex justify-around items-center px-6 py-2 w-full pb-safe-offset-4">
        
        <NavLink to="/" className={navClass}>
          <span className="material-symbols-outlined">grid_view</span>
        </NavLink>
        
        <NavLink to="/timer" className={navClass}>
          <span className="material-symbols-outlined">timer</span>
        </NavLink>
        
        <NavLink to="/archive" className={navClass}>
          <span className="material-symbols-outlined">auto_stories</span>
        </NavLink>
        
        <NavLink to="/settings" className={navClass}>
          <span className="material-symbols-outlined">settings</span>
        </NavLink>

      </div>
    </nav>
  );
}