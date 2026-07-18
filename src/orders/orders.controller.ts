import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
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

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    const order = await this.ordersService.getOrderById(id);
    return { order };
  }

  @Post(':id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusDto) {
    const order = await this.ordersService.updateOrderStatus(id, payload);
    return { order };
  }
}
