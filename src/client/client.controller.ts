import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ClientOnlyGuard } from '../auth/guards/client-only.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RequestWithSession } from '../auth/interfaces/request-with-session.interface';
import { CustomersService } from '../customers/customers.service';
import { CreateClientOrderDto } from '../orders/dto/create-client-order.dto';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CreateClientRepairDto } from '../repairs/dto/create-client-repair.dto';
import { RepairsService } from '../repairs/repairs.service';

@Controller('client')
@UseGuards(SessionAuthGuard, ClientOnlyGuard)
export class ClientController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly repairsService: RepairsService
  ) {}

  @Get('me')
  async getMe(@Req() request: RequestWithSession) {
    const customer = await this.customersService.getCustomerById(request.currentSession!.customerId!);
    return { customer };
  }

  @Get('products')
  listProducts() {
    return this.productsService.listClientProducts();
  }

  @Get('orders')
  async listOrders(@Req() request: RequestWithSession) {
    const items = await this.ordersService.listOrders({
      customerId: request.currentSession!.customerId!
    });
    return { items };
  }

  @Post('orders')
  async createOrder(@Req() request: RequestWithSession, @Body() payload: CreateClientOrderDto) {
    const order = await this.ordersService.createClientOrder(request.currentSession!.customerId!, payload);
    return { order };
  }

  @Get('repairs')
  async listRepairs(@Req() request: RequestWithSession) {
    const items = await this.repairsService.listRepairs({
      customerId: request.currentSession!.customerId!
    });
    return { items };
  }

  @Post('repairs')
  async createRepair(@Req() request: RequestWithSession, @Body() payload: CreateClientRepairDto) {
    const repairRequest = await this.repairsService.createRepairForCustomer(
      request.currentSession!.customerId!,
      payload
    );
    return { repairRequest };
  }
}

