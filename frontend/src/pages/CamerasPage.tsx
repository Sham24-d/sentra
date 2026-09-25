import React, { useState } from 'react';
import { Camera, Plus, Edit2, Trash2, Eye, ShieldAlert, Circle, Activity } from 'lucide-react';
import { Camera as CameraType } from '../types';

interface CamerasPageProps {
  cameras: CameraType[];
  onViewCamera: (camId: string) => void;
}

export const CamerasPage: React.FC<CamerasPageProps> = ({ cameras, onViewCamera }) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCamName, setNewCamName] = useState<string>('');
  const [newCamLocation, setNewCamLocation] = useState<string>('');

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

  const handleAddCamera = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Camera ${newCamName} (${newCamLocation}) added to RTSP provisioning queue.`);
    setShowAddModal(false);
  };

  return (
    <div className="p-6 space-y-4 select-none">
      {/* Top Header & Provision Button */}
      <div className="flex items-center justify-between bg-[#0e1625] border border-[#1e2a3e] p-4 rounded-lg">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight">
            Surveillance Fleet & Camera Provisioning
          </h2>
          <p className="text-xs text-slate-400">
            Configure IP cameras, RTSP streams, FPS limits, and detection parameters.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Camera</span>
        </button>
      </div>

      {/* Camera Fleet Table */}
      <div className="rounded-lg bg-[#0e1625] border border-[#1e2a3e] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a101b] border-b border-[#1b263b] text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Camera Identifier</th>
                <th className="py-3 px-4">Physical Location</th>
                <th className="py-3 px-4">Link Status</th>
                <th className="py-3 px-4">FPS & Resolution</th>
                <th className="py-3 px-4">People Count</th>
                <th className="py-3 px-4">Current Risk</th>
                <th className="py-3 px-4">Last Telemetry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182335]">
              {cameras.map((cam) => (
                <tr key={cam.id} className="hover:bg-[#121c2e] transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-cyan-400">{cam.code}</div>
                    <div className="text-[11px] text-slate-300 font-semibold">{cam.name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium">{cam.location}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{cam.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    <div>{cam.fps} FPS</div>
                    <div className="text-[10px] text-slate-500">{cam.resolution}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{cam.peopleCount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getRiskBadge(cam.riskLevel)}`}>
                      {cam.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{cam.lastActive}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onViewCamera(cam.id)}
                      className="p-1.5 rounded bg-[#131d2e] border border-[#23354d] text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors"
                      title="Focus Monitor"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert(`Edit configuration for ${cam.code}`)}
                      className="p-1.5 rounded bg-[#131d2e] border border-[#23354d] text-slate-400 hover:text-white transition-colors"
                      title="Edit Camera"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1625] border border-[#22354f] rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Provision New IP Surveillance Camera
            </h3>

            <form onSubmit={handleAddCamera} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase font-mono block mb-1">Camera Label</label>
                <input
                  type="text"
                  required
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  placeholder="e.g. South Perimeter Fence"
                  className="w-full bg-[#090f1a] border border-[#1b273b] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-mono block mb-1">Physical Location Zone</label>
                <input
                  type="text"
                  required
                  value={newCamLocation}
                  onChange={(e) => setNewCamLocation(e.target.value)}
                  placeholder="e.g. Sector 5 West Gate"
                  className="w-full bg-[#090f1a] border border-[#1b273b] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-mono block mb-1">RTSP Stream URI / Device Index</label>
                <input
                  type="text"
                  defaultValue="rtsp://admin:pass@192.168.1.100:554/h264"
                  className="w-full bg-[#090f1a] border border-[#1b273b] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1a263a]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
