import { Camera, Alert, Incident, KPIStats, RiskIntelligenceState, RiskConfig } from '../types';
import { initialKPIStats, mockCameras, mockAlerts, mockIncidents, initialRiskState } from './mockData';

const API_BASE = '/api';

export const apiService = {
  async getKPIStats(): Promise<KPIStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback to realistic mock state
    }
    return initialKPIStats;
  },

  async getCameras(): Promise<Camera[]> {
    try {
      const res = await fetch(`${API_BASE}/cameras`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return mockCameras;
  },

  async getAlerts(): Promise<Alert[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return mockAlerts;
  },

  async getIncidents(): Promise<Incident[]> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const raw = await res.json();
        return raw.map((r: any) => ({
          id: `INC-${r.id}`,
          timestamp: r.timestamp.split(' ')[1] || r.timestamp,
          cameraCode: 'CAM-01',
          cameraName: 'Main Surveillance',
          eventType: r.primary_threat,
          trackId: `#${r.id}`,
          riskScore: r.risk_score,
          severity: r.risk_level,
          status: 'UNRESOLVED',
          snapshotUrl: r.snapshot_path ? `/api/snapshot?path=${encodeURIComponent(r.snapshot_path)}` : undefined,
          breakdown: r.breakdown || {},
          events: r.events || [],
        }));
      }
    } catch {
      // Fallback
    }
    return mockIncidents;
  },

  async getRiskIntelligence(): Promise<RiskIntelligenceState> {
    try {
      const res = await fetch(`${API_BASE}/risk`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return initialRiskState;
  },

  async saveRiskConfig(config: RiskConfig): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/config/risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.ok;
    } catch {
      return true; // Mock success
    }
  },
};
