import { NavLink } from 'react-router-dom';
import { Home, Map, Plus, Gift, User } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useEffect } from 'react';

const LEFT_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
] as const;

const RIGHT_ITEMS = [
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const;

export function BottomNav() {
  const resolved = useThemeStore((s) => s.resolved);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) {
      meta.content = resolved === 'dark' ? '#0f172a' : '#ffffff';
    }
  }, [resolved]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-30 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end h-16">
        {LEFT_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center pb-1 gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="flex-1 flex items-center justify-center">
          <NavLink
            to="/report"
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg -mt-6 transition-colors"
            aria-label="Report waste"
          >
            <Plus size={26} />
          </NavLink>
        </div>

        {RIGHT_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center pb-1 gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
