import React, { useState, useEffect, useMemo } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Play, 
  Square, 
  Settings, 
  Plus, 
  Trash2, 
  Usb, 
  Monitor, 
  Terminal, 
  Activity, 
  CircuitBoard,
  Info,
  X,
  CheckCircle,
  Disc,
  Zap,
  Box,
  DownloadCloud,
  FileUp,
  Globe,
  Loader2,
  Archive,
  Camera,
  History,
  RotateCcw,
  Save,
  Gauge
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { MOCK_VMS, MOCK_HOST_DEVICES, MOCK_LXC_CONTAINERS, MOCK_ISO_IMAGES } from './services/mockHypervisor';
import { VirtualMachine, HostDevice, VMStatus, LxcContainer, IsoImage, Snapshot } from './types';

// --- Helper Components ---

const Badge: React.FC<{ status: VMStatus }> = ({ status }) => {
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

const DeviceIcon: React.FC<{ type: HostDevice['type']; className?: string; size?: number }> = ({ type, className, size }) => {
  switch (type) {
    case 'PCI': return <CircuitBoard className={className} size={size} />;
    case 'USB': return <Usb className={className} size={size} />;
    case 'BLOCK': return <HardDrive className={className} size={size} />;
    default: return <Settings className={className} size={size} />;
  }
};

// --- Main App Component ---

const App: React.FC = () => {
  // --- State ---
  const [vms, setVms] = useState<VirtualMachine[]>(MOCK_VMS);
  const [lxcContainers, setLxcContainers] = useState<LxcContainer[]>(MOCK_LXC_CONTAINERS);
  const [images, setImages] = useState<IsoImage[]>(MOCK_ISO_IMAGES);
  const [devices, setDevices] = useState<HostDevice[]>(MOCK_HOST_DEVICES);
  
  const [selectedVmId, setSelectedVmId] = useState<string | null>(null);
  const [selectedLxcId, setSelectedLxcId] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Resource Editing State
  const [editingResources, setEditingResources] = useState(false);
  const [resourceForm, setResourceForm] = useState({ cpu: 0, ram: 0 });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'vms' | 'lxc' | 'images' | 'settings'>('dashboard');

  // Simulated live stats
  const [statsData, setStatsData] = useState<{ time: string; cpu: number; ram: number }[]>([]);

  // --- Effects ---
  
  // Reset resource form when selection changes
  useEffect(() => {
    setEditingResources(false);
    if (selectedVmId) {
      const vm = vms.find(v => v.id === selectedVmId);
      if (vm) setResourceForm({ cpu: vm.cpuCores, ram: vm.ramGB });
    } else if (selectedLxcId) {
      const lxc = lxcContainers.find(c => c.id === selectedLxcId);
      if (lxc) setResourceForm({ cpu: lxc.cpuLimit, ram: lxc.ramLimit });
    }
  }, [selectedVmId, selectedLxcId, vms, lxcContainers]);

  // Simulate realtime stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStatsData(prev => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newPoint = {
          time: timeStr,
          cpu: Math.floor(Math.random() * 30) + 10, // Simulated 10-40% usage
          ram: Math.floor(Math.random() * 20) + 40  // Simulated 40-60% usage
        };
        const newData = [...prev, newPoint];
        if (newData.length > 20) newData.shift();
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---

  const handleToggleVm = (id: string) => {
    setVms(prev => prev.map(vm => {
      if (vm.id === id) {
        return {
          ...vm,
          status: vm.status === VMStatus.RUNNING ? VMStatus.STOPPED : VMStatus.RUNNING
        };
      }
      return vm;
    }));
  };

  const handleToggleLxc = (id: string) => {
    setLxcContainers(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === VMStatus.RUNNING ? VMStatus.STOPPED : VMStatus.RUNNING
        };
      }
      return c;
    }));
  };

  const handleCreateVm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVm: VirtualMachine = {
      id: `vm-${Date.now()}`,
      name: formData.get('name') as string,
      os: formData.get('os') as any,
      status: VMStatus.STOPPED,
      cpuCores: Number(formData.get('cpu')),
      ramGB: Number(formData.get('ram')),
      diskSizeGB: Number(formData.get('storage')),
      attachedDevices: [],
      notes: 'Freshly provisioned VM.',
      snapshots: []
    };
    setVms([...vms, newVm]);
    setIsCreateModalOpen(false);
    setActiveTab('vms'); // Switch to VM list
    setSelectedVmId(newVm.id);
  };

  const handleDeleteVm = (id: string) => {
    if (confirm('Are you sure you want to delete this VM? Data will be lost.')) {
        // Release devices
        const vm = vms.find(v => v.id === id);
        if (vm) {
             setDevices(prev => prev.map(d => 
                vm.attachedDevices.includes(d.id) ? { ...d, inUseBy: null } : d
            ));
        }
        setVms(prev => prev.filter(v => v.id !== id));
        if (selectedVmId === id) setSelectedVmId(null);
    }
  };

  const handleDeleteLxc = (id: string) => {
    if (confirm('Are you sure you want to delete this Container? Data will be lost.')) {
        setLxcContainers(prev => prev.filter(c => c.id !== id));
        if (selectedLxcId === id) setSelectedLxcId(null);
    }
  };

  const handleDeleteImage = (id: string) => {
      if (confirm('Are you sure you want to remove this image from the library?')) {
          setImages(prev => prev.filter(i => i.id !== id));
      }
  }

  const handleUploadImage = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const type = formData.get('uploadType') === 'url' ? 'url' : 'file';
      const name = formData.get('name') as string;
      const file = formData.get('file') as File;
      
      const newImage: IsoImage = {
          id: `iso-${Date.now()}`,
          name: type === 'file' ? file.name : (name || 'Unknown-Image'),
          type: 'ISO', // Simplification for demo
          sizeGB: 0,
          status: 'Downloading',
          addedDate: new Date().toISOString().split('T')[0],
          sourceUrl: type === 'url' ? formData.get('url') as string : undefined
      };
      
      setImages(prev => [...prev, newImage]);
      setIsUploadModalOpen(false);

      // Simulate download process
      setTimeout(() => {
          setImages(prev => prev.map(img => 
             img.id === newImage.id ? { ...img, status: 'Ready', sizeGB: Math.floor(Math.random() * 4) + 1 } : img
          ));
      }, 3000);
  };

  const handleToggleDevice = (vmId: string, deviceId: string) => {
    const vm = vms.find(v => v.id === vmId);
    if (!vm) return;

    const isAttached = vm.attachedDevices.includes(deviceId);

    // Update VM attachment list
    setVms(prev => prev.map(v => {
      if (v.id === vmId) {
        return {
          ...v,
          attachedDevices: isAttached 
            ? v.attachedDevices.filter(d => d !== deviceId)
            : [...v.attachedDevices, deviceId]
        };
      }
      return v;
    }));

    // Update Device "inUseBy" status
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return { ...d, inUseBy: isAttached ? null : vmId };
      }
      return d;
    }));
  };

  const handleCreateSnapshot = (targetId: string, isLxc: boolean) => {
      const name = prompt("Enter snapshot name:");
      if (!name) return;
      
      const newSnap: Snapshot = {
          id: `snap-${Date.now()}`,
          name,
          created: new Date().toISOString().split('T')[0],
          sizeGB: 0.1
      };

      if (isLxc) {
          setLxcContainers(prev => prev.map(c => 
              c.id === targetId ? { ...c, snapshots: [...c.snapshots, newSnap] } : c
          ));
      } else {
          setVms(prev => prev.map(v => 
              v.id === targetId ? { ...v, snapshots: [...v.snapshots, newSnap] } : v
          ));
      }
  };

  const handleRestoreSnapshot = (id: string) => {
      if(confirm("Restore snapshot? Current state will be lost.")) {
          alert(`Restoring snapshot ${id}... (Simulation)`);
      }
  };
  
  const handleUpdateResources = (targetId: string, isLxc: boolean) => {
      if (isLxc) {
          setLxcContainers(prev => prev.map(c => 
             c.id === targetId ? { ...c, cpuLimit: resourceForm.cpu, ramLimit: resourceForm.ram } : c
          ));
      } else {
          setVms(prev => prev.map(v => 
             v.id === targetId ? { ...v, cpuCores: resourceForm.cpu, ramGB: resourceForm.ram } : v
          ));
      }
      setEditingResources(false);
  };

  // --- Derived State ---
  const selectedVm = useMemo(() => vms.find(v => v.id === selectedVmId), [vms, selectedVmId]);
  const selectedLxc = useMemo(() => lxcContainers.find(c => c.id === selectedLxcId), [lxcContainers, selectedLxcId]);

  // --- Render Sections ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Running VMs', value: vms.filter(v => v.status === VMStatus.RUNNING).length, icon: Server, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
          { label: 'Running Containers', value: lxcContainers.filter(v => v.status === VMStatus.RUNNING).length, icon: Box, color: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/20' },
          { label: 'Total Cores Used', value: vms.reduce((acc, v) => v.status === VMStatus.RUNNING ? acc + v.cpuCores : acc, 0) + lxcContainers.reduce((acc, c) => c.status === VMStatus.RUNNING ? acc + c.cpuLimit : acc, 0), icon: Cpu, color: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
          { label: 'Storage (Images)', value: `${images.reduce((acc, i) => acc + i.sizeGB, 0).toFixed(1)} GB`, icon: Disc, color: 'text-amber-400', glow: 'shadow-amber-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`glass-panel p-5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${stat.glow}`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium tracking-wide uppercase">{stat.label}</span>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className={`mt-3 text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
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
              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                {/* Changed to Pink/Magenta */}
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
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
            <Area type="monotone" dataKey="ram" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" name="RAM %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity (Replacing AI Assistant) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel rounded-xl p-5">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
             <Server size={20} className="text-blue-400"/> System Events
           </h3>
           <div className="space-y-4">
             <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-white/5 border border-white/5">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
               <span className="font-mono text-slate-400 text-xs">10:42:01</span>
               <span className="text-slate-200">vm-plex started successfully.</span>
             </div>
             <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-white/5 border border-white/5">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
               <span className="font-mono text-slate-400 text-xs">10:41:45</span>
               <span className="text-slate-200">USB 'Sonoff Zigbee' attached to vm-homeassistant.</span>
             </div>
             <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-white/5 border border-white/5">
               <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
               <span className="font-mono text-slate-400 text-xs">09:15:00</span>
               <span className="text-slate-200">vm-gaming stopped by user.</span>
             </div>
             <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-white/5 border border-white/5">
               <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]"></div>
               <span className="font-mono text-slate-400 text-xs">08:05:22</span>
               <span className="text-slate-200">Daily snapshot created for lxc-pihole.</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderVmList = () => (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* VM List Sidebar */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h2 className="font-semibold text-white tracking-wide">Virtual Machines</h2>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-all shadow-[0_0_10px_rgba(8,145,178,0.4)] hover:shadow-[0_0_15px_rgba(8,145,178,0.6)]"
            title="Create New VM"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {vms.map(vm => (
            <div 
              key={vm.id}
              onClick={() => setSelectedVmId(vm.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 group ${
                selectedVmId === vm.id 
                  ? 'bg-cyan-950/30 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'bg-slate-800/20 border-transparent hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`font-semibold text-lg ${selectedVmId === vm.id ? 'text-cyan-200' : 'text-slate-200'}`}>
                    {vm.name}
                </span>
                <Badge status={vm.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="flex items-center gap-1.5"><Monitor size={14} className="text-slate-500"/> {vm.os}</span>
                <span className="flex items-center gap-1.5"><Cpu size={14} className="text-slate-500"/> {vm.cpuCores} vCPU</span>
                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-slate-500"/> {vm.ramGB} GB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VM Detail View */}
      <div className="flex-1 glass-panel rounded-xl p-8 overflow-y-auto shadow-2xl relative custom-scrollbar">
        {selectedVm ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start border-b border-white/5 pb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {selectedVm.name}
                  {selectedVm.attachedDevices.some(d => d.includes('gpu')) && (
                    <span className="bg-purple-500/10 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)] flex items-center gap-1">
                        <Zap size={12} fill="currentColor" /> GPU Accelerated
                    </span>
                  )}
                </h1>
                <p className="text-slate-400 mt-2 flex items-center gap-3 text-sm">
                  <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-slate-500">ID: {selectedVm.id}</span>
                  <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-slate-500">{selectedVm.ipAddress || 'DHCP'}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggleVm(selectedVm.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg ${
                    selectedVm.status === VMStatus.RUNNING 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:shadow-red-500/20' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 hover:shadow-emerald-500/50'
                  }`}
                >
                  {selectedVm.status === VMStatus.RUNNING ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  {selectedVm.status === VMStatus.RUNNING ? 'Stop System' : 'Boot System'}
                </button>
                <button 
                  onClick={() => handleDeleteVm(selectedVm.id)}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete VM"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Resource Allocation */}
            <div className="bg-slate-800/20 rounded-xl p-5 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gauge size={20} className="text-cyan-400" /> Resource Limits
                    </h3>
                    <button 
                        onClick={() => editingResources ? handleUpdateResources(selectedVm.id, false) : setEditingResources(true)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                            editingResources 
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30' 
                            : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                        }`}
                    >
                        {editingResources ? <><Save size={14} className="inline mr-1"/> Save Changes</> : 'Edit Limits'}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">CPU Cores</label>
                        {editingResources ? (
                            <input 
                                type="number" 
                                className="w-full bg-black/40 border border-cyan-500/50 rounded px-2 py-1 text-white focus:outline-none"
                                value={resourceForm.cpu}
                                onChange={e => setResourceForm({...resourceForm, cpu: Number(e.target.value)})}
                                min={1} max={64}
                            />
                        ) : (
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {selectedVm.cpuCores} <span className="text-sm font-normal text-slate-500">vCPU</span>
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">RAM Allocation</label>
                        {editingResources ? (
                             <input 
                                type="number" 
                                className="w-full bg-black/40 border border-cyan-500/50 rounded px-2 py-1 text-white focus:outline-none"
                                value={resourceForm.ram}
                                onChange={e => setResourceForm({...resourceForm, ram: Number(e.target.value)})}
                                min={1} max={256}
                            />
                        ) : (
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {selectedVm.ramGB} <span className="text-sm font-normal text-slate-500">GB</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hardware Passthrough Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <CircuitBoard size={20} className="text-cyan-400" /> 
                Hardware Passthrough
              </h3>
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                {devices.map(device => {
                    const isAttached = selectedVm.attachedDevices.includes(device.id);
                    const isUnavailable = device.inUseBy && device.inUseBy !== selectedVm.id;
                    
                    return (
                        <div key={device.id} className={`
                            flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                            ${isAttached 
                                ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' 
                                : isUnavailable 
                                    ? 'bg-slate-900/20 border-slate-800 opacity-50 grayscale' 
                                    : 'bg-slate-800/30 border-white/5 hover:border-white/10 hover:bg-slate-800/50'
                            }
                        `}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${isAttached ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                                    <DeviceIcon type={device.type} size={20} />
                                </div>
                                <div>
                                    <h4 className={`font-medium text-base ${isAttached ? 'text-cyan-100' : 'text-slate-200'}`}>
                                        {device.name}
                                    </h4>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                        <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{device.address}</span>
                                        <span>{device.description}</span>
                                        {device.iommuGroup && <span className="text-slate-600">• IOMMU Grp {device.iommuGroup}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Toggle Button */}
                                <button
                                    disabled={isUnavailable || (selectedVm.status === VMStatus.RUNNING && !['USB'].includes(device.type))}
                                    onClick={() => handleToggleDevice(selectedVm.id, device.id)}
                                    className={`
                                        px-4 py-2 text-xs font-bold rounded-lg transition-all
                                        ${isAttached 
                                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30' 
                                            : isUnavailable
                                                ? 'bg-transparent text-slate-600 cursor-not-allowed'
                                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30'
                                        }
                                    `}
                                >
                                    {isAttached ? 'DETACH' : isUnavailable ? `LOCKED` : 'ATTACH'}
                                </button>
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>

            {/* Snapshots Section */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Camera size={20} className="text-fuchsia-400" /> Snapshots
                    </h3>
                    <button 
                        onClick={() => handleCreateSnapshot(selectedVm.id, false)}
                        className="text-xs bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-fuchsia-900/20"
                    >
                        <Plus size={14} /> New Snapshot
                    </button>
                 </div>
                 {selectedVm.snapshots.length > 0 ? (
                     <div className="space-y-2">
                         {selectedVm.snapshots.map(snap => (
                             <div key={snap.id} className="flex items-center justify-between p-3 bg-slate-800/30 border border-white/5 rounded-lg hover:bg-slate-800/50 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <History size={16} className="text-slate-500" />
                                     <div>
                                         <div className="text-sm font-medium text-slate-200">{snap.name}</div>
                                         <div className="text-xs text-slate-500">{snap.created} • {snap.sizeGB} GB</div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => handleRestoreSnapshot(snap.name)}
                                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors" title="Restore"
                                     >
                                         <RotateCcw size={16} />
                                     </button>
                                     <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600 text-sm">
                         No snapshots created for this VM.
                     </div>
                 )}
            </div>

            {/* Console Placeholder */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Terminal size={20} className="text-slate-400" /> VNC Console
              </h3>
              <div className="bg-black rounded-xl border border-slate-800 h-64 flex items-center justify-center font-mono text-slate-500 relative overflow-hidden group shadow-2xl">
                  {selectedVm.status === VMStatus.RUNNING ? (
                      <>
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                              <span className="text-emerald-500 font-bold tracking-wider text-sm">LIVE FEED ACTIVE</span>
                           </div>
                           <p className="text-xs text-slate-500">Hover to interact</p>
                        </div>
                        {/* Mock Console Text */}
                        <div className="absolute inset-0 p-6 text-xs leading-relaxed text-emerald-500/80 font-mono">
                            <span className="text-slate-500">[  0.000000]</span> Linux version 5.15.0-91-generic (buildd@lcy02-amd64-020)<br/>
                            <span className="text-slate-500">[  0.000000]</span> Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0-91-generic root=UUID=...<br/>
                            <span className="text-slate-500">[  0.123456]</span> x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'<br/>
                            <span className="text-slate-500">[  0.123567]</span> pci 0000:00:02.0: [8086:3e92] type 00 class 0x030000<br/>
                            <span className="text-slate-500">[  1.450231]</span> systemd[1]: Detected architecture x86-64.<br/>
                            <span className="text-slate-500">[  1.560112]</span> <span className="text-blue-400">Welcome to Ubuntu 22.04.3 LTS!</span><br/>
                            <br/>
                            ubuntu-server login: <span className="animate-pulse">_</span>
                        </div>
                      </>
                  ) : (
                      <div className="flex flex-col items-center gap-3 opacity-30">
                          <Square size={48} />
                          <span className="tracking-widest uppercase text-sm">System Halted</span>
                      </div>
                  )}
                  {/* CRT Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]"></div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>
                <Server size={64} className="relative text-slate-700" />
            </div>
            <div className="text-center">
                <p className="text-xl font-bold text-slate-300">No Virtual Machine Selected</p>
                <p className="text-sm text-slate-500 mt-2">Select a VM from the sidebar to manage resources.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderLxcList = () => (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* LXC List Sidebar */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h2 className="font-semibold text-white tracking-wide">LXC Containers</h2>
          <button 
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-lg transition-all shadow-[0_0_10px_rgba(192,38,211,0.4)] hover:shadow-[0_0_15px_rgba(192,38,211,0.6)]"
            title="Create New Container"
            onClick={() => alert("Container creation wizard not implemented in demo.")}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {lxcContainers.map(container => (
            <div 
              key={container.id}
              onClick={() => setSelectedLxcId(container.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 group ${
                selectedLxcId === container.id 
                  ? 'bg-fuchsia-950/30 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)]' 
                  : 'bg-slate-800/20 border-transparent hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`font-semibold text-lg ${selectedLxcId === container.id ? 'text-fuchsia-200' : 'text-slate-200'}`}>
                    {container.name}
                </span>
                <Badge status={container.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="flex items-center gap-1.5"><Box size={14} className="text-slate-500"/> {container.distro}</span>
                <span className="flex items-center gap-1.5"><Cpu size={14} className="text-slate-500"/> {container.cpuLimit} Core</span>
                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-slate-500"/> {container.ramLimit} GB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LXC Detail View */}
      <div className="flex-1 glass-panel rounded-xl p-8 overflow-y-auto shadow-2xl relative custom-scrollbar">
        {selectedLxc ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start border-b border-white/5 pb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Box className="text-fuchsia-500" /> {selectedLxc.name}
                </h1>
                <p className="text-slate-400 mt-2 flex items-center gap-3 text-sm">
                  <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-slate-500">ID: {selectedLxc.id}</span>
                  <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-slate-500">{selectedLxc.ipAddress}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggleLxc(selectedLxc.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg ${
                    selectedLxc.status === VMStatus.RUNNING 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:shadow-red-500/20' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 hover:shadow-emerald-500/50'
                  }`}
                >
                  {selectedLxc.status === VMStatus.RUNNING ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  {selectedLxc.status === VMStatus.RUNNING ? 'Stop' : 'Start'}
                </button>
                <button 
                  onClick={() => handleDeleteLxc(selectedLxc.id)}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Container"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Resources Editing LXC */}
            <div className="bg-slate-800/20 rounded-xl p-5 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gauge size={20} className="text-fuchsia-400" /> Resource Limits
                    </h3>
                    <button 
                        onClick={() => editingResources ? handleUpdateResources(selectedLxc.id, true) : setEditingResources(true)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                            editingResources 
                            ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 hover:bg-fuchsia-500/30' 
                            : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                        }`}
                    >
                        {editingResources ? <><Save size={14} className="inline mr-1"/> Save Changes</> : 'Edit Limits'}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">CPU Limit</label>
                         {editingResources ? (
                            <input 
                                type="number" 
                                className="w-full bg-black/40 border border-fuchsia-500/50 rounded px-2 py-1 text-white focus:outline-none"
                                value={resourceForm.cpu}
                                onChange={e => setResourceForm({...resourceForm, cpu: Number(e.target.value)})}
                                min={1} max={32}
                            />
                        ) : (
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {selectedLxc.cpuLimit} <span className="text-sm font-normal text-slate-500">Cores</span>
                            </div>
                        )}
                        <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-fuchsia-500 h-full w-[45%]"></div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">RAM Limit</label>
                        {editingResources ? (
                             <input 
                                type="number" 
                                className="w-full bg-black/40 border border-fuchsia-500/50 rounded px-2 py-1 text-white focus:outline-none"
                                value={resourceForm.ram}
                                onChange={e => setResourceForm({...resourceForm, ram: Number(e.target.value)})}
                                min={0.5} max={128} step={0.5}
                            />
                        ) : (
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {selectedLxc.ramLimit} <span className="text-sm font-normal text-slate-500">GB</span>
                            </div>
                        )}
                        <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full w-[60%]"></div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 opacity-70">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Disk Usage</label>
                        <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                            {selectedLxc.diskUsage} <span className="text-sm font-normal text-slate-500">GB</span>
                        </div>
                        <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[25%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Snapshots Section */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Camera size={20} className="text-fuchsia-400" /> Snapshots
                    </h3>
                    <button 
                         onClick={() => handleCreateSnapshot(selectedLxc.id, true)}
                         className="text-xs bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-fuchsia-900/20"
                    >
                        <Plus size={14} /> New Snapshot
                    </button>
                 </div>
                 {selectedLxc.snapshots.length > 0 ? (
                     <div className="space-y-2">
                         {selectedLxc.snapshots.map(snap => (
                             <div key={snap.id} className="flex items-center justify-between p-3 bg-slate-800/30 border border-white/5 rounded-lg hover:bg-slate-800/50 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <History size={16} className="text-slate-500" />
                                     <div>
                                         <div className="text-sm font-medium text-slate-200">{snap.name}</div>
                                         <div className="text-xs text-slate-500">{snap.created} • {snap.sizeGB} GB</div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => handleRestoreSnapshot(snap.name)}
                                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors" title="Restore"
                                     >
                                         <RotateCcw size={16} />
                                     </button>
                                     <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600 text-sm">
                         No snapshots created for this Container.
                     </div>
                 )}
            </div>

            {/* Console Placeholder */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Terminal size={20} className="text-slate-400" /> Root Shell
              </h3>
              <div className="bg-black rounded-xl border border-slate-800 h-80 flex items-center justify-center font-mono text-slate-500 relative overflow-hidden group shadow-2xl">
                  {selectedLxc.status === VMStatus.RUNNING ? (
                      <div className="absolute inset-0 p-6 text-sm leading-relaxed font-mono text-slate-300">
                           <div className="text-fuchsia-400 mb-1">Connected to {selectedLxc.id} (LXC/LXD)...</div>
                           <br />
                           <span className="text-green-400">root@{selectedLxc.name}:~#</span> apt update<br/>
                           Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]<br/>
                           Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]<br/>
                           Get:3 http://security.debian.org/debian-security bookworm-security InRelease [48.0 kB]<br/>
                           Fetched 254 kB in 1s (314 kB/s)<br/>
                           Reading package lists... Done<br/>
                           Building dependency tree... Done<br/>
                           Reading state information... Done<br/>
                           <br/>
                           <span className="text-green-400">root@{selectedLxc.name}:~#</span> <span className="animate-pulse">_</span>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-3 opacity-30">
                          <Box size={48} />
                          <span className="tracking-widest uppercase text-sm">Container Stopped</span>
                      </div>
                  )}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full"></div>
                <Box size={64} className="relative text-slate-700" />
            </div>
            <div className="text-center">
                <p className="text-xl font-bold text-slate-300">No Container Selected</p>
                <p className="text-sm text-slate-500 mt-2">Select an LXC container from the sidebar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderImagesList = () => (
      <div className="h-[calc(100vh-8rem)] glass-panel rounded-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-900/50">
              <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Disc className="text-amber-500" /> Image Library
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage ISO installation media and container templates.</p>
              </div>
              <div className="flex gap-3">
                  <button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2 font-medium text-sm"
                  >
                      <DownloadCloud size={18} /> Upload / Download
                  </button>
              </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {images.map(image => (
                  <div key={image.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center group">
                      <div className="col-span-4 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${image.type === 'ISO' ? 'bg-amber-500/20 text-amber-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                              {image.type === 'ISO' ? <Disc size={18} /> : <Archive size={18} />}
                          </div>
                          <div className="truncate">
                              <div className="font-medium text-slate-200 truncate" title={image.name}>{image.name}</div>
                              <div className="text-xs text-slate-500">Added: {image.addedDate}</div>
                          </div>
                      </div>
                      <div className="col-span-2">
                          <span className={`text-xs px-2 py-1 rounded border ${image.type === 'ISO' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10'}`}>
                              {image.type.replace('_', ' ')}
                          </span>
                      </div>
                      <div className="col-span-2 text-sm text-slate-300 font-mono">
                          {image.sizeGB > 0 ? `${image.sizeGB} GB` : '-'}
                      </div>
                      <div className="col-span-2">
                           {image.status === 'Downloading' ? (
                               <div className="flex items-center gap-2 text-blue-400 text-sm">
                                   <Loader2 size={14} className="animate-spin" /> Downloading...
                               </div>
                           ) : (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                   <CheckCircle size={14} /> Ready
                               </div>
                           )}
                      </div>
                      <div className="col-span-2 text-right">
                          <button 
                            onClick={() => handleDeleteImage(image.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Image"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              ))}
              {images.length === 0 && (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                      <Disc size={48} className="opacity-20 mb-4" />
                      <p>No images found in library.</p>
                  </div>
              )}
          </div>
      </div>
  );

  const CreateModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-white tracking-wide">Provision New System</h2>
          <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
        </div>
        <form onSubmit={handleCreateVm} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">VM Name</label>
            <input name="name" required className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="e.g., Ubuntu-Server-01" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Operating System</label>
              <div className="relative">
                <select name="os" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 appearance-none">
                    <option value="Ubuntu">Ubuntu Linux</option>
                    <option value="Windows">Windows 10/11</option>
                    <option value="Debian">Debian</option>
                    <option value="Arch">Arch Linux</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">▼</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">CPU Cores</label>
              <input name="cpu" type="number" min="1" max="32" defaultValue="2" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">RAM (GB)</label>
              <input name="ram" type="number" min="1" max="128" defaultValue="4" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Storage (GB)</label>
              <input name="storage" type="number" min="10" max="2000" defaultValue="32" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl text-sm text-blue-200/80 flex gap-3 items-center">
            <div className="bg-blue-500/20 p-2 rounded-lg"><Disc size={18} className="text-blue-400" /></div>
            <p>ISO installation media must be mounted manually after the initial container provisioning.</p>
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:text-white transition-colors font-medium">Cancel</button>
             <button type="submit" className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/30 transition-all">Create Instance</button>
          </div>
        </form>
      </div>
    </div>
  );

  const UploadModal = () => {
      const [uploadType, setUploadType] = useState<'file' | 'url'>('url');

      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900">
                    <h2 className="text-xl font-bold text-white tracking-wide">Add New Image</h2>
                    <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                </div>

                <div className="flex border-b border-white/5">
                    <button 
                        onClick={() => setUploadType('url')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${uploadType === 'url' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Download from URL
                    </button>
                    <button 
                        onClick={() => setUploadType('file')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${uploadType === 'file' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Upload File
                    </button>
                </div>

                <form onSubmit={handleUploadImage} className="p-8 space-y-6">
                    <input type="hidden" name="uploadType" value={uploadType} />
                    
                    {uploadType === 'url' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Source URL</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-slate-500"><Globe size={18} /></div>
                                    <input name="url" type="url" required className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600" placeholder="https://releases.ubuntu.com/..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Image Name</label>
                                <input name="name" required className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600" placeholder="ubuntu-22.04.iso" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                             <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group">
                                <FileUp size={48} className="mb-4 group-hover:text-amber-400 transition-colors" />
                                <p className="text-sm font-medium">Click to browse or drag file here</p>
                                <input name="file" type="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                             <div className="text-xs text-center text-slate-600">Supports .iso, .img, .qcow2, .tar.xz</div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:text-white transition-colors font-medium">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-lg shadow-amber-900/40 hover:shadow-amber-500/30 transition-all flex items-center gap-2">
                            {uploadType === 'url' ? <DownloadCloud size={18} /> : <FileUp size={18} />}
                            {uploadType === 'url' ? 'Start Download' : 'Upload Image'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      );
  }

  // --- Main Layout Render ---

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Navbar */}
      <nav className="glass-nav sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
                <Server size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-white leading-none">HyperDash</span>
                  <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase opacity-70">Virtualization Manager</span>
              </div>
            </div>
            <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
               {['dashboard', 'vms', 'lxc', 'images', 'settings'].map((tab) => (
                   <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        activeTab === tab 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                   >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                   </button>
               ))}
            </div>
            <div className="flex items-center gap-4 hidden sm:flex">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-400 tracking-wide">SYSTEM ONLINE</span>
                 </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'vms' && renderVmList()}
        {activeTab === 'lxc' && renderLxcList()}
        {activeTab === 'images' && renderImagesList()}
        {activeTab === 'settings' && (
            <div className="glass-panel p-12 rounded-xl text-center text-slate-500">
                <Settings size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-300">Settings Unavailable</h3>
                <p>This module is currently under development.</p>
            </div>
        )}
      </main>

      {/* Modals */}
      {isCreateModalOpen && <CreateModal />}
      {isUploadModalOpen && <UploadModal />}
      
    </div>
  );
};

export default App;