import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Queue' },
    { path: '/timer', icon: 'timer', label: 'Focus' },
    { path: '/archive', icon: 'auto_stories', label: 'Archive', forceRefresh: true },
    { path: '/groups', icon: 'groups', label: 'Squad' },
    { path: '/settings', icon: 'settings', label: 'Settings' }
  ];

  return (
    // Universally floating dock for BOTH mobile and laptops!
    <nav className="fixed bottom-6 inset-x-0 mx-auto w-[92%] max-w-[24rem] md:w-max md:max-w-none bg-surface/90 backdrop-blur-xl border border-outline-variant/20 rounded-[2rem] md:rounded-full z-50 transition-all duration-300 shadow-2xl">
      <div className="flex justify-around items-center h-[4.5rem] px-2 md:px-6 md:gap-4">
        {navItems.map((item) => {
          const isActive = path === item.path;
          
          const NavContent = () => (
            <>
              <div 
                className={`flex items-center justify-center w-[3rem] h-[2rem] md:w-[3.5rem] md:h-[2.5rem] rounded-full transition-all duration-300 ${
                  isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[1.5rem]" 
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
              </div>
              <span 
                className={`text-[0.625rem] md:text-[0.7rem] font-bold tracking-wide transition-colors ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
            </>
          );

          if (item.forceRefresh) {
            return (
              <a key={item.path} href={item.path} className="flex flex-col items-center justify-center w-[4rem] md:w-[4.5rem] h-full gap-1 active:scale-95 transition-transform">
                <NavContent />
              </a>
            );
          }

          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center w-[4rem] md:w-[4.5rem] h-full gap-1 active:scale-95 transition-transform">
              <NavContent />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}