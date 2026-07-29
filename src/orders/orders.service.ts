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
import { PaymentStatus } from '../common/enums/payment-status.enum';
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

type CreateCheckoutPayload = {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
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
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
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
    comment: string | null;
    packedAt: Date | null;
    employeeId: string | null;
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
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: this.orderInclude
    });

    if (!order) {
      throw ApiException.notFound('Order was not found.');
    }

    if (verifier?.phone && order.phoneSnapshot !== verifier.phone.trim()) {
      throw ApiException.forbidden('Order verification failed.');
    }

    if (verifier?.email && order.emailSnapshot !== verifier.email.trim().toLowerCase()) {
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
      customerName: customer.fullName ?? customer.name,
      phone: customer.phone,
      email: customer.email,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      deliveryMethod: payload.deliveryMethod,
      deliveryCompany: payload.deliveryCompany,
      notes: payload.notes,
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
        return sum + product.price * item.qty;
      }, 0);
      const deliveryCost = this.resolveDeliveryCost(payload.deliveryMethod);
      const total = subtotal + deliveryCost;
      const createdAt = new Date();
      const orderNumber = await this.allocateOrderNumber(tx);
      const initialStatus =
        payload.paymentMethod === PaymentMethod.Online
          ? PrismaOrderStatus.awaiting_payment
          : PrismaOrderStatus.new;

      const order = await tx.order.create({
        data: {
          id: createId('order'),
          orderNumber,
          customerId: payload.customerId,
          customerNameSnapshot: payload.customerName.trim(),
          phoneSnapshot: payload.phone.trim(),
          emailSnapshot: payload.email?.trim().toLowerCase() ?? null,
          deliveryAddressSnapshot: payload.address.trim(),
          paymentMethod: payload.paymentMethod as never,
          paymentStatus: PrismaPaymentStatus.pending,
          deliveryMethod: payload.deliveryMethod as never,
          status: initialStatus,
          notes: payload.notes?.trim() ?? '',
          subtotal,
          deliveryCost,
          total,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: payload.items.map((item) => {
              const product = products.get(item.productId)!;
              return {
                id: createId('order-item'),
                productId: product.id,
                productName: product.name,
                quantity: item.qty,
                unitPrice: product.price,
                totalPrice: product.price * item.qty
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
              address: payload.address.trim(),
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
              newStatus: initialStatus,
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
    const orderItems = order.items;

    if (nextStatus === OrderStatus.Cancelled) {
      await this.releaseReservations(tx, order, `Order ${order.orderNumber} cancelled`, now);
      await this.applyPaymentStatusUpdate(
        tx,
        order,
        PrismaPaymentStatus.cancelled,
        {
          changedByType: ActorType.employee,
          changedById: actor?.changedById,
          comment: payload.comment ?? 'Order cancelled'
        },
        {},
        true
      );
    }

    if (nextStatus === OrderStatus.Packed) {
      await tx.packagingDetail.update({
        where: { orderId: order.id },
        data: {
          status: PrismaPackagingStatus.packed,
          fragile: payload.fragile ?? order.packaging?.fragile ?? false,
          packageType: payload.packageType ?? order.packaging?.packageType ?? null,
          comment: payload.packagingComment ?? order.packaging?.comment ?? null,
          packedAt: now,
          employeeId: actor?.changedById,
          updatedAt: now
        }
      });

      await tx.delivery.update({
        where: { orderId: order.id },
        data: {
          status: PrismaDeliveryStatus.ready_for_shipment,
          updatedAt: now
        }
      });
    }

    if (nextStatus === OrderStatus.Shipped) {
      if (!payload.trackingNumber) {
        throw ApiException.validation('Tracking number is required before shipping.', 'trackingNumber');
      }

      for (const item of orderItems) {
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
          company: payload.deliveryCompany ?? order.delivery?.company ?? null,
          trackingNumber: payload.trackingNumber,
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

    if (paymentStatus === PrismaPaymentStatus.paid && order.status === PrismaOrderStatus.awaiting_payment) {
      orderUpdateData.status = PrismaOrderStatus.paid;
    }

    if (
      [PrismaPaymentStatus.failed, PrismaPaymentStatus.cancelled, PrismaPaymentStatus.refunded].includes(paymentStatus)
      && order.status !== PrismaOrderStatus.cancelled
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
    }

    return productMap;
  }

  private getStockDemand(items: CreateClientOrderDto['items']) {
    const stockDemand = new Map<string, number>();

    for (const item of items) {
      stockDemand.set(item.productId, (stockDemand.get(item.productId) ?? 0) + item.qty);
    }

    return stockDemand;
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

  private toWire(order: OrderRecord): OrderWire {
    const payment = order.payments[0] ?? null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customer: {
        name: order.customerNameSnapshot,
        phone: order.phoneSnapshot,
        email: order.emailSnapshot
      },
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
            comment: order.packaging.comment,
            packedAt: order.packaging.packedAt,
            employeeId: order.packaging.employeeId
          }
        : null,
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
