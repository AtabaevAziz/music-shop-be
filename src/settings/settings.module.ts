import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BusinessSettingsEntity } from '../database/entities';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([BusinessSettingsEntity])],
  controllers: [SettingsController],
  providers: [SettingsService]
})
export class SettingsModule {}
