import React from 'react';
import { Server } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="glass-nav sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
              <Server size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-white leading-none">HyperDash</span>
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase opacity-70">Virtualization Manager</span>
            </div>
          </div>
          <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
             {['dashboard', 'vms', 'lxc', 'images', 'settings'].map((tab) => (
                 <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                 >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                 </button>
             ))}
          </div>
        </div>
      </div>
    </nav>
  );
};