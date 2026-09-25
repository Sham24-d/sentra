import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, ArrowUpDown, Eye, Download, CheckCircle2 } from 'lucide-react';
import { Incident } from '../types';

interface IncidentsPageProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.cameraCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.trackId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (level: string) => {
    switch (level) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'UNDER_REVIEW':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      default:
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
    }
  };

  return (
    <div className="p-6 space-y-4 select-none">
      {/* Top Filter and Search Bar */}
      <div className="bg-[#0e1625] border border-[#1e2a3e] p-4 rounded-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, camera, or event..."
            className="w-full bg-[#090f1a] border border-[#1b273b] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#090f1a] border border-[#1b273b] text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#090f1a] border border-[#1b273b] text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNRESOLVED">Unresolved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents Data Table */}
      <div className="rounded-lg bg-[#0e1625] border border-[#1e2a3e] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a101b] border-b border-[#1b263b] text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Camera</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4">Track ID</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182335]">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#121c2e] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{inc.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{inc.timestamp} UTC</td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      <div>{inc.cameraCode}</div>
                      <div className="text-[10px] text-slate-500">{inc.cameraName}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{inc.eventType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{inc.trackId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{inc.riskScore}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getStatusBadge(inc.status)}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectIncident(inc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#131d2e] border border-[#23354d] text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
