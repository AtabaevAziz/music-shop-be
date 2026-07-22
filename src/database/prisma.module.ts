import { Global, Module } from '@nestjs/common';
import { MockDataBootstrapService } from './mock-data-bootstrap.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, MockDataBootstrapService],
  exports: [PrismaService]
})
export class PrismaModule {}
