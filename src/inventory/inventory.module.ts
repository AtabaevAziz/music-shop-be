import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import {
  ActivityEntity,
  InventoryMovementEntity,
  ProductEntity,
} from "../database/entities";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      InventoryMovementEntity,
      ProductEntity,
      ActivityEntity,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
