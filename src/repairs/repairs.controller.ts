import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffOnlyGuard } from '../auth/guards/staff-only.guard';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RepairsService } from './repairs.service';

@Controller('repairs')
@UseGuards(SessionAuthGuard, StaffOnlyGuard)
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Get()
  async listRepairs(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const items = await this.repairsService.listRepairs({
      status,
      customerId,
      limit: parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    });

    return { items };
  }

  @Post()
  async createRepair(@Body() payload: CreateRepairDto) {
    const repairRequest = await this.repairsService.createRepair(payload);
    return { repairRequest };
  }
}

