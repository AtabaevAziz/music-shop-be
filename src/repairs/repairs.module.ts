import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { PublicRepairsController } from './public-repairs.controller';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';

@Module({
  imports: [AuthModule, CustomersModule],
  controllers: [RepairsController, PublicRepairsController],
  providers: [RepairsService],
  exports: [RepairsService]
})
export class RepairsModule {}
