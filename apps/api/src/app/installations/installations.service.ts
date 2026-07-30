import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CircuitRecord,
  InstallationRecord,
  PanelRecord,
  ServiceEntryRecord,
} from '@energrid/domain-installations';
import type {
  CreateCircuitDto,
  CreateInstallationDto,
  CreatePanelDto,
  CreateServiceEntryDto,
  UpdateCircuitDto,
  UpdateInstallationDto,
} from './installations.dto';

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

@Injectable()
export class InstallationsService {
  private readonly installations: InstallationRecord[] = [];
  private readonly panels: PanelRecord[] = [];
  private readonly circuits: CircuitRecord[] = [];
  private readonly serviceEntries: ServiceEntryRecord[] = [];

  createInstallation(dto: CreateInstallationDto): InstallationRecord {
    const timestamp = now();

    const record: InstallationRecord = {
      id: id('inst'),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      propertyAddress: dto.propertyAddress,
      status: 'draft',
      notes: dto.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.installations.push(record);
    return record;
  }

  listInstallations(): InstallationRecord[] {
    return [...this.installations].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  getInstallation(id: string) {
    const installation = this.installations.find((x) => x.id === id);

    if (!installation) {
      throw new NotFoundException(`Installation not found: ${id}`);
    }

    const panels = this.panels
      .filter((x) => x.installationId === id)
      .map((panel) => ({
        ...panel,
        circuits: this.circuits
          .filter((c) => c.panelId === panel.id)
          .sort((a, b) => a.circuitNo - b.circuitNo),
      }));

    const serviceEntries = this.serviceEntries
      .filter((x) => x.installationId === id)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      ...installation,
      panels,
      serviceEntries,
    };
  }

  updateInstallation(
    id: string,
    dto: UpdateInstallationDto,
  ): InstallationRecord {
    const record = this.installations.find((x) => x.id === id);

    if (!record) {
      throw new NotFoundException(`Installation not found: ${id}`);
    }

    Object.assign(record, dto, { updatedAt: now() });
    return record;
  }

  createPanel(
    installationId: string,
    dto: CreatePanelDto,
  ): PanelRecord {
    this.assertInstallationExists(installationId);

    const timestamp = now();

    const panel: PanelRecord = {
      id: id('panel'),
      installationId,
      name: dto.name,
      location: dto.location,
      mainBreaker: dto.mainBreaker,
      groundingType: dto.groundingType ?? 'unknown',
      notes: dto.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.panels.push(panel);
    return panel;
  }

  listPanels(installationId: string): PanelRecord[] {
    this.assertInstallationExists(installationId);

    return this.panels.filter((x) => x.installationId === installationId);
  }

  createCircuit(panelId: string, dto: CreateCircuitDto): CircuitRecord {
    this.assertPanelExists(panelId);

    const timestamp = now();

    const circuit: CircuitRecord = {
      id: id('circuit'),
      panelId,
      circuitNo: dto.circuitNo,
      label: dto.label,
      breakerType: dto.breakerType,
      breakerAmps: dto.breakerAmps,
      breakerCurve: dto.breakerCurve,
      cableType: dto.cableType,
      cableMm2: dto.cableMm2,
      rcdGroup: dto.rcdGroup,
      room: dto.room,
      notes: dto.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.circuits.push(circuit);
    return circuit;
  }

  updateCircuit(id: string, dto: UpdateCircuitDto): CircuitRecord {
    const circuit = this.circuits.find((x) => x.id === id);

    if (!circuit) {
      throw new NotFoundException(`Circuit not found: ${id}`);
    }

    Object.assign(circuit, dto, { updatedAt: now() });
    return circuit;
  }

  deleteCircuit(id: string): { deleted: true } {
    const index = this.circuits.findIndex((x) => x.id === id);

    if (index === -1) {
      throw new NotFoundException(`Circuit not found: ${id}`);
    }

    this.circuits.splice(index, 1);
    return { deleted: true };
  }

  createServiceEntry(
    installationId: string,
    dto: CreateServiceEntryDto,
  ): ServiceEntryRecord {
    this.assertInstallationExists(installationId);

    const timestamp = now();

    const entry: ServiceEntryRecord = {
      id: id('svc'),
      installationId,
      type: dto.type,
      date: dto.date ?? timestamp,
      title: dto.title,
      notes: dto.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.serviceEntries.push(entry);
    return entry;
  }

  listServiceEntries(installationId: string): ServiceEntryRecord[] {
    this.assertInstallationExists(installationId);

    return this.serviceEntries
      .filter((x) => x.installationId === installationId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  private assertInstallationExists(id: string): void {
    if (!this.installations.some((x) => x.id === id)) {
      throw new NotFoundException(`Installation not found: ${id}`);
    }
  }

  private assertPanelExists(id: string): void {
    if (!this.panels.some((x) => x.id === id)) {
      throw new NotFoundException(`Panel not found: ${id}`);
    }
  }
}
