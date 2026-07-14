import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  listCategories() {
    return this.categoriesService.listCategories();
  }

  @Post()
  async createCategory(@Body() payload: CreateCategoryDto) {
    const category = await this.categoriesService.createCategory(payload);
    return { category };
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() payload: UpdateCategoryDto) {
    const category = await this.categoriesService.updateCategory(id, payload);
    return { category };
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteCategory(@Param('id') id: string): Promise<void> {
    await this.categoriesService.deleteCategory(id);
  }
}
