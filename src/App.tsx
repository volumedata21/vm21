import React, { useState, useEffect } from 'react';

// --- Services & Types ---
import { api } from './services/api';
// Re-added MOCK_HOST_DEVICES here because we haven't built a backend for devices yet
import { MOCK_HOST_DEVICES } from './services/mockHypervisor'; 
import { VirtualMachine, HostDevice, VMStatus, LxcContainer, IsoImage, Snapshot } from './types';

// --- Component Imports ---
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { VmListView } from './components/views/VmListView';
import { LxcListView } from './components/views/LxcListView';
import { ImageLibraryView } from './components/views/ImageLibraryView';
import { SettingsView } from './components/views/SettingsView';

// --- Modal Imports ---
import { CreateVmModal } from './components/modals/CreateVmModal';
import { UploadImageModal } from './components/modals/UploadImageModal';

const App: React.FC = () => {
  // --- State Management ---

  // Data
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [lxcContainers, setLxcContainers] = useState<LxcContainer[]>([]);
  const [images, setImages] = useState<IsoImage[]>([]);
  const [devices, setDevices] = useState<HostDevice[]>(MOCK_HOST_DEVICES); // This now works

  // Selection
  const [selectedVmId, setSelectedVmId] = useState<string | null>(null);
  const [selectedLxcId, setSelectedLxcId] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vms' | 'lxc' | 'images' | 'settings'>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Simulated Live Stats
  const [statsData, setStatsData] = useState<{ time: string; cpu: number; ram: number }[]>([]);

  // --- Effects ---

  // --- Load Data from Backend ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vmsData, lxcData, imagesData] = await Promise.all([
          api.getVms(),
          api.getContainers(),
          api.getImages()
        ]);
        setVms(vmsData);
        setLxcContainers(lxcData);
        setImages(imagesData);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, []);

  // --- Realtime Host Stats ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        
        setStatsData(prev => {
          const now = new Date();
          const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
          const newPoint = {
            time: timeStr,
            cpu: data.cpu, // Real CPU %
            ram: data.ram  // Real RAM %
          };
          
          // Keep the last 20 data points for the graph
          const newData = [...prev, newPoint];
          if (newData.length > 20) newData.shift();
          return newData;
        });
      } catch (err) {
        // Fail silently so we don't spam alerts
        console.warn("Stats fetch failed"); 
      }
    };

    // Fetch immediately, then every 2 seconds
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---

  // VM Actions
  const handleToggleVm = async (id: string) => {
    try {
      const updatedVm = await api.toggleVm(id);
      setVms(prev => prev.map(vm => vm.id === id ? updatedVm : vm));
    } catch (error) {
      alert("Failed to toggle VM. Check console.");
    }
  };

  // NOTE: This currently simulates creation locally. 
  // To make it persistent, you would need to add api.createVm() 
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
    setActiveTab('vms');
    setSelectedVmId(newVm.id);
  };

  const handleDeleteVm = (id: string) => {
    if (confirm('Are you sure you want to delete this VM? Data will be lost.')) {
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

  const handleToggleDevice = (vmId: string, deviceId: string) => {
    const vm = vms.find(v => v.id === vmId);
    if (!vm) return;
    const isAttached = vm.attachedDevices.includes(deviceId);
    
    setVms(prev => prev.map(v =>
      v.id === vmId
        ? { ...v, attachedDevices: isAttached ? v.attachedDevices.filter(d => d !== deviceId) : [...v.attachedDevices, deviceId] }
        : v
    ));
    setDevices(prev => prev.map(d =>
      d.id === deviceId ? { ...d, inUseBy: isAttached ? null : vmId } : d
    ));
  };

  const handleUpdateVmResources = (id: string, cpu: number, ram: number) => {
    setVms(prev => prev.map(v => v.id === id ? { ...v, cpuCores: cpu, ramGB: ram } : v));
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
      setLxcContainers(prev => prev.map(c => c.id === targetId ? { ...c, snapshots: [...c.snapshots, newSnap] } : c));
    } else {
      setVms(prev => prev.map(v => v.id === targetId ? { ...v, snapshots: [...v.snapshots, newSnap] } : v));
    }
  };

  const handleRestoreSnapshot = (snapId: string) => {
    if (confirm(`Restore snapshot? Current state will be lost.`)) {
      alert(`Restoring snapshot... (Simulation)`);
    }
  };

  // LXC Actions
  
  // FIXED: Now uses the API instead of local state only
  const handleToggleLxc = async (id: string) => {
    try {
      const updatedLxc = await api.toggleLxc(id);
      setLxcContainers(prev => prev.map(c => c.id === id ? updatedLxc : c));
    } catch (error) {
      alert("Failed to toggle LXC. Check console.");
    }
  };

  const handleDeleteLxc = (id: string) => {
    if (confirm('Are you sure you want to delete this Container?')) {
      setLxcContainers(prev => prev.filter(c => c.id !== id));
      if (selectedLxcId === id) setSelectedLxcId(null);
    }
  };

  const handleUpdateLxcResources = (id: string, cpu: number, ram: number) => {
    setLxcContainers(prev => prev.map(c => c.id === id ? { ...c, cpuLimit: cpu, ramLimit: ram } : c));
  };

  // Image Actions
  const handleUploadImage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('uploadType') === 'url' ? 'url' : 'file';
    const name = formData.get('name') as string;
    const file = formData.get('file') as File;

    const newImage: IsoImage = {
        id: `iso-${Date.now()}`,
        name: type === 'file' ? file.name : (name || 'Unknown-Image'),
        type: 'ISO',
        sizeGB: 0,
        status: 'Downloading',
        addedDate: new Date().toISOString().split('T')[0],
        sourceUrl: type === 'url' ? formData.get('url') as string : undefined
    };
    
    setImages(prev => [...prev, newImage]);
    setIsUploadModalOpen(false);

    setTimeout(() => {
        setImages(prev => prev.map(img => 
           img.id === newImage.id ? { ...img, status: 'Ready', sizeGB: Math.floor(Math.random() * 4) + 1 } : img
        ));
    }, 3000);
  };

  const handleDeleteImage = async (id: string) => {
    if (confirm('Remove this image from library?')) {
      // Added API call for delete
      try {
        await api.deleteImage(id);
        setImages(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        alert("Failed to delete image.");
      }
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100">

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {activeTab === 'dashboard' && (
          <DashboardView
            vms={vms}
            lxcContainers={lxcContainers}
            images={images}
            statsData={statsData}
          />
        )}

        {activeTab === 'vms' && (
          <VmListView
            vms={vms}
            devices={devices}
            selectedVmId={selectedVmId}
            onSelectVm={setSelectedVmId}
            onToggleVm={handleToggleVm}
            onDeleteVm={handleDeleteVm}
            onToggleDevice={handleToggleDevice}
            onUpdateResources={handleUpdateVmResources}
            onCreateSnapshot={(id) => handleCreateSnapshot(id, false)}
            onRestoreSnapshot={handleRestoreSnapshot}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {activeTab === 'lxc' && (
          <LxcListView
            containers={lxcContainers}
            selectedLxcId={selectedLxcId}
            onSelectLxc={setSelectedLxcId}
            onToggleLxc={handleToggleLxc}
            onDeleteLxc={handleDeleteLxc}
            onUpdateResources={handleUpdateLxcResources}
            onCreateSnapshot={(id) => handleCreateSnapshot(id, true)}
            onRestoreSnapshot={handleRestoreSnapshot}
          />
        )}

        {activeTab === 'images' && (
          <ImageLibraryView
            images={images}
            onDeleteImage={handleDeleteImage}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateVmModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateVm}
        />
      )}

      {isUploadModalOpen && (
        // FIXED: Renamed from UploadModal to UploadImageModal
        <UploadImageModal
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadImage}
        />
      )}

    </div>
  );
};

export default App;