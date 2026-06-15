import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  count: number;
  page: number;
  pageSize?: number;
  onPage: (p: number) => void;
}

export function Pagination({ count, page, pageSize = 20, onPage }: Props) {
  const total = Math.ceil(count / pageSize);
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="p-1 disabled:opacity-40"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {total}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= total}
        className="p-1 disabled:opacity-40"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}