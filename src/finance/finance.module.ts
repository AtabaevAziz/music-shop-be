import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BusinessSettingsEntity, OrderEntity, OrderItemEntity, ProductEntity } from '../database/entities';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, ProductEntity, BusinessSettingsEntity])
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService]
})
export class FinanceModule {}
