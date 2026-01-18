import React from 'react';
import { VMStatus } from '../../types';

export const Badge: React.FC<{ status: VMStatus }> = ({ status }) => {
  const styles = {
    [VMStatus.RUNNING]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    [VMStatus.STOPPED]: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    [VMStatus.PAUSED]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [VMStatus.PROVISIONING]: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border tracking-wide uppercase ${styles[status]}`}>
      {status}
    </span>
  );
};