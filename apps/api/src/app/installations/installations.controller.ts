import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InstallationsService } from './installations.service';
import type {
  CreateCircuitDto,
  CreateInstallationDto,
  CreatePanelDto,
  CreateServiceEntryDto,
  UpdateCircuitDto,
  UpdateInstallationDto,
} from './installations.dto';

@Controller('installations')
export class InstallationsController {
  constructor(private readonly installations: InstallationsService) {}

  @Post()
  createInstallation(@Body() dto: CreateInstallationDto) {
    return this.installations.createInstallation(dto);
  }

  @Get()
  listInstallations() {
    return this.installations.listInstallations();
  }

  @Get(':id')
  getInstallation(@Param('id') id: string) {
    return this.installations.getInstallation(id);
  }

  @Patch(':id')
  updateInstallation(
    @Param('id') id: string,
    @Body() dto: UpdateInstallationDto,
  ) {
    return this.installations.updateInstallation(id, dto);
  }

  @Post(':id/panels')
  createPanel(@Param('id') id: string, @Body() dto: CreatePanelDto) {
    return this.installations.createPanel(id, dto);
  }

  @Get(':id/panels')
  listPanels(@Param('id') id: string) {
    return this.installations.listPanels(id);
  }

  @Post(':id/service-entries')
  createServiceEntry(
    @Param('id') id: string,
    @Body() dto: CreateServiceEntryDto,
  ) {
    return this.installations.createServiceEntry(id, dto);
  }

  @Get(':id/service-entries')
  listServiceEntries(@Param('id') id: string) {
    return this.installations.listServiceEntries(id);
  }

  @Post('panels/:panelId/circuits')
  createCircuit(
    @Param('panelId') panelId: string,
    @Body() dto: CreateCircuitDto,
  ) {
    return this.installations.createCircuit(panelId, dto);
  }

  @Patch('circuits/:id')
  updateCircuit(@Param('id') id: string, @Body() dto: UpdateCircuitDto) {
    return this.installations.updateCircuit(id, dto);
  }

  @Delete('circuits/:id')
  deleteCircuit(@Param('id') id: string) {
    return this.installations.deleteCircuit(id);
  }
}
