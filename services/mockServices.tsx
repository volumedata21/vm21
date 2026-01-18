import { HostDevice, VirtualMachine, VMStatus, LxcContainer, IsoImage } from '../types';

// Mock Host Hardware
export const MOCK_HOST_DEVICES: HostDevice[] = [
  {
    id: 'pci-gpu-intel',
    name: 'Intel UHD Graphics 630 (Desktop)',
    type: 'PCI',
    address: '0000:00:02.0',
    description: 'Integrated Graphics Controller (QSV Capable)',
    iommuGroup: 1,
    inUseBy: null
  },
  {
    id: 'pci-gpu-nvidia',
    name: 'NVIDIA GeForce RTX 3060',
    type: 'PCI',
    address: '0000:01:00.0',
    description: 'Discrete Graphics Card',
    iommuGroup: 2,
    inUseBy: null
  },
  {
    id: 'usb-controller-1',
    name: 'Intel Cannon Lake USB 3.1',
    type: 'USB',
    address: '0000:00:14.0',
    description: 'USB Host Controller',
    iommuGroup: 3,
    inUseBy: null
  },
  {
    id: 'block-nvme',
    name: 'Samsung SSD 970 EVO 1TB',
    type: 'BLOCK',
    address: '/dev/nvme0n1',
    description: 'Primary Host Drive (Do not pass through!)',
    iommuGroup: undefined,
    inUseBy: 'HOST'
  },
  {
    id: 'block-sata-1',
    name: 'WD Red 4TB (SATA)',
    type: 'BLOCK',
    address: '/dev/sda',
    description: 'Data Drive 1',
    iommuGroup: undefined,
    inUseBy: null
  },
  {
    id: 'usb-dongle-zigbee',
    name: 'Sonoff Zigbee 3.0 USB Dongle',
    type: 'USB',
    address: 'Bus 001 Device 004',
    description: 'Home Automation Radio',
    iommuGroup: undefined,
    inUseBy: 'vm-homeassistant'
  },
  {
    id: 'drive-dvd',
    name: 'ASUS DVD-RAM GH24NSC0',
    type: 'BLOCK',
    address: '/dev/sr0',
    description: 'Optical Drive',
    iommuGroup: undefined,
    inUseBy: null
  }
];

// Mock VMs
export const MOCK_VMS: VirtualMachine[] = [
  {
    id: 'vm-plex',
    name: 'Plex Media Server',
    os: 'Ubuntu',
    status: VMStatus.RUNNING,
    cpuCores: 4,
    ramGB: 8,
    diskSizeGB: 64,
    attachedDevices: ['pci-gpu-intel'], // iGPU passed through
    notes: 'Using Intel QSV for transcoding.',
    ipAddress: '192.168.1.50',
    snapshots: [
      { id: 'snap-1', name: 'Clean Install', created: '2023-10-01', sizeGB: 2.5 },
      { id: 'snap-2', name: 'Pre-Update', created: '2023-11-15', sizeGB: 4.1 }
    ]
  },
  {
    id: 'vm-gaming',
    name: 'Win10 Gaming',
    os: 'Windows',
    status: VMStatus.STOPPED,
    cpuCores: 8,
    ramGB: 16,
    diskSizeGB: 512,
    attachedDevices: ['pci-gpu-nvidia'],
    notes: 'Gaming VM with RTX passthrough.',
    ipAddress: '192.168.1.51',
    snapshots: []
  },
  {
    id: 'vm-homeassistant',
    name: 'Home Assistant OS',
    os: 'Other',
    status: VMStatus.RUNNING,
    cpuCores: 2,
    ramGB: 4,
    diskSizeGB: 32,
    attachedDevices: ['usb-dongle-zigbee'],
    notes: 'Smart home controller.',
    ipAddress: '192.168.1.52',
    snapshots: [
      { id: 'snap-ha-1', name: 'Before Zigbee Config', created: '2024-01-20', sizeGB: 1.2 }
    ]
  }
];

// Mock LXC Containers
export const MOCK_LXC_CONTAINERS: LxcContainer[] = [
  {
    id: 'lxc-pihole',
    name: 'pihole-dns',
    distro: 'Debian',
    status: VMStatus.RUNNING,
    ipAddress: '192.168.1.10',
    cpuLimit: 1,
    ramLimit: 0.5,
    diskUsage: 2,
    snapshots: []
  },
  {
    id: 'lxc-nginx',
    name: 'nginx-proxy',
    distro: 'Alpine',
    status: VMStatus.RUNNING,
    ipAddress: '192.168.1.11',
    cpuLimit: 2,
    ramLimit: 1,
    diskUsage: 1,
    snapshots: [
        { id: 'snap-nginx-1', name: 'Initial Config', created: '2024-02-01', sizeGB: 0.2 }
    ]
  },
  {
    id: 'lxc-dev',
    name: 'dev-environment',
    distro: 'Ubuntu',
    status: VMStatus.STOPPED,
    ipAddress: '-',
    cpuLimit: 4,
    ramLimit: 4,
    diskUsage: 15,
    snapshots: []
  }
];

// Mock ISO Images
export const MOCK_ISO_IMAGES: IsoImage[] = [
    {
        id: 'iso-ubuntu-22',
        name: 'ubuntu-22.04.3-live-server-amd64.iso',
        type: 'ISO',
        sizeGB: 1.8,
        status: 'Ready',
        addedDate: '2023-11-15'
    },
    {
        id: 'iso-win10',
        name: 'Win10_22H2_English_x64.iso',
        type: 'ISO',
        sizeGB: 5.8,
        status: 'Ready',
        addedDate: '2023-12-01'
    },
    {
        id: 'tmpl-alpine',
        name: 'alpine-3.18-default_20230601_amd64.tar.xz',
        type: 'LXC_TEMPLATE',
        sizeGB: 0.005,
        status: 'Ready',
        addedDate: '2024-01-10'
    },
    {
        id: 'iso-proxmox',
        name: 'proxmox-ve_8.1-1.iso',
        type: 'ISO',
        sizeGB: 1.2,
        status: 'Ready',
        addedDate: '2024-02-05'
    }
];

// Helper to get available devices excluding those used by OTHER VMs (or Host)
export const getAvailableDevices = (allDevices: HostDevice[], currentVmId?: string) => {
  return allDevices.filter(d => d.inUseBy === null || d.inUseBy === currentVmId);
};