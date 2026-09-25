import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Clock, 
  Search, 
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { Alert } from '../../types';

interface HeaderProps {
  activeTab: string;
  alerts: Alert[];
  onOpenAlertModal: (alert: Alert) => void;
  audioMuted: boolean;
  setAudioMuted: (muted: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  alerts,
  onOpenAlertModal,
  audioMuted,
  setAudioMuted,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabTitles: Record<string, string> = {
    dashboard: 'SOC Overview Command Center',
    monitoring: 'Multi-Camera Live Matrix',
    incidents: 'Forensic Incident Registry',
    analytics: 'Spatial & Behavioral Analytics',
    cameras: 'Camera Fleet Management',
    settings: 'Security & Risk Configuration',
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <header className="h-16 bg-[#080d15] border-b border-[#1e2a3e] px-6 flex items-center justify-between z-20 select-none">
      {/* View Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase font-semibold">
            SENTRA OPS // {activeTab.toUpperCase()}
          </span>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">
            {tabTitles[activeTab] || 'Command Center'}
          </h1>
        </div>
      </div>

      {/* Center/Right Status Badges and Utilities */}
      <div className="flex items-center gap-4">
        {/* System Health Operational Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ALL SYSTEMS OPERATIONAL</span>
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0f1726] border border-[#1e2a3e] text-slate-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || '13:45:00 UTC'}</span>
        </div>

        {/* Silent Ops Indicator (No Alarm) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0f1726] border border-[#1e2a3e] text-slate-400 font-mono text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Silent Monitoring</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-md bg-[#0f1726] border border-[#1e2a3e] text-slate-300 hover:text-white hover:border-slate-600 transition-colors relative"
            title="Real-time Alert Notifications"
          >
            <Bell className="w-4 h-4" />
            {unacknowledgedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {unacknowledgedCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0e1625] border border-[#1e2a3e] rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-[#1e2a3e] flex items-center justify-between bg-[#0a101b]">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Active Alert Notifications
                </span>
                <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-bold">
                  {unacknowledgedCount} UNREAD
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#1e2a3e]">
                {alerts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onOpenAlertModal(a);
                      setNotificationsOpen(false);
                    }}
                    className="p-3 hover:bg-[#151f32] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        a.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        a.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                        a.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {a.severity}
                      </span>
                      <span className="text-[10px] text-slate-400">{a.timeAgo}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-200">{a.eventType}</div>
                    <div className="text-[11px] text-slate-400 truncate">{a.cameraName} ({a.cameraCode})</div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-[#1e2a3e] bg-[#090e18] text-center">
                <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-medium">
                  View All in Incidents Tab
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
