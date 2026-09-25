import React from 'react';
import { Camera as CameraIcon, Users, ShieldAlert, Circle } from 'lucide-react';
import { Camera } from '../../types';

interface CameraGridProps {
  cameras: Camera[];
  selectedCameraId: string;
  onSelectCamera: (id: string) => void;
}

export const CameraGrid: React.FC<CameraGridProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
}) => {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 border-rose-800 bg-rose-950/80';
      case 'HIGH':
        return 'text-orange-400 border-orange-800 bg-orange-950/80';
      case 'MEDIUM':
        return 'text-amber-400 border-amber-800 bg-amber-950/80';
      default:
        return 'text-emerald-400 border-emerald-800 bg-emerald-950/80';
    }
  };

  return (
    <div className="rounded-lg bg-[#0e1625] border border-[#1e2a3e] p-4 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b263b] mb-3">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
            Surveillance Fleet Matrix
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Click camera to focus monitor
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cameras.slice(0, 4).map((cam) => {
          const isSelected = cam.id === selectedCameraId;
          return (
            <div
              key={cam.id}
              onClick={() => onSelectCamera(cam.id)}
              className={`p-2.5 rounded-lg bg-[#090f1a] border cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950'
                  : 'border-[#1a2538] hover:border-slate-500'
              }`}
            >
              {/* Simulated Mini Camera Screen */}
              <div className="relative aspect-video rounded bg-[#060a12] overflow-hidden flex items-center justify-center mb-2 border border-white/5 surveillance-grid">
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{cam.code}</span>
                </div>

                <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getRiskBadge(cam.riskLevel)}`}>
                  {cam.riskLevel}
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  {cam.location}
                </span>
              </div>

              {/* Info Row */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate pr-1">
                  {cam.name}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 shrink-0">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{cam.peopleCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
