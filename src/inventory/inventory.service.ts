import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ApiException } from "../common/exceptions/api.exception";
import { createId } from "../common/utils/id.util";
import {
  ActivityEntity,
  InventoryMovementEntity,
  ProductEntity,
} from "../database/entities";
import { InventoryAdjustmentDto } from "./dto/inventory-adjustment.dto";

type InventoryMovementWire = {
  id: string;
  productId: string;
  delta: number;
  reason: string;
  createdAt: Date;
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(InventoryMovementEntity)
    private readonly inventoryMovementRepository: Repository<InventoryMovementEntity>,
  ) {}

  async listMovements(
    productId?: string,
    limit?: number,
  ): Promise<InventoryMovementWire[]> {
    const items = await this.inventoryMovementRepository.find({
      where: {
        ...(productId ? { productId } : {}),
      },
      order: { createdAt: "DESC" },
      ...(limit ? { take: limit } : {}),
    });

    return items.map((item) => this.toWire(item));
  }

  async adjustInventory(payload: InventoryAdjustmentDto): Promise<{
    product: { id: string; stockQty: number };
    movement: InventoryMovementWire;
  }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(ProductEntity);
      const movementRepository = manager.getRepository(InventoryMovementEntity);
      const activityRepository = manager.getRepository(ActivityEntity);
      const product = await productRepository.findOneBy({
        id: payload.productId,
      });

      if (!product) {
        throw ApiException.validation("Product must exist.", "productId");
      }

      const nextStockQty = product.stockQty + payload.delta;

      if (nextStockQty < 0) {
        throw ApiException.conflict(
          "Inventory adjustment would produce negative stock.",
        );
      }

      const updatedProduct = await productRepository.save({
        ...product,
        stockQty: nextStockQty,
      });

      const movement = await movementRepository.save(
        movementRepository.create({
          id: createId("movement"),
          productId: product.id,
          delta: payload.delta,
          reason: payload.reason.trim(),
        }),
      );

      await activityRepository.save(
        activityRepository.create({
          id: createId("activity"),
          title: "activity.inventoryAdjusted",
          messageKey: "activity.inventoryAdjusted",
          messageParams: {
            productId: product.id,
            delta: payload.delta,
          },
        }),
      );

      return {
        product: {
          id: updatedProduct.id,
          stockQty: updatedProduct.stockQty,
        },
        movement: this.toWire(movement),
      };
    });

    return result;
  }

  private toWire(item: InventoryMovementEntity): InventoryMovementWire {
    return {
      id: item.id,
      productId: item.productId,
      delta: item.delta,
      reason: item.reason,
      createdAt: item.createdAt,
    };
  }
}
