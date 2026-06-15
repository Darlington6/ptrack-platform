import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from '../navigation/Navbar';
import { BottomNav } from '../navigation/BottomNav';
import { OfflineBanner } from '../status/OfflineBanner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function CitizenLayout() {
  useNetworkStatus();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <OfflineBanner />
      <Navbar />
      <main className="pb-24 lg:pb-6">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster richColors position="top-center" />
    </div>
  );
}
