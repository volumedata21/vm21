import React, { useState } from 'react';
import { X, Server, Cpu, HardDrive, Zap } from 'lucide-react';

interface CreateVmModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

// VM-Specific Image List
const AVAILABLE_IMAGES = [
    { label: 'Ubuntu LTS: Latest', value: 'ubuntu/lts' },
    { label: 'Ubuntu 24.04 LTS',   value: 'ubuntu/24.04' },
    { label: 'Ubuntu 22.04 LTS',   value: 'ubuntu/22.04' },
    { label: 'Debian 12 (Bookworm)', value: 'images/debian/12' },
    // Alpine VMs are tricky, but valid. Keeping it for now.
    { label: 'Alpine Linux 3.19',  value: 'images/alpine/3.19' },
];

export const CreateVmModal: React.FC<CreateVmModalProps> = ({ onClose, onSubmit }) => {
  const [selectedImage, setSelectedImage] = useState(AVAILABLE_IMAGES[0].value);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
        name: formData.get('name'),
        type: 'VM', // <--- Hardcoded to VM
        image: selectedImage,
        cpu: formData.get('cpu'),
        ram: formData.get('ram'),
        storage: formData.get('storage')
    };

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Server className="text-cyan-400" />
                    Provision New Virtual Machine
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                
                <form id="create-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Instance Name</label>
                        <input 
                            name="name" 
                            required 
                            autoFocus 
                            pattern="[a-zA-Z0-9-]+"
                            title="Only letters, numbers, and dashes allowed."
                            onInput={(e) => {
                                e.currentTarget.value = e.currentTarget.value.replace(/\s+/g, '-').toLowerCase();
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors" 
                            placeholder="e.g., web-server-01" 
                        />
                    </div>

                    {/* Image Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Operating System</label>
                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_IMAGES.map((img) => (
                                <button
                                    key={img.value}
                                    type="button"
                                    onClick={() => setSelectedImage(img.value)}
                                    className={`px-4 py-3 rounded-lg text-sm text-left border transition-all ${selectedImage === img.value ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                >
                                    <span className="block font-semibold">{img.label}</span>
                                    <span className="text-xs opacity-50 font-mono">{img.value}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-2"><Cpu size={14}/> CPU Cores</label>
                            <input name="cpu" type="number" min="1" max="16" defaultValue="2" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-2"><Zap size={14}/> RAM (GB)</label>
                            <input name="ram" type="number" min="0.5" max="64" step="0.5" defaultValue="4" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-2"><HardDrive size={14}/> Disk (GB)</label>
                            <input name="storage" type="number" min="5" max="1000" defaultValue="32" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-slate-900/50">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                <button form="create-form" type="submit" className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
                    <Zap size={18} className="fill-white" /> Create VM
                </button>
            </div>
        </div>
    </div>
  );
};