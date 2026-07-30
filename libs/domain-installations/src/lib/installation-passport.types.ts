export type InstallationStatus = 'draft' | 'active' | 'archived';

export type GroundingType = 'tn-c' | 'tn-c-s' | 'tn-s' | 'tt' | 'unknown';

export interface InstallationRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  propertyAddress: string;
  status: InstallationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PanelRecord {
  id: string;
  installationId: string;
  name: string;
  location?: string;
  mainBreaker?: string;
  groundingType: GroundingType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CircuitRecord {
  id: string;
  panelId: string;
  circuitNo: number;
  label: string;
  breakerType?: string;
  breakerAmps?: number;
  breakerCurve?: 'B' | 'C' | 'D' | 'unknown';
  cableType?: string;
  cableMm2?: number;
  rcdGroup?: string;
  room?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceEntryType =
  | 'installation'
  | 'thermal_check'
  | 'inspection'
  | 'repair'
  | 'upgrade'
  | 'note';

export interface ServiceEntryRecord {
  id: string;
  installationId: string;
  type: ServiceEntryType;
  date: string;
  title: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
