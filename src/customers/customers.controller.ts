import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  listCustomers() {
    return this.customersService.listCustomers();
  }

  @Post()
  async createCustomer(@Body() payload: CreateCustomerDto) {
    const customer = await this.customersService.createCustomer(payload);
    return { customer };
  }

  @Put(':id')
  async updateCustomer(@Param('id') id: string, @Body() payload: UpdateCustomerDto) {
    const customer = await this.customersService.updateCustomer(id, payload);
    return { customer };
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteCustomer(@Param('id') id: string): Promise<void> {
    await this.customersService.deleteCustomer(id);
  }
}
