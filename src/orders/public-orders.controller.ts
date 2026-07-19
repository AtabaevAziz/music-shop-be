import { Body, Controller, Post } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
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

    const order = await this.ordersService.createClientOrder(customer.id, {
      items: payload.items,
      notes: this.formatPublicOrderNotes(payload)
    });

    return { order };
  }

  private formatPublicOrderNotes(payload: CreatePublicOrderDto): string {
    const lines = [
      `Public checkout`,
      `Customer: ${payload.customerName.trim()}`,
      `Phone: ${payload.phone.trim()}`,
      payload.email?.trim() ? `Email: ${payload.email.trim().toLowerCase()}` : null,
      `Address: ${payload.address.trim()}`,
      `Payment: ${payload.paymentMethod.trim()}`,
      payload.comment?.trim() ? `Comment: ${payload.comment.trim()}` : null
    ].filter(Boolean);

    return lines.join('\n');
  }
}
