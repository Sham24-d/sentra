import React from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, Users } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { mockAnalytics } from '../services/mockData';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b263b]">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight">
            Spatial-Temporal Risk Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Automated event distribution and occupancy density metrics.
          </p>
        </div>
        <div className="px-3 py-1 bg-[#0e1625] border border-[#1e2a3e] rounded font-mono text-xs text-cyan-400">
          Range: Past 6 Hours
        </div>
      </div>

      {/* Grid of Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Events Over Time (Area Chart) */}
        <div className="p-5 rounded-lg bg-[#0e1625] border border-[#1e2a3e] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Event Activity Over Time
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Hourly Aggregate</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalytics.hourlyEvents}>
                <defs>
                  <linearGradient id="colorIntrusion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoitering" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b263b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090f1a', borderColor: '#23324d', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="intrusion" stroke="#ef4444" fillOpacity={1} fill="url(#colorIntrusion)" name="Intrusions" />
                <Area type="monotone" dataKey="loitering" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLoitering)" name="Loitering" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Risk Priority Distribution (Pie / Donut) */}
        <div className="p-5 rounded-lg bg-[#0e1625] border border-[#1e2a3e] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Risk Priority Tier Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total: 88 Evaluations</span>
          </div>

          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={mockAnalytics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {mockAnalytics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090f1a', borderColor: '#23324d', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Grid */}
      <div className="p-5 rounded-lg bg-[#0e1625] border border-[#1e2a3e] shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
          Event Category Prevalence
        </h3>

        <div className="space-y-3">
          {mockAnalytics.categoryBreakdown.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">{cat.category}</span>
                <span className="text-cyan-400 font-bold">{cat.count} events ({cat.percentage}%)</span>
              </div>
              <div className="w-full bg-[#121c2d] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
