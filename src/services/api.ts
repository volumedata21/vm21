import { VirtualMachine, LxcContainer, IsoImage, HostDevice } from '../types';

const API_BASE = '/api';

export const api = {
  // --- VMs ---
  getVms: async (): Promise<VirtualMachine[]> => {
    const res = await fetch(`${API_BASE}/vms`);
    if (!res.ok) throw new Error('Failed to fetch VMs');
    return res.json();
  },
  
  toggleVm: async (id: string): Promise<VirtualMachine> => {
    const res = await fetch(`${API_BASE}/vms/${id}/toggle`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle VM');
    return res.json();
  },

  // --- LXC ---
  getContainers: async (): Promise<LxcContainer[]> => {
    const res = await fetch(`${API_BASE}/lxc`);
    if (!res.ok) throw new Error('Failed to fetch Containers');
    return res.json();
  },

  toggleLxc: async (id: string): Promise<LxcContainer> => {
    const res = await fetch(`${API_BASE}/lxc/${id}/toggle`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle Container');
    return res.json();
  },

  // --- Images ---
  getImages: async (): Promise<IsoImage[]> => {
    const res = await fetch(`${API_BASE}/images`);
    if (!res.ok) throw new Error('Failed to fetch Images');
    return res.json();
  },

  deleteImage: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/images/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete Image');
  },

  // --- System Stats ---
  getStats: async (): Promise<{ cpu: number; ram: number }> => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // --- Instances (Create/Delete) ---
  createInstance: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create instance');
    return res.json();
<<<<<<< Updated upstream
=======
  },

  deleteInstance: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/instances/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete instance');
  },

  // --- NEW: Real Hardware Devices ---
  getDevices: async (): Promise<HostDevice[]> => {
    const res = await fetch(`${API_BASE}/devices`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  attachDevice: async (vmId: string, device: HostDevice): Promise<void> => {
    const res = await fetch(`${API_BASE}/devices/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId, device })
    });
    if (!res.ok) throw new Error('Failed to attach device');
  },

  detachDevice: async (vmId: string, deviceId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/devices/detach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId, deviceId })
    });
    if (!res.ok) throw new Error('Failed to detach device');
>>>>>>> Stashed changes
  }
};