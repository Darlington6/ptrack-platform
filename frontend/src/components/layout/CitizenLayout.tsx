import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar';
import { BottomNav } from '../navigation/BottomNav';
import { useAuth } from '../../context/AuthContext';

export default function CitizenLayout() {
  const { user } = useAuth();

  const isEmailUser = user?.email && !user.email.startsWith('phone_');
  const needsVerification = !!isEmailUser && !user!.email_verified;

  if (needsVerification) {
    return <Navigate to="/verify" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
