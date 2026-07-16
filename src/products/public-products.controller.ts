import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(@Query('search') search?: string) {
    const items = await this.productsService.listPublicProducts({ search });
    return { items };
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productsService.getPublicProduct(id);
    return { product };
  }
}
