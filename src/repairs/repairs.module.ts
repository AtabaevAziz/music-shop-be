import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { CustomersModule } from "../customers/customers.module";
import {
  ActivityEntity,
  CustomerEntity,
  RepairRequestEntity,
} from "../database/entities";
import { PublicRepairsController } from "./public-repairs.controller";
import { RepairsController } from "./repairs.controller";
import { RepairsService } from "./repairs.service";

@Module({
  imports: [
    AuthModule,
    CustomersModule,
    TypeOrmModule.forFeature([
      RepairRequestEntity,
      CustomerEntity,
      ActivityEntity,
    ]),
  ],
  controllers: [RepairsController, PublicRepairsController],
  providers: [RepairsService],
  exports: [RepairsService],
})
export class RepairsModule {}
