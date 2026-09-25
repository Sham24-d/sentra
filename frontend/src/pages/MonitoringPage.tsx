import React, { useState } from 'react';
import { Camera, LayoutGrid, Square, Grid, Maximize2, Users, ShieldAlert, Crosshair } from 'lucide-react';
import { Camera as CameraType } from '../types';

interface MonitoringPageProps {
  cameras: CameraType[];
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({ cameras }) => {
  const [layout, setLayout] = useState<'4-UP' | '9-UP' | 'FOCUS'>('4-UP');
  const [focusedCamera, setFocusedCamera] = useState<CameraType>(cameras[0] || {} as CameraType);

  const getRiskColor = (level: string) => {
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

  const displayCameras = layout === '4-UP' ? cameras.slice(0, 4) : cameras.slice(0, 9);

  return (
    <div className="p-6 space-y-4 select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between bg-[#0e1625] border border-[#1e2a3e] p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Multi-Feed Surveillance Wall
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({displayCameras.length} active streams)
          </span>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1 bg-[#131d2e] p-1 rounded border border-[#23354d]">
          <button
            onClick={() => setLayout('FOCUS')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              layout === 'FOCUS'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Single</span>
          </button>
          <button
            onClick={() => setLayout('4-UP')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              layout === '4-UP'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>2x2 Matrix</span>
          </button>
          <button
            onClick={() => setLayout('9-UP')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              layout === '9-UP'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>3x3 Matrix</span>
          </button>
        </div>
      </div>

      {/* Surveillance Grid Display */}
      {layout === 'FOCUS' ? (
        <div className="relative aspect-video rounded-xl bg-[#060a12] border border-[#1e2a3e] overflow-hidden flex items-center justify-center surveillance-grid shadow-2xl">
          <div className="absolute top-4 left-4 z-10 bg-black/75 px-3 py-1.5 rounded border border-white/10 font-mono text-xs text-slate-200">
            <span className="font-bold text-cyan-400">{focusedCamera.code}</span> // {focusedCamera.name} ({focusedCamera.location})
          </div>
          <div className="text-center opacity-40">
            <Crosshair className="w-20 h-20 text-cyan-700/50 mx-auto animate-spin" style={{ animationDuration: '40s' }} />
            <span className="text-xs font-mono text-slate-400 mt-2 block">ACTIVE HIGH-RES STREAM</span>
          </div>
        </div>
      ) : (
        <div
          className={`grid gap-3.5 ${
            layout === '4-UP' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {displayCameras.map((cam) => (
            <div
              key={cam.id}
              onClick={() => {
                setFocusedCamera(cam);
                setLayout('FOCUS');
              }}
              className="relative aspect-video rounded-lg bg-[#070c16] border border-[#1a2538] hover:border-cyan-500/60 transition-all cursor-pointer overflow-hidden group shadow-md"
            >
              <div className="absolute inset-0 surveillance-grid opacity-20" />

              {/* Camera Header Tags */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 rounded border border-white/10 text-[10px] font-mono text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-cyan-300">{cam.code}</span>
                <span>{cam.name}</span>
              </div>

              <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getRiskColor(cam.riskLevel)}`}>
                {cam.riskLevel}
              </div>

              {/* Center Silhouette */}
              <div className="w-full h-full flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                <Crosshair className="w-10 h-10 text-cyan-600/40" />
              </div>

              {/* Camera Footer Telemetry */}
              <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/70 px-2 py-1 rounded border border-white/5">
                <span>{cam.location}</span>
                <div className="flex items-center gap-1 text-cyan-400">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{cam.peopleCount} people</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
