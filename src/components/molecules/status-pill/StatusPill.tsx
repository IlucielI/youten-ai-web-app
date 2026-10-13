import React from 'react';
import { StatusDot } from '@/components/atoms/status-dot';

export interface StatusPillProps {
  label?: string;
  status?: 'online' | 'busy' | 'offline' | 'warning';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label = 'System Online',
  status = 'online',
  className = '',
}) => {
  const statusStyles = {
    online: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300',
    busy: 'bg-amber-50/80 border-amber-200/80 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300',
    offline: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300',
    warning: 'bg-rose-50/80 border-rose-200/80 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300',
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${statusStyles} ${className}`}
    >
      <StatusDot status={status} />
      <span>{label}</span>
    </div>
  );
};
