import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffOnlyGuard } from '../auth/guards/staff-only.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(SessionAuthGuard, StaffOnlyGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<{ settings: Awaited<ReturnType<SettingsService['getSettings']>> }> {
    const settings = await this.settingsService.getSettings();
    return { settings };
  }

  @Put()
  async updateSettings(
    @Body() payload: UpdateSettingsDto
  ): Promise<{ settings: Awaited<ReturnType<SettingsService['updateSettings']>> }> {
    const settings = await this.settingsService.updateSettings(payload);
    return { settings };
  }
}

