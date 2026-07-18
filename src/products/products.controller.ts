import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listProducts(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string
  ) {
    return this.productsService.listProducts({ status, categoryId, brand, search });
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productsService.getProduct(id);
    return { product };
  }

  @Post()
  async createProduct(@Body() payload: CreateProductDto) {
    const product = await this.productsService.createProduct(payload);
    return { product };
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() payload: UpdateProductDto) {
    const product = await this.productsService.updateProduct(id, payload);
    return { product };
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteProduct(@Param('id') id: string): Promise<void> {
    await this.productsService.deleteProduct(id);
  }

  @Post(':id/images')
  async addImage(@Param('id') id: string, @Body() payload: ProductImageDto) {
    const product = await this.productsService.addImage(id, payload);
    return { product };
  }

  @Post(':id/primary-image')
  async setPrimaryImage(@Param('id') id: string, @Body() payload: ProductImageDto) {
    const product = await this.productsService.setPrimaryImage(id, payload);
    return { product };
  }
}
