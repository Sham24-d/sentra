export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SOC_OPERATOR' | 'SECURITY_DIRECTOR' | 'SYSTEM_ADMIN';
  avatarUrl?: string;
  badgeId: string;
}

export interface Camera {
  id: string;
  code: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  fps: number;
  resolution: string;
  peopleCount: number;
  riskLevel: Severity;
  streamUrl?: string;
  lastActive: string;
}

export interface DetectionBox {
  id: string;
  label: string;
  category: 'PERSON' | 'WEAPON' | 'NORMAL_OBJECT';
  confidence: number;
  x: number; // percentage [0-100]
  y: number; // percentage [0-100]
  width: number; // percentage [0-100]
  height: number; // percentage [0-100]
  trackId?: string;
  statusTag?: string;
}

export interface Alert {
  id: string;
  severity: Severity;
  eventType: string;
  cameraCode: string;
  cameraName: string;
  timestamp: string;
  timeAgo: string;
  trackId?: string;
  description: string;
  acknowledged: boolean;
}

export interface Incident {
  id: string;
  timestamp: string;
  cameraCode: string;
  cameraName: string;
  eventType: string;
  trackId: string;
  riskScore: number;
  severity: Severity;
  status: 'UNRESOLVED' | 'UNDER_REVIEW' | 'RESOLVED';
  snapshotUrl?: string;
  breakdown: Record<string, number>;
  events: string[];
}

export interface RiskAttribution {
  factor: string;
  points: number;
  description: string;
}

export interface RiskIntelligenceState {
  currentScore: number;
  priorityLevel: Severity;
  primaryThreat: string;
  attribution: RiskAttribution[];
  totalAttributionScore: number;
  synergyApplied: boolean;
  synergyBonus: number;
}

export interface KPIStats {
  activeCameras: number;
  totalCameras: number;
  peopleDetected: number;
  activeAlerts: number;
  highRiskEvents: number;
  loiteringEvents: number;
  restrictedAreaEvents: number;
}

export interface RiskConfig {
  weaponFirearm: number;
  weaponKnife: number;
  restrictedArea: number;
  loitering: number;
  crowdDensity: number;
  abnormalMovement: number;
  armedIntrusionSynergy: number;
}
