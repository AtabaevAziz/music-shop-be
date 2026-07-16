import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PublicProductsController } from './public-products.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
