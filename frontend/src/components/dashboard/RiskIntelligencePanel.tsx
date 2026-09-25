import React from 'react';
import { ShieldAlert, Info, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { RiskIntelligenceState } from '../../types';

interface RiskIntelligencePanelProps {
  riskState: RiskIntelligenceState;
}

export const RiskIntelligencePanel: React.FC<RiskIntelligencePanelProps> = ({ riskState }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          text: 'text-rose-400',
          bg: 'bg-rose-950/80',
          border: 'border-rose-800',
          bar: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          text: 'text-orange-400',
          bg: 'bg-orange-950/80',
          border: 'border-orange-800',
          bar: 'bg-orange-500',
        };
      case 'MEDIUM':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-950/80',
          border: 'border-amber-800',
          bar: 'bg-amber-500',
        };
      default:
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-800',
          bar: 'bg-emerald-500',
        };
    }
  };

  const colors = getLevelColor(riskState.priorityLevel);

  return (
    <div className="rounded-lg bg-[#0e1625] border border-[#1e2a3e] p-5 shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1b263b]">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-5 h-5 ${colors.text}`} />
            <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              Risk Intelligence Engine
            </h3>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {riskState.priorityLevel} PRIORITY
          </span>
        </div>

        {/* Score & Gauge Section */}
        <div className="my-5 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
              COMPOSITE RISK PRIORITY
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${colors.text}`}>
                {riskState.currentScore}
              </span>
              <span className="text-slate-500 font-mono text-lg font-bold">/ 100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">PRIMARY FACTOR</span>
            <span className="text-xs font-semibold text-slate-200 mt-0.5 block max-w-[180px] truncate">
              {riskState.primaryThreat}
            </span>
          </div>
        </div>

        {/* Horizontal Progress Meter */}
        <div className="w-full bg-[#162032] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#22324e] mb-5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${Math.min(100, Math.max(5, riskState.currentScore))}%` }}
          />
        </div>

        {/* Factor Attribution Breakdown */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Attribution Breakdown (Explainable Rules)
          </span>

          <div className="space-y-1.5 bg-[#090f1a] p-3 rounded border border-[#1a2538] font-mono text-xs">
            {riskState.attribution.map((attr, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-slate-300 font-medium">{attr.factor}</span>
                <span className={`font-bold ${colors.text}`}>+{attr.points}</span>
              </div>
            ))}

            {/* Total Row */}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#23324d] font-bold">
              <span className="text-slate-100 uppercase tracking-wider">TOTAL SCORE</span>
              <span className={`text-sm ${colors.text}`}>{riskState.totalAttributionScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Disclaimer */}
      <div className="mt-5 pt-3 border-t border-[#1b263b] flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          <strong>Rule-based Priority:</strong> Scores are transparently calculated from detected visual events to prioritize human operator attention. This is <em>not</em> an automated prediction of criminal intent.
        </span>
      </div>
    </div>
  );
};
