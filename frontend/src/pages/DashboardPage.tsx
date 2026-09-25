import React from 'react';
import { 
  Camera as CameraIcon, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  Timer, 
  ShieldCheck 
} from 'lucide-react';
import { Camera, Alert, Incident, KPIStats, RiskIntelligenceState } from '../types';
import { StatCard } from '../components/dashboard/StatCard';
import { LiveMonitor } from '../components/dashboard/LiveMonitor';
import { RiskIntelligencePanel } from '../components/dashboard/RiskIntelligencePanel';
import { CameraGrid } from '../components/dashboard/CameraGrid';
import { AlertFeed } from '../components/dashboard/AlertFeed';

interface DashboardPageProps {
  stats: KPIStats;
  cameras: Camera[];
  selectedCamera: Camera;
  onSelectCamera: (camId: string) => void;
  alerts: Alert[];
  riskState: RiskIntelligenceState;
  onViewIncident: (alert: Alert) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  cameras,
  selectedCamera,
  onSelectCamera,
  alerts,
  riskState,
  onViewIncident,
  isAudioMuted,
  onToggleAudio,
}) => {
  return (
    <div className="space-y-5 p-6 select-none">
      {/* Top KPI Cards Row (6 Cards requested in prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Active Cameras"
          value={stats.activeCameras}
          subtext="+2 online today"
          icon={CameraIcon}
          variant="default"
          trend="100% ONLINE"
        />
        <StatCard
          title="People Detected"
          value={stats.peopleDetected}
          subtext="Active in sector"
          icon={Users}
          variant="info"
          trend="REAL-TIME"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          subtext="Requires operator check"
          icon={AlertTriangle}
          variant="medium"
          trend="ACTIONABLE"
          pulse
        />
        <StatCard
          title="High Risk Events"
          value={stats.highRiskEvents}
          subtext="Priority escalation"
          icon={ShieldAlert}
          variant="critical"
          pulse
        />
        <StatCard
          title="Loitering Events"
          value={stats.loiteringEvents}
          subtext="Dwell limit >10s"
          icon={Timer}
          variant="medium"
        />
        <StatCard
          title="Restricted Area"
          value={stats.restrictedAreaEvents}
          subtext="Perimeter boundary"
          icon={ShieldCheck}
          variant="high"
        />
      </div>

      {/* Main Monitoring & Risk Center (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Live CCTV Monitor (7 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <LiveMonitor
            selectedCamera={selectedCamera}
            onSelectCamera={onSelectCamera}
            availableCameras={cameras}
            isAudioMuted={isAudioMuted}
            onToggleAudio={onToggleAudio}
          />

          {/* Sub-grid of other cameras */}
          <CameraGrid
            cameras={cameras}
            selectedCameraId={selectedCamera.id}
            onSelectCamera={onSelectCamera}
          />
        </div>

        {/* Right Column: Risk Intelligence Engine & Real-time Alert Feed (5 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <RiskIntelligencePanel riskState={riskState} />
          
          <div className="flex-1 min-h-[380px]">
            <AlertFeed alerts={alerts} onViewIncident={onViewIncident} />
          </div>
        </div>
      </div>
    </div>
  );
};
