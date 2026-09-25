import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  AlertTriangle, 
  BarChart3, 
  Camera, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  currentUser: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Video, badge: 'LIVE' },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: '3' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'cameras', label: 'Cameras', icon: Camera },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0b1019] border-r border-[#1e2a3e] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header with Uploaded Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#1e2a3e] bg-[#080d15] gap-3">
        <img
          src="/sentra_logo.jpg"
          alt="Rakshak Logo"
          className="h-10 w-10 object-cover rounded-lg border border-[#263750] shadow-md shadow-cyan-950/40"
        />
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-extrabold tracking-wider text-slate-100 text-base leading-tight">
              SENTRA
            </span>
            <span className="text-[10px] tracking-widest text-cyan-400 font-medium uppercase">
              RISK INTELLIGENCE
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 text-cyan-400 border-l-2 border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111927]'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />

              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    item.badge === 'LIVE'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 animate-pulse'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapse */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <div className="px-3 py-2 border-t border-[#1e2a3e]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-[#131d2e] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-wider">Collapse Menu</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Status & Profile */}
      <div className="p-3 border-t border-[#1e2a3e] bg-[#070b12] space-y-2">
        {/* System Health Status */}
        <div className={`flex items-center gap-2 p-2 rounded bg-[#0e1624] border border-[#1b263b] ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-200 tracking-wide">SYSTEM READY</span>
              <span className="text-[9px] text-slate-400">FPS: 24.2 | Latency: 42ms</span>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className={`flex items-center gap-2.5 pt-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-900 to-slate-800 border border-cyan-700/50 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-cyan-400 font-mono">{currentUser.badgeId}</div>
            </div>
          )}
          <button
            onClick={onLogout}
            title="Logout"
            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
