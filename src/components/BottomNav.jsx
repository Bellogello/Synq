import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Queue' },
    { path: '/timer', icon: 'timer', label: 'Focus' },
    // We flag the Archive to force a hard reload
    { path: '/archive', icon: 'auto_stories', label: 'Archive', forceRefresh: true },
    { path: '/settings', icon: 'settings', label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 pb-safe z-50 transition-colors duration-300">
      <div className="flex justify-around items-center h-20 px-2 pb-2">
        {navItems.map((item) => {
          const isActive = path === item.path;
          
          // We extract the inner content so we don't have to write it twice
          const NavContent = () => (
            <>
              <div 
                className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[24px]" 
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
              </div>
              <span 
                className={`text-[10px] font-bold tracking-wide transition-colors ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
            </>
          );

          // If the item has the forceRefresh flag, use a standard HTML anchor tag
          if (item.forceRefresh) {
            return (
              <a 
                key={item.path} 
                href={item.path}
                className="flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform"
              >
                <NavContent />
              </a>
            );
          }

          // Otherwise, use the standard React Router Link for instant navigation
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform"
            >
              <NavContent />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}