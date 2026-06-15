import { Outlet } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar';
import { BottomNav } from '../navigation/BottomNav';

export default function CitizenLayout() {
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
