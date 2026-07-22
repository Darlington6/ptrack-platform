// Admin layout: fixed sidebar + overflow-constrained main column.
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from '../navigation/Sidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 ml-[24vw] min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 overflow-x-hidden px-8 py-6">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
