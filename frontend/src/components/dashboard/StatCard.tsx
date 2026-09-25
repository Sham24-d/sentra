import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'safe' | 'info';
  trend?: string;
  pulse?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  trend,
  pulse = false,
}) => {
  const variantStyles = {
    default: {
      border: 'border-[#1e2a3e]',
      iconBg: 'bg-slate-800/60 text-slate-300',
      valueColor: 'text-slate-100',
    },
    critical: {
      border: 'border-rose-900/60 bg-gradient-to-b from-rose-950/20 to-[#0e1625]',
      iconBg: 'bg-rose-950/80 text-rose-400 border border-rose-800/60',
      valueColor: 'text-rose-400',
    },
    high: {
      border: 'border-orange-900/60 bg-gradient-to-b from-orange-950/20 to-[#0e1625]',
      iconBg: 'bg-orange-950/80 text-orange-400 border border-orange-800/60',
      valueColor: 'text-orange-400',
    },
    medium: {
      border: 'border-amber-900/60 bg-gradient-to-b from-amber-950/20 to-[#0e1625]',
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
      valueColor: 'text-amber-400',
    },
    safe: {
      border: 'border-emerald-900/60 bg-gradient-to-b from-emerald-950/20 to-[#0e1625]',
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
      valueColor: 'text-emerald-400',
    },
    info: {
      border: 'border-cyan-900/60 bg-gradient-to-b from-cyan-950/20 to-[#0e1625]',
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60',
      valueColor: 'text-cyan-400',
    },
  };

  const currentStyle = variantStyles[variant];

  return (
    <div
      className={`relative p-4 rounded-lg bg-[#0e1625] border ${currentStyle.border} transition-all duration-200 hover:border-slate-600 shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className={`text-2xl font-bold font-mono tracking-tight ${currentStyle.valueColor}`}>
              {typeof value === 'number' && value < 10 && value >= 0 ? `0${value}` : value}
            </span>
            {trend && (
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {trend}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">{subtext}</span>
        </div>

        <div className={`p-2.5 rounded-lg ${currentStyle.iconBg} relative`}>
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          )}
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
