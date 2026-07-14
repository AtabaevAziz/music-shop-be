import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandsService } from './brands.service';

@Controller('brands')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  listBrands() {
    return this.brandsService.listBrands();
  }

  @Post()
  async createBrand(@Body() payload: CreateBrandDto) {
    const brand = await this.brandsService.createBrand(payload);
    return { brand };
  }

  @Put(':id')
  async updateBrand(@Param('id') id: string, @Body() payload: UpdateBrandDto) {
    const brand = await this.brandsService.updateBrand(id, payload);
    return { brand };
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBrand(@Param('id') id: string): Promise<void> {
    await this.brandsService.deleteBrand(id);
  }
}
