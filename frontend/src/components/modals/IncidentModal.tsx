import React from 'react';
import { X, ShieldAlert, Download, CheckCircle2, Clock, Camera as CameraIcon, Crosshair } from 'lucide-react';
import { Incident } from '../../types';

interface IncidentModalProps {
  incident: Incident | null;
  onClose: () => void;
  onResolve: (id: string) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  incident,
  onClose,
  onResolve,
}) => {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e1625] border border-[#22354f] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="h-14 bg-[#0a101b] border-b border-[#1f2d43] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-mono font-bold text-slate-100">{incident.id}</span>
              <span className="text-xs text-slate-400">— Forensic Incident Review</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#090f1a] border border-[#1b273b]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Severity Tier</span>
              <span className="text-sm font-bold text-rose-400 mt-1 block">{incident.severity}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#090f1a] border border-[#1b273b]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Risk Priority</span>
              <span className="text-sm font-bold text-amber-400 mt-1 font-mono block">{incident.riskScore} / 100</span>
            </div>
            <div className="p-3 rounded-lg bg-[#090f1a] border border-[#1b273b]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Camera</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 block">{incident.cameraCode}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#090f1a] border border-[#1b273b]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Detected Time</span>
              <span className="text-xs font-mono text-slate-200 mt-1 block">{incident.timestamp} UTC</span>
            </div>
          </div>

          {/* Evidence Frame Preview with Logo watermark */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Forensic Visual Evidence Snapshot
            </span>
            <div className="relative aspect-video rounded-lg bg-black overflow-hidden border border-[#23354d] flex items-center justify-center">
              <img
                src="/sentra_logo.jpg"
                alt="Evidence Snapshot"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded border border-white/20 font-mono text-[11px] text-cyan-300">
                CAM: {incident.cameraCode} | TRACK: {incident.trackId}
              </div>
              <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded border border-white/20 font-mono text-[11px] text-rose-400 font-bold">
                ALERT: {incident.eventType.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Attribution Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Score Attribution Breakdown
            </span>
            <div className="p-3 rounded-lg bg-[#090f1a] border border-[#1b273b] space-y-1.5 font-mono text-xs">
              {Object.entries(incident.breakdown).map(([factor, pts]) => (
                <div key={factor} className="flex items-center justify-between text-slate-300">
                  <span>{factor}</span>
                  <span className="text-orange-400 font-bold">+{pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="h-16 bg-[#0a101b] border-t border-[#1f2d43] px-6 flex items-center justify-between">
          <button
            onClick={() => alert(`Forensic dossier for ${incident.id} generated and ready for export.`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#23354d] bg-[#111a2a] text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Dossier</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onResolve(incident.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-950"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Resolved</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
