import React from 'react';
import { LayoutDashboard, Server, Box, Disc, Settings, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'vms' | 'lxc' | 'images' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'vms' | 'lxc' | 'images' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  
  const NavItem = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        activeTab === id 
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              HyperDash
            </span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-2">
            <NavItem id="dashboard" label="Overview" icon={LayoutDashboard} />
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <NavItem id="vms" label="Virtual Machines" icon={Server} />
            <NavItem id="lxc" label="Containers" icon={Box} />
            <NavItem id="images" label="Images" icon={Disc} />
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <NavItem id="settings" label="Settings" icon={Settings} />
          </div>

          {/* User Profile (Mock) */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-emerald-400">● Connected</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10 flex items-center justify-center">
              <span className="font-bold text-xs text-white">AD</span>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};