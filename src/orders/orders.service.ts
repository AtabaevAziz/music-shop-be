import { Injectable } from '@nestjs/common';
import {
  ActorType,
  DeliveryStatus as PrismaDeliveryStatus,
  InventoryMovementType,
  OrderStatus as PrismaOrderStatus,
  PackagingStatus as PrismaPackagingStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
  Product
} from '@prisma/client';
import { DeliveryMethod } from '../common/enums/delivery-method.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { ApiException } from '../common/exceptions/api.exception';
import { ORDER_STATUS_TRANSITIONS } from '../common/constants/workflow.constants';
import { createId } from '../common/utils/id.util';
import { getNextSequentialPrefixedId } from '../common/utils/sequential-id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateClientOrderDto } from './dto/create-client-order.dto';
import { StubPaymentWebhookDto } from './dto/stub-payment-webhook.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type OrderFilters = {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  search?: string;
  limit?: number;
};

type CheckoutItemInput = CreateClientOrderDto['items'][number];

type OrderRecord = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payments: true;
    delivery: true;
    packaging: true;
    statusHistory: {
      orderBy: {
        changedAt: 'asc';
      };
    };
  };
}>;

type OrderContactSnapshot = {
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string | null;
};

type OrderAddressSnapshot = {
  country: string;
  region: string;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  postalCode: string;
  formatted: string;
};

type PackagingMeta = {
  comment: string | null;
  serialNumbers: string | null;
  warehouseIssueType: string | null;
};

type OrderStage =
  | 'intake'
  | 'payment'
  | 'warehouse'
  | 'packing'
  | 'shipment'
  | 'completed'
  | 'exception';

type CreateCheckoutPayload = {
  customerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  country: string;
  region: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  deliveryCompany?: string;
  notes?: string;
  items: CreateClientOrderDto['items'];
};

