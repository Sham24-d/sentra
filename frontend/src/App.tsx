import React, { useState, useEffect } from 'react';
import { User, Camera, Alert, Incident, KPIStats, RiskIntelligenceState } from './types';
import { mockCameras, mockAlerts, mockIncidents, initialKPIStats, initialRiskState } from './services/mockData';
import { apiService } from './services/api';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { IncidentModal } from './components/modals/IncidentModal';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CamerasPage } from './pages/CamerasPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Default logged in for immediate showcase
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-01',
    name: 'Sham (Lead CV/SOC)',
    email: 'operator@sentra.ai',
    role: 'SOC_OPERATOR',
    badgeId: 'BADGE #8492-OPS',
  });

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Operational State
  const [cameras, setCameras] = useState<Camera[]>(mockCameras);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('cam-01');
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [stats, setStats] = useState<KPIStats>(initialKPIStats);
  const [riskState, setRiskState] = useState<RiskIntelligenceState>(initialRiskState);

  // Modal State
  const [activeModalIncident, setActiveModalIncident] = useState<Incident | null>(null);

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  // Poll periodic stats from backend if running
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const liveStats = await apiService.getKPIStats();
        setStats(liveStats);
        
        const liveIncidents = await apiService.getIncidents();
        if (liveIncidents.length > 0) setIncidents(liveIncidents);

        const liveRisk = await apiService.getRiskIntelligence();
        setRiskState(liveRisk);

        const liveAlerts = await apiService.getAlerts();
        if (liveAlerts.length > 0) setAlerts(liveAlerts);

        const liveCameras = await apiService.getCameras();
        if (liveCameras.length > 0) setCameras(liveCameras);
      } catch (err) {
        // Fallback maintained
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (email: string) => {
    setCurrentUser((prev) => ({ ...prev, email }));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleOpenAlertModal = (alert: Alert) => {
    const matched = incidents.find((i) => i.cameraCode === alert.cameraCode) || incidents[0];
    setActiveModalIncident(matched);
  };

  const handleResolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'RESOLVED' } : inc))
    );
  };

  // If not logged in, show the Login Page
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#070a0f] text-slate-100 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          alerts={alerts}
          onOpenAlertModal={handleOpenAlertModal}
          audioMuted={audioMuted}
          setAudioMuted={setAudioMuted}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-[#070a0f]">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              cameras={cameras}
              selectedCamera={selectedCamera}
              onSelectCamera={setSelectedCameraId}
              alerts={alerts}
              riskState={riskState}
              onViewIncident={(alt) => handleOpenAlertModal(alt)}
              isAudioMuted={audioMuted}
              onToggleAudio={() => setAudioMuted(!audioMuted)}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringPage cameras={cameras} />
          )}

          {activeTab === 'incidents' && (
            <IncidentsPage
              incidents={incidents}
              onSelectIncident={(inc) => setActiveModalIncident(inc)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'cameras' && (
            <CamerasPage
              cameras={cameras}
              onViewCamera={(id) => {
                setSelectedCameraId(id);
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Incident Detail Modal */}
      <IncidentModal
        incident={activeModalIncident}
        onClose={() => setActiveModalIncident(null)}
        onResolve={handleResolveIncident}
      />
    </div>
  );
};

export default App;
