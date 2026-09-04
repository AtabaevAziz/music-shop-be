import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { CustomersModule } from "../customers/customers.module";
import {
  ActivityEntity,
  CustomerEntity,
  DeliveryEntity,
  InventoryMovementEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatusHistoryEntity,
  PackagingDetailEntity,
  PaymentEntity,
  ProductEntity,
} from "../database/entities";
import { OrdersController } from "./orders.controller";
import { PublicOrdersController } from "./public-orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    AuthModule,
    CustomersModule,
    TypeOrmModule.forFeature([
      OrderEntity,
      CustomerEntity,
      ProductEntity,
      OrderItemEntity,
      PaymentEntity,
      DeliveryEntity,
      PackagingDetailEntity,
      OrderStatusHistoryEntity,
      InventoryMovementEntity,
      ActivityEntity,
    ]),
  ],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
