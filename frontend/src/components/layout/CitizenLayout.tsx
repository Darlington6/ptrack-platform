import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar';
import { BottomNav } from '../navigation/BottomNav';
import { CitizenSidebar } from '../navigation/CitizenSidebar';
import { InstallBanner } from '../InstallBanner';
import { NudgeBanner } from '../feedback/NudgeBanner';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useAuth } from '../../context/AuthContext';

export default function CitizenLayout() {
  const { user } = useAuth();
  const { isInstallable } = useInstallPrompt();

  const isEmailUser = user?.email && !user.email.startsWith('phone_');
  const needsVerification = !!isEmailUser && !user!.email_verified;

  if (needsVerification) {
    return <Navigate to="/verify" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <CitizenSidebar />
      <div className="lg:ml-[24vw] flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pb-24 lg:pb-6">
          <InstallBanner />
          {!isInstallable && <NudgeBanner />}
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
