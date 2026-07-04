import { useRef, useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from './ui/ConfirmModal';
import { useNetworkStore } from '../stores/networkStore';

const DOT_COLORS = { online: 'bg-green-500', offline: 'bg-gray-400', poor: 'bg-yellow-400' };

/** Clickable admin initials avatar with a logout dropdown. */
export function AdminAvatar() {
  const { user, logout } = useAuth();
  const networkStatus = useNetworkStore((s) => s.status);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const adminName = user?.full_name || user?.username || 'Admin';
  const initials = adminName.slice(0, 2).toUpperCase();

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Admin menu"
        >
          <span className="text-sm text-gray-600 hidden sm:block">{adminName}</span>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {initials}
            </div>
            <span
              className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full border-2 border-white ${DOT_COLORS[networkStatus]}`}
            />
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{adminName}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <User size={15} />
              Profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmLogout(true);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Log out?"
        message="You will be returned to the login page."
        confirmLabel="Log out"
        intent="warning"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
