import React, { useState, useEffect } from 'react';

// --- Services & Types ---
import { api } from './services/api';
// NOTE: MOCK_HOST_DEVICES is removed because we use real data now
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
import { CreateContainerModal } from './components/modals/CreateContainerModal';
import { UploadImageModal } from './components/modals/UploadImageModal';


const App: React.FC = () => {
  // --- State Management ---
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [lxcContainers, setLxcContainers] = useState<LxcContainer[]>([]);
  const [images, setImages] = useState<IsoImage[]>([]);
  
  // 1. Start with empty array (Real Data)
  const [devices, setDevices] = useState<HostDevice[]>([]); 

  const [selectedVmId, setSelectedVmId] = useState<string | null>(null);
  const [selectedLxcId, setSelectedLxcId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'vms' | 'lxc' | 'images' | 'settings'>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateLxcModalOpen, setIsCreateLxcModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [statsData, setStatsData] = useState<{ time: string; cpu: number; ram: number }[]>([]);

  // --- Effects ---
  
  // 2. Safe Data Loading (Split Critical vs Non-Critical)
  useEffect(() => {
    const loadData = async () => {
      // A. Critical Data (VMs, Containers, Images)
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
        console.error("CRITICAL: Failed to load VMs/Containers:", err);
      }

      // B. Non-Critical Data (USB Devices)
      // If this fails (e.g. backend not ready), it won't break the dashboard
      try {
         const devicesData = await api.getDevices();
         setDevices(devicesData);
      } catch (err) {
         console.warn("Warning: Failed to load USB devices. Is the backend rebuilt?", err);
         setDevices([]); // Fallback to empty list
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStatsData(prev => {
          const now = new Date();
          const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
          const newPoint = {
            time: timeStr,
            cpu: data.cpu,
            ram: data.ram
          };
          const newData = [...prev, newPoint];
          if (newData.length > 20) newData.shift();
          return newData;
        });
      } catch (err) {
        console.warn("Stats fetch failed"); 
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---

  const handleToggleVm = async (id: string) => {
    try {
      const updatedVm = await api.toggleVm(id);
      setVms(prev => prev.map(vm => vm.id === id ? updatedVm : vm));
    } catch (error) {
      alert("Failed to toggle VM. Check console.");
    }
  };

  const handleCreateVm = async (data: any) => {
    try {
        const newItem = await api.createInstance(data);
        if (data.type === 'VM') {
            setVms(prev => [...prev, newItem]);
            setActiveTab('vms');
        } else {
            setLxcContainers(prev => [...prev, newItem]);
            setActiveTab('lxc');
        }
        setIsCreateModalOpen(false);
    } catch (err) {
        alert("Failed to create instance. See console.");
        console.error(err);
    }
  };

  const handleDeleteVm = async (id: string) => {
    if (confirm('Are you sure you want to delete this VM? Data will be lost.')) {
      try {
        await api.deleteInstance(id);
        
        // 3. Cleanup: Detach any devices used by this VM locally
        setDevices(prev => prev.map(d => 
            d.inUseBy === id ? { ...d, inUseBy: null } : d
        ));

        setVms(prev => prev.filter(v => v.id !== id));
        if (selectedVmId === id) setSelectedVmId(null);
      } catch (err) {
        alert("Failed to delete VM. Check console.");
        console.error(err);
      }
    }
  };

  const handleDeleteLxc = async (id: string) => {
    if (confirm('Are you sure you want to delete this Container?')) {
      try {
        await api.deleteInstance(id);
        setLxcContainers(prev => prev.filter(c => c.id !== id));
        if (selectedLxcId === id) setSelectedLxcId(null);
      } catch (err) {
        alert("Failed to delete Container. Check console.");
        console.error(err);
      }
    }
  };

  // 4. Real Hardware Attach/Detach Logic
  const handleToggleDevice = async (vmId: string, deviceId: string) => {
    const vm = vms.find(v => v.id === vmId);
    const device = devices.find(d => d.id === deviceId);
    
    if (!vm || !device) return;

    // Check if we are attaching or detaching
    const isAttached = vm.attachedDevices?.includes(deviceId) || device.inUseBy === vm.name;

    try {
        if (isAttached) {
            // Detach Logic
            await api.detachDevice(vmId, deviceId);
            
            // Update UI Locally
            setVms(prev => prev.map(v => 
                v.id === vmId 
                ? { ...v, attachedDevices: v.attachedDevices.filter(d => d !== deviceId) }
                : v
            ));
            setDevices(prev => prev.map(d => 
                d.id === deviceId ? { ...d, inUseBy: null } : d
            ));

        } else {
            // Attach Logic
            if (device.inUseBy) {
                alert(`This device is already in use by ${device.inUseBy}`);
                return;
            }

            await api.attachDevice(vmId, device);

            // Update UI Locally
            setVms(prev => prev.map(v => 
                v.id === vmId 
                ? { ...v, attachedDevices: [...(v.attachedDevices || []), deviceId] }
                : v
            ));
            setDevices(prev => prev.map(d => 
                d.id === deviceId ? { ...d, inUseBy: vm.name } : d
            ));
        }
    } catch (err) {
        console.error(err);
        alert("Failed to toggle device attachment. Check console.");
    }
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

  const handleToggleLxc = async (id: string) => {
    try {
      const updatedLxc = await api.toggleLxc(id);
      setLxcContainers(prev => prev.map(c => c.id === id ? updatedLxc : c));
    } catch (error) {
      alert("Failed to toggle LXC. Check console.");
    }
  };

  const handleUpdateLxcResources = (id: string, cpu: number, ram: number) => {
    setLxcContainers(prev => prev.map(c => c.id === id ? { ...c, cpuLimit: cpu, ramLimit: ram } : c));
  };

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
            onOpenCreateModal={() => setIsCreateLxcModalOpen(true)}
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

      {/* VM Modal */}
      {isCreateModalOpen && (
        <CreateVmModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateVm}
        />
      )}

      {/* NEW: Container Modal */}
      {isCreateLxcModalOpen && (
        <CreateContainerModal
          onClose={() => setIsCreateLxcModalOpen(false)}
          onSubmit={(data) => {
              handleCreateVm(data); 
              setIsCreateLxcModalOpen(false);
          }}
        />
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadImageModal
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadImage}
        />
      )}
    </div>
  );
};

export default App;