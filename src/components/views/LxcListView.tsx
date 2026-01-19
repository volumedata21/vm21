import React, { useState, useEffect } from 'react';
import {
  Box, Cpu, HardDrive, Play, Square, Trash2, Gauge, Save,
  Camera, History, RotateCcw, Terminal, Plus
} from 'lucide-react';
import { LxcContainer, VMStatus } from '../../types'; // Importing shared types
import { Badge } from '../common/Badge';

interface LxcListProps {
  containers: LxcContainer[];
  selectedLxcId: string | null;
  onSelectLxc: (id: string) => void;
  onToggleLxc: (id: string) => void;
  onDeleteLxc: (id: string) => void;
  onUpdateResources: (id: string, cpu: number, ram: number) => void;
  onCreateSnapshot: (id: string) => void;
  onRestoreSnapshot: (snapId: string) => void;
  onOpenCreateModal: () => void;
}

export const LxcListView: React.FC<LxcListProps> = ({
  containers = [], // Safety default
  selectedLxcId,
  onSelectLxc,
  onToggleLxc,
  onDeleteLxc,
  onUpdateResources,
  onCreateSnapshot,
  onRestoreSnapshot,
  onOpenCreateModal
}) => {
  // Safety check
  const safeContainers = Array.isArray(containers) ? containers : [];
  const selectedLxc = safeContainers.find(c => c.id === selectedLxcId);

  const [editingResources, setEditingResources] = useState(false);
  const [resourceForm, setResourceForm] = useState({ cpu: 0, ram: 0 });

  useEffect(() => {
    setEditingResources(false);
    if (selectedLxc) {
      setResourceForm({ cpu: selectedLxc.cpuLimit, ram: selectedLxc.ramLimit });
    }
  }, [selectedLxcId, selectedLxc]);

  const handleSaveResources = () => {
    if (selectedLxcId) {
      onUpdateResources(selectedLxcId, resourceForm.cpu, resourceForm.ram);
      setEditingResources(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h2 className="font-semibold text-white tracking-wide">LXC Containers</h2>
          <button
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-lg transition-all shadow-[0_0_10px_rgba(192,38,211,0.4)] hover:shadow-[0_0_15px_rgba(192,38,211,0.6)]"
            title="Create New Container"
            onClick={onOpenCreateModal}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {safeContainers.map(container => (
            <div
              key={container.id}
              onClick={() => onSelectLxc(container.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 group ${selectedLxcId === container.id
                ? 'bg-fuchsia-950/30 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)]'
                : 'bg-slate-800/20 border-transparent hover:bg-slate-800/50 hover:border-slate-700'
                }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`font-semibold text-lg ${selectedLxcId === container.id ? 'text-fuchsia-200' : 'text-slate-200'}`}>
                  {container.name}
                </span>
                {/* FIX: Convert Enum to String explicitly for safety */}
                <Badge status={String(container.status)} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="flex items-center gap-1.5"><Box size={14} className="text-slate-500" /> {container.distro}</span>
                <span className="flex items-center gap-1.5"><Cpu size={14} className="text-slate-500" /> {container.cpuLimit} Core</span>
                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-slate-500" /> {container.ramLimit} GB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail View */}
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
                  onClick={() => onToggleLxc(selectedLxc.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg ${selectedLxc.status === VMStatus.RUNNING
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:shadow-red-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 hover:shadow-emerald-500/50'
                    }`}
                >
                  {selectedLxc.status === VMStatus.RUNNING ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  {selectedLxc.status === VMStatus.RUNNING ? 'Stop' : 'Start'}
                </button>
                <button
                  onClick={onOpenCreateModal} // <--- Add this
                  className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-fuchsia-900/20 transition-all"
                >
                  <Plus size={18} />
                  Launch Container
                </button>
                <button
                  onClick={() => onDeleteLxc(selectedLxc.id)}
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
                  onClick={() => editingResources ? handleSaveResources() : setEditingResources(true)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${editingResources
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 hover:bg-fuchsia-500/30'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                    }`}
                >
                  {editingResources ? <><Save size={14} className="inline mr-1" /> Save Changes</> : 'Edit Limits'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">CPU Limit</label>
                  {editingResources ? (
                    <input
                      type="number"
                      className="w-full bg-black/40 border border-fuchsia-500/50 rounded px-2 py-1 text-white focus:outline-none"
                      value={resourceForm.cpu}
                      onChange={e => setResourceForm({ ...resourceForm, cpu: Number(e.target.value) })}
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
                      onChange={e => setResourceForm({ ...resourceForm, ram: Number(e.target.value) })}
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
                  onClick={() => onCreateSnapshot(selectedLxc.id)}
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
                    <span className="text-green-400">root@{selectedLxc.name}:~#</span> apt update<br />
                    Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]<br />
                    Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]<br />
                    Get:3 http://security.debian.org/debian-security bookworm-security InRelease [48.0 kB]<br />
                    Fetched 254 kB in 1s (314 kB/s)<br />
                    Reading package lists... Done<br />
                    Building dependency tree... Done<br />
                    Reading state information... Done<br />
                    <br />
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
};