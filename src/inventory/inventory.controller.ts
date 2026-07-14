import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('movements')
  async listMovements(@Query('productId') productId?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const items = await this.inventoryService.listMovements(
      productId,
      parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    );
    return { items };
  }

  @Post('adjustments')
  async adjustInventory(@Body() payload: InventoryAdjustmentDto) {
    return this.inventoryService.adjustInventory(payload);
  }
}
