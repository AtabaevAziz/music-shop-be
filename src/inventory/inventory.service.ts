import { Injectable } from '@nestjs/common';
import { InventoryMovement } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';

type InventoryMovementWire = {
  id: string;
  productId: string;
  delta: number;
  reason: string;
  createdAt: Date;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listMovements(productId?: string, limit?: number): Promise<InventoryMovementWire[]> {
    const items = await this.prisma.inventoryMovement.findMany({
      where: {
        ...(productId ? { productId } : {})
      },
      orderBy: [{ createdAt: 'desc' }],
      ...(limit ? { take: limit } : {})
    });

    return items.map((item) => this.toWire(item));
  }

  async adjustInventory(payload: InventoryAdjustmentDto): Promise<{
    product: { id: string; stockQty: number };
    movement: InventoryMovementWire;
  }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: payload.productId }
      });

      if (!product) {
        throw ApiException.validation('Product must exist.', 'productId');
      }

      const nextStockQty = product.stockQty + payload.delta;

      if (nextStockQty < 0) {
        throw ApiException.conflict('Inventory adjustment would produce negative stock.');
      }

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          stockQty: nextStockQty
        }
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          id: createId('movement'),
          productId: product.id,
          delta: payload.delta,
          reason: payload.reason.trim()
        }
      });

      await tx.activity.create({
        data: {
          id: createId('activity'),
          title: 'activity.inventoryAdjusted',
          messageKey: 'activity.inventoryAdjusted',
          messageParams: {
            productId: product.id,
            delta: payload.delta
          }
        }
      });

      return {
        product: {
          id: updatedProduct.id,
          stockQty: updatedProduct.stockQty
        },
        movement: this.toWire(movement)
      };
    });

    return result;
  }

  private toWire(item: InventoryMovement): InventoryMovementWire {
    return {
      id: item.id,
      productId: item.productId,
      delta: item.delta,
      reason: item.reason,
      createdAt: item.createdAt
    };
  }
}
