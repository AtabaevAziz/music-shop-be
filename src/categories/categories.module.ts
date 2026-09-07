import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { CategoryEntity, ProductEntity } from "../database/entities";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { PublicCategoriesController } from "./public-categories.controller";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([CategoryEntity, ProductEntity]),
  ],
  controllers: [CategoriesController, PublicCategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
