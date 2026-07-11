import clsx from 'clsx';
import Spinner from './Spinner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  striped?: boolean;
  hover?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  limit?: number;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  striped = true,
  hover = true,
  emptyMessage = 'Aucun résultat trouvé',
  emptyIcon,
  page,
  totalPages,
  onPageChange,
  total,
  limit,
}: TableProps<T>) {
  const getValue = (row: T, key: string): React.ReactNode => {
    return (row as Record<string, unknown>)[key] as React.ReactNode;
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-surface border-b border-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={clsx(
                    'px-4 py-3 font-semibold text-text-secondary whitespace-nowrap',
                    col.headerClassName
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-text-secondary">
                    <Spinner size="lg" />
                    <span className="text-sm">Chargement des données…</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-text-secondary">
                    {emptyIcon && <span className="text-4xl">{emptyIcon}</span>}
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={keyExtractor(row)}
                  className={clsx(
                    'border-b border-border last:border-0 transition-colors',
                    striped && idx % 2 === 1 && 'bg-surface/50',
                    hover && 'hover:bg-blue-50/40'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={clsx('px-4 py-3 text-text-primary', col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : getValue(row, String(col.key))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-text-secondary">
            {total !== undefined && limit !== undefined && page !== undefined
              ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} sur ${total} résultats`
              : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page! - 1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-secondary"
              aria-label="Page précédente"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={clsx(
                  'w-8 h-8 rounded text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 text-text-secondary'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page! + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-secondary"
              aria-label="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
