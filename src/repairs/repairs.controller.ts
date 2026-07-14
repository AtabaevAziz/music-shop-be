import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RepairsService } from './repairs.service';
import { UpdateRepairDto } from './dto/update-repair.dto';

@Controller('repairs')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
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

  @Put(':id')
  async updateRepair(@Param('id') id: string, @Body() payload: UpdateRepairDto) {
    const repairRequest = await this.repairsService.updateRepair(id, payload);
    return { repairRequest };
  }
}
