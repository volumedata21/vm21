import React, { useState, useEffect } from 'react';
import { 
  Plus, Monitor, Cpu, HardDrive, Zap, Play, Square, 
  Trash2, Gauge, Save, CircuitBoard, Camera, History, 
  RotateCcw, Terminal, Server 
} from 'lucide-react';
import { VirtualMachine, HostDevice, VMStatus } from '../../types';
import { Badge } from '../common/Badge';
import { DeviceIcon } from '../common/DeviceIcon';

interface VmListProps {
  vms: VirtualMachine[];
  devices: HostDevice[];
  selectedVmId: string | null;
  onSelectVm: (id: string) => void;
  onToggleVm: (id: string) => void;
  onDeleteVm: (id: string) => void;
  onToggleDevice: (vmId: string, deviceId: string) => void;
  onUpdateResources: (id: string, cpu: number, ram: number) => void;
  onCreateSnapshot: (id: string) => void;
  onRestoreSnapshot: (snapId: string) => void;
  onOpenCreateModal: () => void;
}

export const VmListView: React.FC<VmListProps> = ({ 
  vms = [],
  devices = [],
  selectedVmId, 
  onSelectVm, 
  onToggleVm, 
  onDeleteVm, 
  onToggleDevice, 
  onUpdateResources, 
  onCreateSnapshot, 
  onRestoreSnapshot, 
  onOpenCreateModal 
}) => {
  // 1. Safe Arrays
  const safeVms = Array.isArray(vms) ? vms : [];
  const safeDevices = Array.isArray(devices) ? devices : [];
  
  const selectedVm = safeVms.find(v => v.id === selectedVmId);
  
  const [editingResources, setEditingResources] = useState(false);
  const [resourceForm, setResourceForm] = useState({ cpu: 0, ram: 0 });

  useEffect(() => {
    setEditingResources(false);
    if (selectedVm) {
      setResourceForm({ cpu: selectedVm.cpuCores, ram: selectedVm.ramGB });
    }
  }, [selectedVmId, selectedVm]);

  const handleSaveResources = () => {
    if (selectedVmId) {
        onUpdateResources(selectedVmId, resourceForm.cpu, resourceForm.ram);
        setEditingResources(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h2 className="font-semibold text-white tracking-wide">Virtual Machines</h2>
          <button 
            onClick={onOpenCreateModal}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-all shadow-[0_0_10px_rgba(8,145,178,0.4)] hover:shadow-[0_0_15px_rgba(8,145,178,0.6)]"
            title="Create New VM"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {safeVms.map(vm => (
            <div 
              key={vm.id}
              onClick={() => onSelectVm(vm.id)}
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
                {/* FIX: Convert Enum to String explicitly */}
                <Badge status={String(vm.status)} />
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

      {/* Detail View */}
      <div className="flex-1 glass-panel rounded-xl p-8 overflow-y-auto shadow-2xl relative custom-scrollbar">
        {selectedVm ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start border-b border-white/5 pb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {selectedVm.name}
                  {/* Safely check attachedDevices */}
                  {(selectedVm.attachedDevices || []).some(d => d.includes('gpu')) && (
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
                  onClick={() => onToggleVm(selectedVm.id)}
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
                  onClick={() => onDeleteVm(selectedVm.id)}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete VM"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-slate-800/20 rounded-xl p-5 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gauge size={20} className="text-cyan-400" /> Resource Limits
                    </h3>
                    <button 
                        onClick={() => editingResources ? handleSaveResources() : setEditingResources(true)}
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

            {/* Hardware Passthrough */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <CircuitBoard size={20} className="text-cyan-400" /> 
                Hardware Passthrough
              </h3>
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                {safeDevices.map(device => {
                    const isAttached = (selectedVm.attachedDevices || []).includes(device.id);
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
                                <button
                                    disabled={isUnavailable || (selectedVm.status === VMStatus.RUNNING && !['USB'].includes(device.type))}
                                    onClick={() => onToggleDevice(selectedVm.id, device.id)}
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

            {/* Snapshots */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Camera size={20} className="text-fuchsia-400" /> Snapshots
                    </h3>
                    <button 
                        onClick={() => onCreateSnapshot(selectedVm.id)}
                        className="text-xs bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-fuchsia-900/20"
                    >
                        <Plus size={14} /> New Snapshot
                    </button>
                 </div>
                 {(selectedVm.snapshots || []).length > 0 ? (
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
                                        onClick={() => onRestoreSnapshot(snap.name)}
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

            {/* Console */}
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
                        <div className="absolute inset-0 p-6 text-xs leading-relaxed text-emerald-500/80 font-mono">
                            <span className="text-slate-500">[  0.000000]</span> Linux version 5.15.0-91-generic<br/>
                            <span className="text-slate-500">[  0.123567]</span> pci 0000:00:02.0: [8086:3e92] type 00 class 0x030000<br/>
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
};