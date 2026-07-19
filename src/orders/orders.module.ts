import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public-orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, CustomersModule],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
