import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffOnlyGuard } from '../auth/guards/staff-only.guard';
import { ActivityService } from './activity.service';

@Controller('activity')
@UseGuards(SessionAuthGuard, StaffOnlyGuard)
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