type OrderWire = {
  id: string;
  orderNumber: string;
  customerId: string;
  stage: OrderStage;
  availableTransitions: string[];
  customer: OrderContactSnapshot;
  address: OrderAddressSnapshot;
  items: Array<{
    productId: string;
    productName: string;
    qty: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  paymentMethod: string;
  paymentStatus: string;
  payment: {
    method: string;
    status: string;
    amount: number;
    transactionId: string | null;
    paidAt: Date | null;
  } | null;
  deliveryMethod: string;
  deliveryStatus: string | null;
  delivery: {
    method: string;
    company: string | null;
    address: string;
    addressSnapshot: OrderAddressSnapshot;
    trackingNumber: string | null;
    shippingCost: number;
    status: string;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  packaging: {
    status: string;
    fragile: boolean;
    packageType: string | null;
    dimensions: string | null;
    weightGrams: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    comment: string | null;
    serialNumbers: string | null;
    warehouseIssueType: string | null;
    packedAt: Date | null;
    employeeId: string | null;
  } | null;
  warehouseIssue: {
    type: string;
    comment: string | null;
  } | null;
  status: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  notes: string;
  statusHistory: Array<{
    oldStatus: string | null;
    newStatus: string;
    changedByType: string;
    changedById: string | null;
    comment: string | null;
    changedAt: Date;
  }>;
  timeline: Array<{
    type: 'status' | 'payment' | 'delivery';
    status: string;
    happenedAt: Date;
    comment: string | null;
    actorType: string | null;
    actorId: string | null;
  }>;
  paymentRedirectUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentStatusUpdateContext = {
  changedByType?: ActorType;
  changedById?: string;
  comment?: string;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(filters: OrderFilters = {}): Promise<OrderWire[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(filters.status ? { status: filters.status as PrismaOrderStatus } : {}),
        ...(filters.paymentStatus
          ? { paymentStatus: filters.paymentStatus as PrismaPaymentStatus }
          : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.search
          ? {
              OR: [
                { orderNumber: { contains: filters.search, mode: 'insensitive' } },
                { customerNameSnapshot: { contains: filters.search, mode: 'insensitive' } },
                { phoneSnapshot: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      include: this.orderInclude,
      orderBy: [{ createdAt: 'desc' }],
      ...(filters.limit ? { take: filters.limit } : {})
    });

    return orders.map((order) => this.toWire(order));
  }

  async getOrderById(id: string): Promise<OrderWire> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude
    });

    if (!order) {
      throw ApiException.notFound('Order was not found.');
    }

    return this.toWire(order);
  }

  async getOrderByOrderNumber(orderNumber: string, verifier?: { phone?: string; email?: string }): Promise<OrderWire> {
    const phone = verifier?.phone?.trim();
    const email = verifier?.email?.trim().toLowerCase();

    if (!phone && !email) {
      throw ApiException.validation('Phone or email is required to verify the order.', 'phone');
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: this.orderInclude
    });

    if (!order) {
      throw ApiException.notFound('Order was not found.');
    }

    if (phone && order.phoneSnapshot !== phone) {
      throw ApiException.forbidden('Order verification failed.');
    }

    if (email && order.emailSnapshot !== email) {
      throw ApiException.forbidden('Order verification failed.');
    }

    return this.toWire(order);
  }

  async createClientOrder(customerId: string, payload: CreateClientOrderDto): Promise<OrderWire> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw ApiException.notFound('Customer was not found.');
    }

    if (customer.status !== 'active') {
      throw ApiException.forbidden('Client is inactive.');
    }

    return this.createCheckoutOrder({
      customerId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      email: payload.email,
      country: payload.country,
      region: payload.region,
      city: payload.city,
      street: payload.street,
      house: payload.house,
      apartment: payload.apartment,
      postalCode: payload.postalCode,
      paymentMethod: payload.paymentMethod,
      deliveryMethod: payload.deliveryMethod,
      deliveryCompany: payload.deliveryCompany,
      notes: payload.comment,
      items: payload.items
    });
  }

  async createPublicOrder(payload: CreateCheckoutPayload): Promise<OrderWire> {
    return this.createCheckoutOrder(payload);
  }

  async updateOrderStatus(id: string, payload: UpdateOrderStatusDto, actor?: { employeeId?: string }): Promise<OrderWire> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: this.orderInclude
      });

      if (!order) {
        throw ApiException.notFound('Order was not found.');
      }

      const currentStatus = order.status as OrderStatus;
      const nextStatus = payload.status;
      const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];

      if (!allowedTransitions.includes(nextStatus)) {
        throw ApiException.invalidTransition('Order status transition is not allowed.');
      }

      await this.applyOrderStatusSideEffects(tx, order, nextStatus, payload, {
        changedById: actor?.employeeId
      });

      const updatedOrder = await tx.order.findUnique({
        where: { id },
        include: this.orderInclude
      });

      if (!updatedOrder) {
        throw ApiException.notFound('Order was not found after update.');
      }

      return this.toWire(updatedOrder);
    });
  }

  async updateOrderPayment(id: string, payload: UpdateOrderPaymentDto, actor?: { employeeId?: string }): Promise<OrderWire> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: this.orderInclude
      });

      if (!order) {
        throw ApiException.notFound('Order was not found.');
      }

      await this.applyPaymentStatusUpdate(tx, order, payload.paymentStatus as PrismaPaymentStatus, {
        changedByType: ActorType.employee,
        changedById: actor?.employeeId,
        comment: payload.comment
      }, {
        provider: payload.provider,
        transactionId: payload.transactionId
      });

      const updatedOrder = await tx.order.findUnique({
        where: { id },
        include: this.orderInclude
      });

      if (!updatedOrder) {
        throw ApiException.notFound('Order was not found after update.');
      }

      return this.toWire(updatedOrder);
    });
  }

  async handleStubPaymentWebhook(orderId: string, payload: StubPaymentWebhookDto): Promise<OrderWire> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: this.orderInclude
      });

      if (!order) {
        throw ApiException.notFound('Order was not found.');
      }

      await this.applyPaymentStatusUpdate(tx, order, payload.paymentStatus as PrismaPaymentStatus, {
        changedByType: ActorType.system,
        comment: 'Stub payment gateway callback'
      }, {
        provider: 'stub-gateway',
        transactionId: payload.transactionId ?? `stub-${Date.now()}`
      });

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: this.orderInclude
      });

      if (!updatedOrder) {
        throw ApiException.notFound('Order was not found after webhook update.');
      }

      return this.toWire(updatedOrder);
    });
  }

  private async createCheckoutOrder(payload: CreateCheckoutPayload): Promise<OrderWire> {
    return this.prisma.$transaction(async (tx) => {
      this.validateDeliverySelection(payload);
      const products = await this.loadProductsForCheckout(tx, payload.items);
      const stockDemand = this.getStockDemand(payload.items);

      for (const [productId, requestedQty] of stockDemand.entries()) {
        const product = products.get(productId);
        const availableQty = (product?.stockQty ?? 0) - (product?.reservedQty ?? 0);

        if (!product || availableQty < requestedQty) {
          throw ApiException.conflict(`Only ${Math.max(availableQty, 0)} item(s) available for ${product?.name ?? productId}.`);
        }
      }

      const subtotal = payload.items.reduce((sum, item) => {
        const product = products.get(item.productId)!;
        return sum + product.price * this.getItemQuantity(item);
      }, 0);
      const deliveryCost = this.resolveDeliveryCost(payload.deliveryMethod);
      const total = subtotal + deliveryCost;
      const createdAt = new Date();
      const orderNumber = await this.allocateOrderNumber(tx);
      const contactSnapshot = this.buildContactSnapshot(payload);
      const addressSnapshot = this.buildAddressSnapshot(payload);

      const order = await tx.order.create({
        data: {
          id: createId('order'),
          orderNumber,
          customerId: payload.customerId,
          customerNameSnapshot: contactSnapshot.name,
          phoneSnapshot: contactSnapshot.phone,
          emailSnapshot: contactSnapshot.email,
          deliveryAddressSnapshot: this.serializeAddressSnapshot(addressSnapshot),
          paymentMethod: payload.paymentMethod as never,
          paymentStatus: PrismaPaymentStatus.pending,
          deliveryMethod: payload.deliveryMethod as never,
          status: PrismaOrderStatus.new,
          notes: payload.notes?.trim() ?? '',
          subtotal,
          deliveryCost,
          total,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: payload.items.map((item) => {
              const product = products.get(item.productId)!;
              const quantity = this.getItemQuantity(item);
              return {
                id: createId('order-item'),
                productId: product.id,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                totalPrice: product.price * quantity
              };
            })
          },
          payments: {
            create: {
              id: createId('payment'),
              method: payload.paymentMethod as never,
              status: PrismaPaymentStatus.pending,
              amount: total,
              provider: payload.paymentMethod === PaymentMethod.Online ? 'stub-gateway' : null,
              createdAt,
              updatedAt: createdAt
            }
          },
          delivery: {
            create: {
              id: createId('delivery'),
              method: payload.deliveryMethod as never,
              company: payload.deliveryCompany?.trim() ?? null,
              address: addressSnapshot.formatted,
              shippingCost: deliveryCost,
              status: PrismaDeliveryStatus.not_ready,
              createdAt,
              updatedAt: createdAt
            }
          },
          packaging: {
            create: {
              id: createId('packaging'),
              status: PrismaPackagingStatus.not_started,
              fragile: false,
              createdAt,
              updatedAt: createdAt
            }
          },
          statusHistory: {
            create: {
              id: createId('status-history'),
              oldStatus: null,
              newStatus: PrismaOrderStatus.new,
              changedByType: ActorType.system,
              comment: 'Order created',
              changedAt: createdAt
            }
          }
        },
        include: this.orderInclude
      });

      await Promise.all(
        [...stockDemand.entries()].map(async ([productId, qty]) => {
          const product = products.get(productId)!;

          await tx.product.update({
            where: { id: productId },
            data: {
              reservedQty: product.reservedQty + qty
            }
          });

          await tx.inventoryMovement.create({
            data: {
              id: createId('movement'),
              productId,
              delta: 0,
              type: InventoryMovementType.reserve,
              reason: `Reserved ${qty} item(s) for order ${order.orderNumber}`,
              referenceType: 'order',
              referenceId: order.id,
              createdAt
            }
          });
        })
      );

      await this.recordActivity(tx, 'activity.orderCreated', {
        orderNumber: order.orderNumber,
        customerId: payload.customerId
      }, createdAt);

      return this.toWire(order);
    });
  }

  private async applyOrderStatusSideEffects(
    tx: Prisma.TransactionClient,
    order: OrderRecord,
    nextStatus: OrderStatus,
    payload: UpdateOrderStatusDto,
    actor?: { changedById?: string }
  ): Promise<void> {
    const now = new Date();
    const packagingMeta = this.mergePackagingMeta(order.packaging?.comment ?? null, payload);
    const dimensionValue = this.buildDimensionsValue(payload, order.packaging?.dimensions ?? null);
    const carrier = payload.carrier?.trim() || payload.deliveryCompany?.trim() || order.delivery?.company || null;

    if (nextStatus === OrderStatus.Cancelled) {
      await this.releaseReservations(tx, order, `Order ${order.orderNumber} cancelled`, now);
      await this.applyPaymentStatusUpdate(
        tx,
        order,
        order.paymentStatus === PrismaPaymentStatus.paid ? PrismaPaymentStatus.refunded : PrismaPaymentStatus.cancelled,
        {
          changedByType: ActorType.employee,
          changedById: actor?.changedById,
          comment: payload.comment ?? 'Order cancelled'
        },
        {},
        true
      );
    }

    if ([OrderStatus.Picking, OrderStatus.Packing].includes(nextStatus)) {
      await tx.packagingDetail.update({
        where: { orderId: order.id },
        data: {
          status: PrismaPackagingStatus.in_progress,
          updatedAt: now
        }
      });
    }

    if (nextStatus === OrderStatus.Packed) {
      await tx.packagingDetail.update({
        where: { orderId: order.id },
        data: {
          status: PrismaPackagingStatus.packed,
          fragile: payload.fragile ?? order.packaging?.fragile ?? false,
          packageType: payload.packageType ?? order.packaging?.packageType ?? null,
          dimensions: dimensionValue,
          weightGrams: payload.weightGrams ?? order.packaging?.weightGrams ?? null,
          comment: this.serializePackagingMeta(packagingMeta),
          packedAt: now,
          employeeId: actor?.changedById,
          updatedAt: now
        }
      });
    }

    if (nextStatus === OrderStatus.ReadyForShipment) {
      await tx.packagingDetail.update({
        where: { orderId: order.id },
        data: {
          status: PrismaPackagingStatus.ready_for_shipment,
          fragile: payload.fragile ?? order.packaging?.fragile ?? false,
          packageType: payload.packageType ?? order.packaging?.packageType ?? null,
          dimensions: dimensionValue,
          weightGrams: payload.weightGrams ?? order.packaging?.weightGrams ?? null,
          comment: this.serializePackagingMeta(packagingMeta),
          packedAt: order.packaging?.packedAt ?? now,
          employeeId: actor?.changedById ?? order.packaging?.employeeId ?? null,
          updatedAt: now
        }
      });

      await tx.delivery.update({
        where: { orderId: order.id },
        data: {
          company: carrier,
          status: PrismaDeliveryStatus.ready_for_shipment,
          updatedAt: now
        }
      });
    }

    if (nextStatus === OrderStatus.StockProblem) {
      await tx.packagingDetail.update({
        where: { orderId: order.id },
        data: {
          comment: this.serializePackagingMeta(packagingMeta),
          updatedAt: now
        }
      });

      await this.recordActivity(
        tx,
        'activity.orderStockProblem',
        {
          orderNumber: order.orderNumber,
          issueType: payload.warehouseIssueType?.trim() || 'UNKNOWN'
        },
        now
      );
    }

    if (nextStatus === OrderStatus.Shipped) {
      if (!payload.trackingNumber) {
        throw ApiException.validation('Tracking number is required before shipping.', 'trackingNumber');
      }

      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product || product.reservedQty < item.quantity || product.stockQty < item.quantity) {
          throw ApiException.conflict('Reserved stock is inconsistent for shipment.');
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: product.stockQty - item.quantity,
            reservedQty: product.reservedQty - item.quantity
          }
        });

        await tx.inventoryMovement.create({
          data: {
            id: createId('movement'),
            productId: item.productId,
            delta: -item.quantity,
            type: InventoryMovementType.ship,
            reason: `Shipped ${item.quantity} item(s) for order ${order.orderNumber}`,
            referenceType: 'order',
            referenceId: order.id,
            createdAt: now
          }
        });
      }

      await tx.delivery.update({
        where: { orderId: order.id },
        data: {
          company: carrier,
          trackingNumber: payload.trackingNumber.trim(),
          status: PrismaDeliveryStatus.shipped,
          shippedAt: now,
          updatedAt: now
        }
      });
    }

    if (nextStatus === OrderStatus.Delivered) {
      await tx.delivery.update({
        where: { orderId: order.id },
        data: {
          status: PrismaDeliveryStatus.delivered,
          deliveredAt: now,
          updatedAt: now
        }
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus as PrismaOrderStatus,
        confirmedAt: nextStatus === OrderStatus.Confirmed ? now : order.confirmedAt,
        packedAt: nextStatus === OrderStatus.Packed ? now : order.packedAt,
        shippedAt: nextStatus === OrderStatus.Shipped ? now : order.shippedAt,
        deliveredAt: nextStatus === OrderStatus.Delivered ? now : order.deliveredAt,
        cancelledAt: nextStatus === OrderStatus.Cancelled ? now : order.cancelledAt,
        updatedAt: now
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        id: createId('status-history'),
        orderId: order.id,
        oldStatus: order.status,
        newStatus: nextStatus as PrismaOrderStatus,
        changedByType: actor?.changedById ? ActorType.employee : ActorType.system,
        changedById: actor?.changedById,
        comment: payload.comment?.trim() || null,
        changedAt: now
      }
    });

    await this.recordActivity(
      tx,
      'activity.orderMoved',
      {
        orderNumber: order.orderNumber,
        status: nextStatus
      },
      now
    );
  }

  private async applyPaymentStatusUpdate(
    tx: Prisma.TransactionClient,
    order: OrderRecord,
    paymentStatus: PrismaPaymentStatus,
    context: PaymentStatusUpdateContext,
    details: { provider?: string; transactionId?: string },
    suppressReservationRelease = false
  ): Promise<void> {
    const payment = order.payments[0];

    if (!payment) {
      throw ApiException.notFound('Payment record was not found.');
    }

    const now = new Date();

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        provider: details.provider ?? payment.provider,
        transactionId: details.transactionId ?? payment.transactionId,
        paidAt: paymentStatus === PrismaPaymentStatus.paid ? now : payment.paidAt,
        updatedAt: now
      }
    });

    const orderUpdateData: Prisma.OrderUpdateInput = {
      paymentStatus,
      updatedAt: now
    };

    const shouldCancelOrder =
      paymentStatus === PrismaPaymentStatus.failed
      || paymentStatus === PrismaPaymentStatus.cancelled
      || paymentStatus === PrismaPaymentStatus.refunded;
    const isTerminalOrderStatus =
      order.status === PrismaOrderStatus.cancelled
      || order.status === PrismaOrderStatus.shipped
      || order.status === PrismaOrderStatus.delivered;

    if (
      shouldCancelOrder
      && !isTerminalOrderStatus
    ) {
      orderUpdateData.status = PrismaOrderStatus.cancelled;
      orderUpdateData.cancelledAt = now;

      if (!suppressReservationRelease) {
        await this.releaseReservations(tx, order, `Payment ${paymentStatus} for order ${order.orderNumber}`, now);
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: orderUpdateData
    });

    if (order.status !== orderUpdateData.status && orderUpdateData.status) {
      await tx.orderStatusHistory.create({
        data: {
          id: createId('status-history'),
          orderId: order.id,
          oldStatus: order.status,
          newStatus: orderUpdateData.status as PrismaOrderStatus,
          changedByType: context.changedByType ?? ActorType.system,
          changedById: context.changedById ?? null,
          comment: context.comment ?? `Payment moved to ${paymentStatus}`,
          changedAt: now
        }
      });
    }

    await this.recordActivity(
      tx,
      paymentStatus === PrismaPaymentStatus.paid ? 'activity.paymentPaid' : 'activity.paymentUpdated',
      {
        orderNumber: order.orderNumber,
        paymentStatus
      },
      now
    );
  }

  private async releaseReservations(
    tx: Prisma.TransactionClient,
    order: OrderRecord,
    reason: string,
    createdAt: Date
  ): Promise<void> {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });

      if (!product || product.reservedQty < item.quantity) {
        continue;
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          reservedQty: product.reservedQty - item.quantity
        }
      });

      await tx.inventoryMovement.create({
        data: {
          id: createId('movement'),
          productId: item.productId,
          delta: 0,
          type: InventoryMovementType.release,
          reason,
          referenceType: 'order',
          referenceId: order.id,
          createdAt
        }
      });
    }
  }

  private async loadProductsForCheckout(
    tx: Prisma.TransactionClient,
    items: CreateClientOrderDto['items']
  ): Promise<Map<string, Product>> {
    const requestedProductIds = [...new Set(items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: {
        id: { in: requestedProductIds }
      }
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw ApiException.validation('Product must exist.', 'items');
      }

      if (product.status !== 'active') {
        throw ApiException.conflict('Only active products can be ordered.');
      }

      if (this.getItemQuantity(item) < 1) {
        throw ApiException.validation('Quantity must be greater than zero.', 'items');
      }
    }

    return productMap;
  }

  private getStockDemand(items: CreateClientOrderDto['items']) {
    const stockDemand = new Map<string, number>();

    for (const item of items) {
      const quantity = this.getItemQuantity(item);
      stockDemand.set(item.productId, (stockDemand.get(item.productId) ?? 0) + quantity);
    }

    return stockDemand;
  }

  private getItemQuantity(item: CheckoutItemInput) {
    return item.quantity ?? item.qty ?? 0;
  }

  private resolveDeliveryCost(method: DeliveryMethod): number {
    switch (method) {
      case DeliveryMethod.Pickup:
        return 0;
      case DeliveryMethod.Courier:
        return 50_000;
      case DeliveryMethod.Post:
        return 70_000;
      case DeliveryMethod.DeliveryCompany:
        return 90_000;
      default:
        return 0;
    }
  }

  private validateDeliverySelection(payload: CreateCheckoutPayload) {
    if (
      payload.deliveryMethod === DeliveryMethod.DeliveryCompany
      && !payload.deliveryCompany?.trim()
    ) {
      throw ApiException.validation('Delivery company is required for the selected delivery method.', 'deliveryCompany');
    }
  }

  private buildContactSnapshot(payload: CreateCheckoutPayload): OrderContactSnapshot {
    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    return {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim().toLowerCase() ?? null
    };
  }

  private buildAddressSnapshot(payload: CreateCheckoutPayload): OrderAddressSnapshot {
    const address = {
      country: payload.country.trim(),
      region: payload.region.trim(),
      city: payload.city.trim(),
      street: payload.street.trim(),
      house: payload.house.trim(),
      apartment: payload.apartment?.trim() || null,
      postalCode: payload.postalCode.trim(),
      formatted: ''
    };

    address.formatted = [
      address.country,
      address.region,
      address.city,
      `${address.street} ${address.house}`.trim(),
      address.apartment ? `apt. ${address.apartment}` : null,
      address.postalCode
    ]
      .filter(Boolean)
      .join(', ');

    return address;
  }

  private serializeAddressSnapshot(address: OrderAddressSnapshot) {
    return JSON.stringify(address);
  }

  private parseAddressSnapshot(raw: string): OrderAddressSnapshot {
    try {
      const parsed = JSON.parse(raw) as Partial<OrderAddressSnapshot>;
      if (parsed && typeof parsed === 'object' && typeof parsed.formatted === 'string') {
        return {
          country: parsed.country ?? '',
          region: parsed.region ?? '',
          city: parsed.city ?? '',
          street: parsed.street ?? '',
          house: parsed.house ?? '',
          apartment: parsed.apartment ?? null,
          postalCode: parsed.postalCode ?? '',
          formatted: parsed.formatted
        };
      }
    } catch {}

    return {
      country: '',
      region: '',
      city: '',
      street: '',
      house: '',
      apartment: null,
      postalCode: '',
      formatted: raw
    };
  }

  private parseContactSnapshot(order: OrderRecord): OrderContactSnapshot {
    const name = order.customerNameSnapshot.trim();
    const [firstName = name, ...rest] = name.split(' ').filter(Boolean);
    return {
      firstName,
      lastName: rest.join(' '),
      name,
      phone: order.phoneSnapshot,
      email: order.emailSnapshot
    };
  }

  private parsePackagingMeta(raw: string | null): PackagingMeta {
    if (!raw) {
      return {
        comment: null,
        serialNumbers: null,
        warehouseIssueType: null
      };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PackagingMeta>;
      if (parsed && typeof parsed === 'object') {
        return {
          comment: parsed.comment ?? null,
          serialNumbers: parsed.serialNumbers ?? null,
          warehouseIssueType: parsed.warehouseIssueType ?? null
        };
      }
    } catch {}

    return {
      comment: raw,
      serialNumbers: null,
      warehouseIssueType: null
    };
  }

  private serializePackagingMeta(meta: PackagingMeta) {
    return JSON.stringify(meta);
  }

  private mergePackagingMeta(raw: string | null, payload: UpdateOrderStatusDto): PackagingMeta {
    const current = this.parsePackagingMeta(raw);
    return {
      comment: payload.packagingComment?.trim() || payload.comment?.trim() || current.comment,
      serialNumbers: payload.serialNumbers?.trim() || current.serialNumbers,
      warehouseIssueType: payload.warehouseIssueType?.trim() || current.warehouseIssueType
    };
  }

  private buildDimensionsValue(payload: UpdateOrderStatusDto, current: string | null) {
    if (
      payload.lengthCm === undefined
      && payload.widthCm === undefined
      && payload.heightCm === undefined
    ) {
      return current;
    }

    const length = payload.lengthCm ?? 0;
    const width = payload.widthCm ?? 0;
    const height = payload.heightCm ?? 0;
    return `${length}x${width}x${height}`;
  }

  private parseDimensions(dimensions: string | null) {
    if (!dimensions) {
      return {
        lengthCm: null,
        widthCm: null,
        heightCm: null
      };
    }

    const [length, width, height] = dimensions.split('x').map((value) => Number(value));
    return {
      lengthCm: Number.isFinite(length) ? length : null,
      widthCm: Number.isFinite(width) ? width : null,
      heightCm: Number.isFinite(height) ? height : null
    };
  }

  private findWarehouseIssue(order: OrderRecord, packagingMeta: PackagingMeta) {
    const issueType = packagingMeta.warehouseIssueType;
    if (!issueType && order.status !== PrismaOrderStatus.stock_problem) {
      return null;
    }

    const historyEntry = [...order.statusHistory]
      .reverse()
      .find((entry) => entry.newStatus === PrismaOrderStatus.stock_problem);

    return {
      type: issueType ?? 'UNKNOWN',
      comment: historyEntry?.comment ?? packagingMeta.comment
    };
  }

  private async allocateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existingOrderNumbers = await tx.order.findMany({
        where: { orderNumber: { startsWith: 'ORD-' } },
        select: { orderNumber: true }
      });

      const orderNumber = getNextSequentialPrefixedId(
        existingOrderNumbers.map((item) => item.orderNumber),
        'ORD',
        1001
      );

      const existing = await tx.order.findUnique({ where: { orderNumber } });

      if (!existing) {
        return orderNumber;
      }
    }

    throw ApiException.conflict('Could not allocate a new order number. Please retry.');
  }

  private async recordActivity(
    tx: Prisma.TransactionClient,
    title: string,
    messageParams: Record<string, string | number>,
    timestamp = new Date()
  ) {
    await tx.activity.create({
      data: {
        id: createId('activity'),
        title,
        messageKey: title,
        messageParams,
        timestamp
      }
    });
  }

  private getOrderStage(order: OrderRecord): OrderStage {
    if (
      order.status === PrismaOrderStatus.cancelled
      || order.status === PrismaOrderStatus.returned
      || order.status === PrismaOrderStatus.stock_problem
      || order.paymentStatus === PrismaPaymentStatus.failed
      || order.paymentStatus === PrismaPaymentStatus.cancelled
      || order.paymentStatus === PrismaPaymentStatus.refunded
    ) {
      return 'exception';
    }

    switch (order.status) {
      case PrismaOrderStatus.new:
        return 'intake';
      case PrismaOrderStatus.confirmed:
        return 'payment';
      case PrismaOrderStatus.sent_to_warehouse:
      case PrismaOrderStatus.picking:
      case PrismaOrderStatus.picked:
        return 'warehouse';
      case PrismaOrderStatus.packing:
      case PrismaOrderStatus.packed:
        return 'packing';
      case PrismaOrderStatus.ready_for_shipment:
      case PrismaOrderStatus.shipped:
        return 'shipment';
      case PrismaOrderStatus.delivered:
        return 'completed';
      default:
        return 'intake';
    }
  }

  private buildTimeline(order: OrderRecord): OrderWire['timeline'] {
    const timeline: OrderWire['timeline'] = order.statusHistory.map((entry) => ({
      type: 'status',
      status: entry.newStatus,
      happenedAt: entry.changedAt,
      comment: entry.comment ?? null,
      actorType: entry.changedByType,
      actorId: entry.changedById
    }));

    const payment = order.payments[0];
    if (payment?.updatedAt) {
      timeline.push({
        type: 'payment',
        status: payment.status,
        happenedAt: payment.paidAt ?? payment.updatedAt,
        comment: payment.transactionId ? `Transaction ${payment.transactionId}` : null,
        actorType: null,
        actorId: null
      });
    }

    if (order.delivery?.shippedAt) {
      timeline.push({
        type: 'delivery',
        status: PrismaDeliveryStatus.shipped,
        happenedAt: order.delivery.shippedAt,
        comment: order.delivery.trackingNumber
          ? `Tracking ${order.delivery.trackingNumber}`
          : null,
        actorType: null,
        actorId: null
      });
    }

    if (order.delivery?.deliveredAt) {
      timeline.push({
        type: 'delivery',
        status: PrismaDeliveryStatus.delivered,
        happenedAt: order.delivery.deliveredAt,
        comment: order.delivery.company ? `Carrier ${order.delivery.company}` : null,
        actorType: null,
        actorId: null
      });
    }

    return timeline.sort(
      (left, right) => left.happenedAt.getTime() - right.happenedAt.getTime()
    );
  }

  private toWire(order: OrderRecord): OrderWire {
    const payment = order.payments[0] ?? null;
    const addressSnapshot = this.parseAddressSnapshot(order.deliveryAddressSnapshot);
    const contactSnapshot = this.parseContactSnapshot(order);
    const packagingMeta = this.parsePackagingMeta(order.packaging?.comment ?? null);
    const parsedDimensions = this.parseDimensions(order.packaging?.dimensions ?? null);
    const availableTransitions = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      stage: this.getOrderStage(order),
      availableTransitions,
      customer: contactSnapshot,
      address: addressSnapshot,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        qty: item.quantity,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      payment: payment
        ? {
            method: payment.method,
            status: payment.status,
            amount: payment.amount,
            transactionId: payment.transactionId,
            paidAt: payment.paidAt
          }
        : null,
      deliveryMethod: order.deliveryMethod,
      deliveryStatus: order.delivery?.status ?? null,
      delivery: order.delivery
        ? {
            method: order.delivery.method,
            company: order.delivery.company,
            address: order.delivery.address,
            addressSnapshot,
            trackingNumber: order.delivery.trackingNumber,
            shippingCost: order.delivery.shippingCost,
            status: order.delivery.status,
            shippedAt: order.delivery.shippedAt,
            deliveredAt: order.delivery.deliveredAt
          }
        : null,
      packaging: order.packaging
        ? {
            status: order.packaging.status,
            fragile: order.packaging.fragile,
            packageType: order.packaging.packageType,
            dimensions: order.packaging.dimensions,
            weightGrams: order.packaging.weightGrams,
            lengthCm: parsedDimensions.lengthCm,
            widthCm: parsedDimensions.widthCm,
            heightCm: parsedDimensions.heightCm,
            comment: packagingMeta.comment,
            serialNumbers: packagingMeta.serialNumbers,
            warehouseIssueType: packagingMeta.warehouseIssueType,
            packedAt: order.packaging.packedAt,
            employeeId: order.packaging.employeeId
          }
        : null,
      warehouseIssue: this.findWarehouseIssue(order, packagingMeta),
      status: order.status,
      subtotal: order.subtotal,
      deliveryCost: order.deliveryCost,
      total: order.total,
      notes: order.notes,
      statusHistory: order.statusHistory.map((entry) => ({
        oldStatus: entry.oldStatus,
        newStatus: entry.newStatus,
        changedByType: entry.changedByType,
        changedById: entry.changedById,
        comment: entry.comment,
        changedAt: entry.changedAt
      })),
      timeline: this.buildTimeline(order),
      paymentRedirectUrl:
        order.paymentMethod === 'online' && order.paymentStatus === PrismaPaymentStatus.pending
          ? `/payments/stub/${order.id}`
          : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  private readonly orderInclude = {
    items: true,
    payments: true,
    delivery: true,
    packaging: true,
    statusHistory: {
      orderBy: {
        changedAt: 'asc'
      }
    }
  } satisfies Prisma.OrderInclude;
}
