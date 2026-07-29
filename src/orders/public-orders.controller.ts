import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { StubPaymentWebhookDto } from './dto/stub-payment-webhook.dto';
import { OrdersService } from './orders.service';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly ordersService: OrdersService
  ) {}

  @Post()
  async createOrder(@Body() payload: CreatePublicOrderDto) {
    const customer = await this.customersService.findOrCreatePublicCustomer({
      name: payload.customerName,
      phone: payload.phone,
      email: payload.email
    });

    const order = await this.ordersService.createPublicOrder({
      customerId: customer.id,
      customerName: payload.customerName,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      deliveryMethod: payload.deliveryMethod,
      deliveryCompany: payload.deliveryCompany,
      notes: payload.comment,
      items: payload.items,
    });

    return { order };
  }

  @Get(':orderNumber')
  async getOrder(
    @Param('orderNumber') orderNumber: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string
  ) {
    const order = await this.ordersService.getOrderByOrderNumber(orderNumber, {
      phone,
      email
    });
    return { order };
  }

  @Post(':id/payment-webhook')
  async processStubWebhook(@Param('id') id: string, @Body() payload: StubPaymentWebhookDto) {
    const order = await this.ordersService.handleStubPaymentWebhook(id, payload);
    return { order };
  }
}
