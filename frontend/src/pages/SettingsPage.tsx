import React, { useState } from 'react';
import { Sliders, ShieldAlert, Bell, Eye, Save, RotateCcw, Info } from 'lucide-react';
import { RiskConfig } from '../types';

export const SettingsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'RISK' | 'DETECTION' | 'ALERTS' | 'SYSTEM'>('RISK');

  const [riskWeights, setRiskWeights] = useState<RiskConfig>({
    weaponFirearm: 40,
    weaponKnife: 35,
    restrictedArea: 20,
    loitering: 10,
    crowdDensity: 15,
    abnormalMovement: 15,
    armedIntrusionSynergy: 25,
  });

  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleWeightChange = (key: keyof RiskConfig, value: number) => {
    setRiskWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const maxHypotheticalScore = 
    riskWeights.weaponFirearm +
    riskWeights.restrictedArea +
    riskWeights.abnormalMovement +
    riskWeights.armedIntrusionSynergy;

  return (
    <div className="p-6 space-y-6 select-none max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b263b]">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight">
            System & Risk Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Tune rule-based event weights, confidence thresholds, and siren parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'Weights Saved!' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1b263b] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('RISK')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'RISK' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          Risk Intelligence Weights
        </button>
        <button
          onClick={() => setActiveSubTab('DETECTION')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'DETECTION' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          Detection Thresholds
        </button>
        <button
          onClick={() => setActiveSubTab('ALERTS')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'ALERTS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          Alert & Audio Settings
        </button>
      </div>

      {activeSubTab === 'RISK' && (
        <div className="space-y-6">
          {/* Formula Card */}
          <div className="p-4 rounded-lg bg-[#0e1625] border border-cyan-800/40 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Transparent Rule Formula
              </span>
            </div>
            <div className="font-mono text-sm text-slate-200 bg-[#070b13] p-3 rounded border border-white/5">
              Risk Priority Score = min(100, &sum; (Active Event Weight) + Synergy Multipliers)
            </div>
            <p className="text-[11px] text-slate-400">
              Each detected event contributes a discrete, auditable weight to the priority score. Normal everyday objects (phones, bags) have an explicit weight of 0 to prevent false alarms.
            </p>
          </div>

          {/* Sliders Grid */}
          <div className="p-6 rounded-lg bg-[#0e1625] border border-[#1e2a3e] shadow-lg space-y-5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Event Contribution Weights
            </h3>

            {/* Firearm Weight */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold">Firearm Detected (Handgun / Rifle)</span>
                <span className="text-rose-400 font-bold">+{riskWeights.weaponFirearm} pts</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={riskWeights.weaponFirearm}
                onChange={(e) => handleWeightChange('weaponFirearm', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Knife Weight */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold">Edged Blade / Knife Detected</span>
                <span className="text-orange-400 font-bold">+{riskWeights.weaponKnife} pts</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={riskWeights.weaponKnife}
                onChange={(e) => handleWeightChange('weaponKnife', Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Restricted Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold">Restricted Area Intrusion (Point-in-Polygon)</span>
                <span className="text-amber-400 font-bold">+{riskWeights.restrictedArea} pts</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={riskWeights.restrictedArea}
                onChange={(e) => handleWeightChange('restrictedArea', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Loitering */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold">Suspicious Loitering (Track Dwell &gt; 10s)</span>
                <span className="text-amber-400 font-bold">+{riskWeights.loitering} pts</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={riskWeights.loitering}
                onChange={(e) => handleWeightChange('loitering', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Crowd Density */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold">Crowd Density Threshold Exceeded</span>
                <span className="text-cyan-400 font-bold">+{riskWeights.crowdDensity} pts</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={riskWeights.crowdDensity}
                onChange={(e) => handleWeightChange('crowdDensity', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Abnormal Movement */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold">Abnormal Movement (Running &gt; 140 px/s)</span>
                <span className="text-cyan-400 font-bold">+{riskWeights.abnormalMovement} pts</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={riskWeights.abnormalMovement}
                onChange={(e) => handleWeightChange('abnormalMovement', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Armed Intrusion Synergy */}
            <div className="space-y-1.5 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-300 font-semibold">Armed Intrusion Synergy Bonus (Weapon + Breach)</span>
                <span className="text-rose-400 font-bold">+{riskWeights.armedIntrusionSynergy} pts</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={riskWeights.armedIntrusionSynergy}
                onChange={(e) => handleWeightChange('armedIntrusionSynergy', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'DETECTION' && (
        <div className="p-6 rounded-lg bg-[#0e1625] border border-[#1e2a3e] shadow-lg space-y-4 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
            Neural Confidence & Safe Item Gating
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 font-mono block mb-1">Person Detection Confidence Threshold (0.40)</label>
              <input type="range" min="20" max="80" defaultValue="40" className="w-full accent-cyan-500 cursor-pointer" />
            </div>
            <div>
              <label className="text-slate-300 font-mono block mb-1">Weapon Threat Confidence Threshold (0.35)</label>
              <input type="range" min="20" max="80" defaultValue="35" className="w-full accent-rose-500 cursor-pointer" />
            </div>
            <div>
              <label className="text-slate-300 font-mono block mb-1">Safe Object Gating (Phones, Bags, Bottles) (0.35)</label>
              <input type="range" min="20" max="80" defaultValue="35" className="w-full accent-emerald-500 cursor-pointer" />
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ALERTS' && (
        <div className="p-6 rounded-lg bg-[#0e1625] border border-[#1e2a3e] shadow-lg space-y-4 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
            Alarm Cooldown & Forensic Storage
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-[#070b13] border-slate-700 text-cyan-500" />
              <span>Enable audio siren playback on CRITICAL events</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-[#070b13] border-slate-700 text-cyan-500" />
              <span>Automatically archive high-resolution evidence snapshots</span>
            </label>
            <div className="pt-2">
              <label className="text-slate-400 font-mono block mb-1">Alarm Cooldown Period (5.0s)</label>
              <input type="range" min="1" max="15" defaultValue="5" className="w-full accent-cyan-500 cursor-pointer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
