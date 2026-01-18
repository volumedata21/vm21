import React from 'react';
import { CircuitBoard, Usb, HardDrive, Settings } from 'lucide-react';
import { HostDevice } from '../../types';

export const DeviceIcon: React.FC<{ type: HostDevice['type']; className?: string; size?: number }> = ({ type, className, size }) => {
  switch (type) {
    case 'PCI': return <CircuitBoard className={className} size={size} />;
    case 'USB': return <Usb className={className} size={size} />;
    case 'BLOCK': return <HardDrive className={className} size={size} />;
    default: return <Settings className={className} size={size} />;
  }
};