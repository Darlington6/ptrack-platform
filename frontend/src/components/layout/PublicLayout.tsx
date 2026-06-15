import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

export default function PublicLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  );
}