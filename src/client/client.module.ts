import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { RepairsModule } from '../repairs/repairs.module';
import { ClientController } from './client.controller';

@Module({
  imports: [AuthModule, CustomersModule, ProductsModule, OrdersModule, RepairsModule],
  controllers: [ClientController]
})
export class ClientModule {}

