import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { RequestWithSession } from '../auth/interfaces/request-with-session.interface';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
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
    @Query('search') search?: string,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const items = await this.ordersService.listOrders({
      status,
      paymentStatus,
      customerId,
      search,
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
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() payload: UpdateOrderStatusDto,
    @Req() request: RequestWithSession
  ) {
    const order = await this.ordersService.updateOrderStatus(id, payload, {
      employeeId: request.currentSession?.employeeId
    });
    return { order };
  }

  @Post(':id/payment-status')
  async updateOrderPaymentStatus(
    @Param('id') id: string,
    @Body() payload: UpdateOrderPaymentDto,
    @Req() request: RequestWithSession
  ) {
    const order = await this.ordersService.updateOrderPayment(id, payload, {
      employeeId: request.currentSession?.employeeId
    });
    return { order };
  }
}
