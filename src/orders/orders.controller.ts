import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffOnlyGuard } from '../auth/guards/staff-only.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(SessionAuthGuard, StaffOnlyGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('customerId') customerId?: string,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const items = await this.ordersService.listOrders({
      status,
      paymentStatus,
      customerId,
      limit: parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    });

    return { items };
  }

  @Post(':id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusDto) {
    const order = await this.ordersService.updateOrderStatus(id, payload);
    return { order };
  }
}

