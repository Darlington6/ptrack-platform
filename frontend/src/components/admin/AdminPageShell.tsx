import { AdminAvatar } from '../AdminAvatar';
import { NetworkStatusDot } from '../status/NetworkStatusDot';
import { OfflineBanner } from '../status/OfflineBanner';

interface Props {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageShell({ title, actions, children }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
      <OfflineBanner />
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{title}</h1>
          <NetworkStatusDot size={8} />
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <AdminAvatar />
        </div>
      </header>
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  );
}
