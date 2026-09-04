import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import {
  CategoryEntity,
  InventoryMovementEntity,
  OrderItemEntity,
  ProductEntity,
} from "../database/entities";
import { PublicProductsController } from "./public-products.controller";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      ProductEntity,
      CategoryEntity,
      InventoryMovementEntity,
      OrderItemEntity,
    ]),
  ],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
