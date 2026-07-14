import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { ActivityService } from './activity.service';

@Controller('activity')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async list(@Query('limit') limit?: string): Promise<{ items: Awaited<ReturnType<ActivityService['list']>> }> {
    const parsedLimit = limit ? Number(limit) : undefined;
    const items = await this.activityService.list(
      parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    );

    return { items };
  }
}
