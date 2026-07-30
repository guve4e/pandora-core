import type {
  GroundingType,
  InstallationStatus,
  ServiceEntryType,
} from '@energrid/domain-installations';

export interface CreateInstallationDto {
  customerName: string;
  customerPhone?: string;
  propertyAddress: string;
  notes?: string;
}

export interface UpdateInstallationDto {
  customerName?: string;
  customerPhone?: string;
  propertyAddress?: string;
  status?: InstallationStatus;
  notes?: string;
}

export interface CreatePanelDto {
  name: string;
  location?: string;
  mainBreaker?: string;
  groundingType?: GroundingType;
  notes?: string;
}

export interface CreateCircuitDto {
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
}

export interface UpdateCircuitDto {
  circuitNo?: number;
  label?: string;
  breakerType?: string;
  breakerAmps?: number;
  breakerCurve?: 'B' | 'C' | 'D' | 'unknown';
  cableType?: string;
  cableMm2?: number;
  rcdGroup?: string;
  room?: string;
  notes?: string;
}

export interface CreateServiceEntryDto {
  type: ServiceEntryType;
  date?: string;
  title: string;
  notes?: string;
}
