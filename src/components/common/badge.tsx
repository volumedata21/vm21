import React from 'react';

// Accepting string instead of strict Enum to prevent crashes during debug
export const Badge: React.FC<{ status: string }> = ({ status }) => {
  
  // Default to gray if status doesn't match
  let colorClass = 'bg-slate-700/30 text-slate-400 border-slate-600/30';

  if (status === 'Running') {
      colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
  } else if (status === 'Paused') {
      colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (status === 'Provisioning') {
      colorClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border tracking-wide uppercase ${colorClass}`}>
      {status || 'Unknown'}
    </span>
  );
};