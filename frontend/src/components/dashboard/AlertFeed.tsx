import React from 'react';
import { AlertCircle, ArrowUpRight, ShieldCheck, Eye } from 'lucide-react';
import { Alert } from '../../types';

interface AlertFeedProps {
  alerts: Alert[];
  onViewIncident: (alert: Alert) => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, onViewIncident }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-300 border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="rounded-lg bg-[#0e1625] border border-[#1e2a3e] p-4 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b263b] mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
            Live Alert Feed
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded font-semibold">
          {alerts.length} ACTIVE
        </span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 rounded-lg bg-[#090f1a] border border-[#1a2538] hover:border-slate-600 transition-all flex flex-col gap-1.5 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${getSeverityBadge(
                    alert.severity
                  )}`}
                >
                  {alert.severity}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {alert.eventType}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{alert.timeAgo}</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              {alert.description}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
              <span className="font-mono">
                {alert.cameraCode} • {alert.cameraName}
              </span>
              {alert.trackId && (
                <span className="font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded">
                  Track {alert.trackId}
                </span>
              )}
              <button
                onClick={() => onViewIncident(alert)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold group-hover:underline"
              >
                <span>View Incident</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
