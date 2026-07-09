import { Injectable } from '@nestjs/common';
import { Order, OrderItem, OrderStatus as PrismaOrderStatus, PaymentStatus as PrismaPaymentStatus } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { OrderStatus } from '../common/enums/order-status.enum';
import { ORDER_STATUS_TRANSITIONS } from '../common/constants/workflow.constants';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateClientOrderDto } from './dto/create-client-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type OrderItemWire = {
  productId: string;
  qty: number;
  unitPrice: number;
};

type OrderWire = {
  id: string;
  customerId: string;
  items: OrderItemWire[];
  paymentStatus: string;
  status: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

type OrderFilters = {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  limit?: number;
};

type OrderRecord = Order & {
  items: OrderItem[];
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(filters: OrderFilters = {}): Promise<OrderWire[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus as never } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {})
      },
      include: {
        items: true
      },
      orderBy: [{ createdAt: 'desc' }],
      ...(filters.limit ? { take: filters.limit } : {})
    });

    return orders.map((order) => this.toWire(order));
  }

  async updateOrderStatus(id: string, payload: UpdateOrderStatusDto): Promise<{
    id: string;
    status: string;
    updatedAt: Date;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });

      if (!order) {
        throw ApiException.notFound('Order was not found.');
      }

      const currentStatus = order.status as OrderStatus;
      const nextStatus = payload.status;
      const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];

      if (!allowedTransitions.includes(nextStatus)) {
        throw ApiException.invalidTransition('Order status transition is not allowed.');
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: nextStatus as PrismaOrderStatus
        }
      });

      await tx.activity.create({
        data: {
          id: createId('activity'),
          title: 'activity.orderMoved',
          messageKey: 'activity.orderMoved',
          messageParams: {
            orderId: updatedOrder.id,
            status: updatedOrder.status
          }
        }
      });

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      };
    });
  }

  async createClientOrder(customerId: string, payload: CreateClientOrderDto): Promise<OrderWire> {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw ApiException.notFound('Customer was not found.');
      }

      if (customer.status !== 'active') {
        throw ApiException.forbidden('Client is inactive.');
      }

      const requestedProductIds = payload.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: requestedProductIds }
        }
      });

      const productMap = new Map(products.map((product) => [product.id, product]));
      const stockDemand = new Map<string, number>();

      for (const item of payload.items) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw ApiException.validation('Product must exist.', 'items');
        }

        if (product.status !== 'active') {
          throw ApiException.conflict('Only active products can be ordered.');
        }

        stockDemand.set(item.productId, (stockDemand.get(item.productId) ?? 0) + item.qty);
      }

      for (const [productId, qty] of stockDemand.entries()) {
        const product = productMap.get(productId);

        if (!product || product.stockQty < qty) {
          throw ApiException.conflict('Insufficient stock for one or more products.');
        }
      }

      const orderCount = await tx.order.count();
      const orderId = `ORD-${1001 + orderCount}`;
      const createdAt = new Date();

      const order = await tx.order.create({
        data: {
          id: orderId,
          customerId,
          paymentStatus: PrismaPaymentStatus.pending,
          status: PrismaOrderStatus.new,
          notes: payload.notes.trim(),
          createdAt,
          updatedAt: createdAt,
          items: {
            create: payload.items.map((item) => {
              const product = productMap.get(item.productId);

              return {
                id: createId('order-item'),
                productId: item.productId,
                qty: item.qty,
                unitPrice: product?.price ?? item.unitPrice
              };
            })
          }
        },
        include: {
          items: true
        }
      });

      for (const [productId, qty] of stockDemand.entries()) {
        const product = productMap.get(productId);

        await tx.product.update({
          where: { id: productId },
          data: {
            stockQty: (product?.stockQty ?? 0) - qty
          }
        });

        await tx.inventoryMovement.create({
          data: {
            id: createId('movement'),
            productId,
            delta: -qty,
            reason: `Reserved for client order ${orderId}`,
            createdAt
          }
        });
      }

      await tx.activity.create({
        data: {
          id: createId('activity'),
          title: 'activity.orderCreated',
          messageKey: 'activity.orderCreated',
          messageParams: {
            orderId,
            customerId
          },
          timestamp: createdAt
        }
      });

      return this.toWire(order);
    });
  }

  private toWire(order: OrderRecord): OrderWire {
    return {
      id: order.id,
      customerId: order.customerId,
      items: order.items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice
      })),
      paymentStatus: order.paymentStatus,
      status: order.status,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

