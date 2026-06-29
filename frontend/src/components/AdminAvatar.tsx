import { useRef, useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from './ui/ConfirmModal';

/** Clickable admin initials avatar with a logout dropdown. */
export function AdminAvatar() {
  const { user, logout } = useAuth();
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
          <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
            {initials}
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800 truncate">{adminName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmLogout(true);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
