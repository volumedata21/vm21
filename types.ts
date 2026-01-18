export enum VMStatus {
  RUNNING = 'Running',
  STOPPED = 'Stopped',
  PAUSED = 'Paused',
  PROVISIONING = 'Provisioning'
}

export interface HostDevice {
  id: string;
  name: string;
  type: 'PCI' | 'USB' | 'BLOCK' | 'NETWORK';
  address: string; // e.g., 0000:00:02.0 or /dev/sda
  description: string;
  iommuGroup?: number;
  icon?: string;
  inUseBy?: string | null; // VM ID or null
}

export interface Snapshot {
  id: string;
  name: string;
  created: string;
  sizeGB: number;
  description?: string;
}

export interface VirtualMachine {
  id: string;
  name: string;
  os: 'Ubuntu' | 'Windows' | 'Debian' | 'Arch' | 'Other';
  status: VMStatus;
  cpuCores: number;
  ramGB: number;
  diskSizeGB: number;
  attachedDevices: string[]; // Array of HostDevice IDs
  notes: string;
  ipAddress?: string;
  snapshots: Snapshot[];
}

export interface LxcContainer {
  id: string;
  name: string;
  distro: 'Ubuntu' | 'Alpine' | 'Debian' | 'Arch';
  status: VMStatus;
  ipAddress: string;
  cpuLimit: number; // cores
  ramLimit: number; // GB
  diskUsage: number; // GB
  snapshots: Snapshot[];
}

export interface IsoImage {
  id: string;
  name: string;
  type: 'ISO' | 'LXC_TEMPLATE';
  sizeGB: number;
  status: 'Ready' | 'Downloading' | 'Processing';
  addedDate: string;
  sourceUrl?: string;
}

export interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  hostUptime: string;
}