'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface AdminColumn<T> {
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
  /** Applied to both the th and the td */
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface AdminTableProps<T> {
  columns: AdminColumn<T>[];
  data: T[];
  getKey?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, index: number) => string | undefined;
  /** When truthy for an item, renders a full-width row beneath it with this content */
  renderExpanded?: (item: T) => React.ReactNode;
  isExpanded?: (item: T) => boolean;
  empty?: React.ReactNode;
  minWidth?: string;
}

/**
 * Tableau admin partagé : lignes à couleurs alternées, survol,
 * colonnes configurables et éventuellement une ligne dépliée sous une rangée.
 */
export default function AdminTable<T>({
  columns,
  data,
  getKey,
  onRowClick,
  rowClassName,
  renderExpanded,
  isExpanded,
  empty,
  minWidth = '720px',
}: AdminTableProps<T>) {
  if (data.length === 0) return empty ? <>{empty}</> : null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80">
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const key = getKey ? getKey(item, idx) : idx;
            return (
              <React.Fragment key={key}>
                <tr
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={cn(
                    'border-t border-slate-100 dark:border-slate-700/60 transition-colors',
                    idx % 2 === 0
                      ? 'bg-white dark:bg-transparent'
                      : 'bg-slate-50/80 dark:bg-slate-700/25',
                    onRowClick && 'cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-900/10',
                    rowClassName?.(item, idx),
                  )}
                >
                  {columns.map((c, i) => (
                    <td
                      key={i}
                      className={cn(
                        'px-4 py-3 align-middle',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        c.className,
                      )}
                    >
                      {c.cell(item, idx)}
                    </td>
                  ))}
                </tr>
                {renderExpanded && isExpanded?.(item) && (
                  <tr className={cn('border-t border-slate-100 dark:border-slate-700/60', idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/80 dark:bg-slate-700/25')}>
                    <td colSpan={columns.length} className="px-4 py-4">
                      {renderExpanded(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}