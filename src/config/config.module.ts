import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSettingsEntity } from '../database/entities';
import { RuntimeConfigController } from './config.controller';
import { RuntimeConfigService } from './config.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessSettingsEntity])],
  controllers: [RuntimeConfigController],
  providers: [RuntimeConfigService]
})
export class ConfigRuntimeModule {}
