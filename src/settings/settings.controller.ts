import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(SessionAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<{ settings: Awaited<ReturnType<SettingsService['getSettings']>> }> {
    const settings = await this.settingsService.getSettings();
    return { settings };
  }

  @Put()
  @UseGuards(AdminOnlyGuard)
  async updateSettings(
    @Body() payload: UpdateSettingsDto
  ): Promise<{ settings: Awaited<ReturnType<SettingsService['updateSettings']>> }> {
    const settings = await this.settingsService.updateSettings(payload);
    return { settings };
  }
}
