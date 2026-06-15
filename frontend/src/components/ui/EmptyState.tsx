import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      {icon && <div className="text-gray-400 mb-3">{icon}</div>}
      <p className="font-semibold text-gray-700 dark:text-slate-300">{title}</p>
      {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}