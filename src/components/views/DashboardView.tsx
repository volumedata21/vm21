import React from 'react';
import { 
  Server, Cpu, Box, Disc, Activity, Zap 
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { VirtualMachine, LxcContainer, IsoImage, VMStatus } from '../../types';

interface DashboardProps {
  vms: VirtualMachine[];
  lxcContainers: LxcContainer[];
  images: IsoImage[];
  statsData: { time: string; cpu: number; ram: number }[];
}

export const DashboardView: React.FC<DashboardProps> = ({ vms, lxcContainers, images, statsData }) => {
  const runningVms = vms.filter(v => v.status === VMStatus.RUNNING).length;
  const runningLxc = lxcContainers.filter(c => c.status === VMStatus.RUNNING).length;
  
  const totalCores = 
    vms.reduce((acc, v) => v.status === VMStatus.RUNNING ? acc + v.cpuCores : acc, 0) + 
    lxcContainers.reduce((acc, c) => c.status === VMStatus.RUNNING ? acc + c.cpuLimit : acc, 0);

  const totalStorage = images.reduce((acc, i) => acc + i.sizeGB, 0).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Running VMs', value: runningVms, icon: Server, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
          { label: 'Running Containers', value: runningLxc, icon: Box, color: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/20' },
          { label: 'Total Cores Active', value: totalCores, icon: Cpu, color: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
          { label: 'Image Storage', value: `${totalStorage} GB`, icon: Disc, color: 'text-amber-400', glow: 'shadow-amber-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`glass-panel p-5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${stat.glow}`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium tracking-wide uppercase">{stat.label}</span>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="mt-3 text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-xl shadow-lg shadow-black/20 h-80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={120} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-400 fill-yellow-400" /> Host Resource Utilization
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={statsData}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              {/* Peach Gradient Definition */}
              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6', borderRadius: '8px', backdropFilter: 'blur(4px)' }} 
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Area type="monotone" dataKey="cpu" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
            {/* Peach Area Line */}
            <Area type="monotone" dataKey="ram" stroke="#fb923c" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" name="RAM %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};