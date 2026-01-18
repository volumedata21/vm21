import { VirtualMachine, LxcContainer, IsoImage } from '../types';

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
  }
};