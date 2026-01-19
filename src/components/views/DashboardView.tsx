import React from 'react';
import { 
  Server, Box, HardDrive, Cpu, Activity, 
  ArrowUp, ArrowDown, Clock 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { VirtualMachine, LxcContainer, IsoImage, VMStatus } from '../../types';

interface DashboardViewProps {
  vms: VirtualMachine[];
  lxcContainers: LxcContainer[];
  images: IsoImage[];
  statsData: { time: string; cpu: number; ram: number }[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  vms = [], 
  lxcContainers = [], 
  images = [], 
  statsData = [] 
}) => {
  
  // Calculate Totals
  const totalInstances = vms.length + lxcContainers.length;
  const runningVms = vms.filter(v => v.status === VMStatus.RUNNING).length;
  const runningLxc = lxcContainers.filter(c => c.status === VMStatus.RUNNING).length;
  const activeInstances = runningVms + runningLxc;

  // Calculate Resource Allocation (Rough Estimate)
  const totalRamAllocated = 
    vms.reduce((acc, vm) => acc + vm.ramGB, 0) + 
    lxcContainers.reduce((acc, c) => acc + c.ramLimit, 0);

  const totalCpuAllocated = 
    vms.reduce((acc, vm) => acc + vm.cpuCores, 0) + 
    lxcContainers.reduce((acc, c) => acc + c.cpuLimit, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity size={120} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-cyan-200/70 max-w-2xl">
          Hypervisor is active. Managing {vms.length} Virtual Machines and {lxcContainers.length} Containers.
          Real-time telemetry is connected.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Instances */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-emerald-500 relative overflow-hidden group hover:bg-slate-800/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Active Instances</p>
              <h3 className="text-3xl font-bold text-white mt-1">{activeInstances} <span className="text-sm text-slate-500 font-normal">/ {totalInstances}</span></h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-cyan-300"><Server size={12}/> {runningVms} VMs</span>
            <span className="flex items-center gap-1 text-fuchsia-300"><Box size={12}/> {runningLxc} LXC</span>
          </div>
        </div>

        {/* CPU Allocation */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-blue-500 relative overflow-hidden group hover:bg-slate-800/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">vCPU Allocation</p>
              <h3 className="text-3xl font-bold text-white mt-1">{totalCpuAllocated} <span className="text-sm text-slate-500 font-normal">Cores</span></h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
              <Cpu size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* RAM Allocation */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-purple-500 relative overflow-hidden group hover:bg-slate-800/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">RAM Allocation</p>
              <h3 className="text-3xl font-bold text-white mt-1">{totalRamAllocated.toFixed(1)} <span className="text-sm text-slate-500 font-normal">GB</span></h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
              <HardDrive size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full" style={{ width: '30%' }}></div>
          </div>
        </div>

        {/* Uptime (Mock) */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-amber-500 relative overflow-hidden group hover:bg-slate-800/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Host Uptime</p>
              <h3 className="text-3xl font-bold text-white mt-1">3d 4h <span className="text-sm text-slate-500 font-normal">12m</span></h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500">Last reboot: Sunday 3:00 AM</p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        
        {/* Real-time Graph */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="text-cyan-400" /> Host Performance
            </h3>
            <div className="flex gap-4 text-xs font-mono">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> CPU</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> RAM</span>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCpu)" 
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="ram" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRam)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Activity Feed */}
        <div className="glass-panel p-6 rounded-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-emerald-400" /> Recent Activity
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {/* Mock Activity Items */}
            {[
                { label: 'System Sync', time: 'Just now', type: 'info' },
                { label: 'LXD Socket Connected', time: '1 min ago', type: 'success' },
                { label: 'Database Loaded', time: '1 min ago', type: 'success' }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/5">
                <div className={`mt-1 w-2 h-2 rounded-full ${item.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};