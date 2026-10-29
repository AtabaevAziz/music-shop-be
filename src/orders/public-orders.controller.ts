import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Request } from "express";
import { ApiException } from "../common/exceptions/api.exception";
import { CustomersService } from "../customers/customers.service";
import { CreatePublicOrderDto } from "./dto/create-public-order.dto";
import { StubPaymentWebhookDto } from "./dto/stub-payment-webhook.dto";
import { OrdersService } from "./orders.service";

@Controller("public/orders")
export class PublicOrdersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  async createOrder(
    @Body() payload: CreatePublicOrderDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const customer = await this.customersService.findOrCreatePublicCustomer({
      name: `${payload.firstName} ${payload.lastName}`.trim(),
      phone: payload.phone,
      email: payload.email,
    });

    const order = await this.ordersService.createPublicOrder({
      customerId: customer.id,
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
      items: payload.items,
    }, idempotencyKey);

    return { order: this.toPublicOrder(order, true) };
  }

  @Get(":orderNumber")
  async getOrder(
    @Param("orderNumber") orderNumber: string,
    @Query("token") token?: string,
  ) {
    const order = await this.ordersService.getOrderByOrderNumber(
      orderNumber,
      token,
    );
    return { order: this.toPublicOrder(order, false) };
  }

  @Post(":id/payment-webhook")
  async processStubWebhook(
    @Param("id") id: string,
    @Body() payload: StubPaymentWebhookDto,
    @Req() request: Request,
  ) {
    this.assertWebhookSignature(request);
    const order = await this.ordersService.handleStubPaymentWebhook(
      id,
      payload,
    );
    return { order };
  }

  private assertWebhookSignature(request: Request): void {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw ApiException.forbidden("Payment webhook is not configured.");
    }

    const timestamp = request.header("x-payment-timestamp");
    const signature = request.header("x-payment-signature");
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
    const maxSkewSeconds = Number(
      process.env.PAYMENT_WEBHOOK_MAX_SKEW_SECONDS ?? 300,
    );

    if (
      !timestamp ||
      !signature ||
      !rawBody ||
      !Number.isFinite(maxSkewSeconds)
    ) {
      throw ApiException.unauthorized("Invalid payment webhook signature.");
    }

    const timestampSeconds = Number(timestamp);
    if (
      !Number.isFinite(timestampSeconds) ||
      Math.abs(Date.now() / 1000 - timestampSeconds) > maxSkewSeconds
    ) {
      throw ApiException.unauthorized("Expired payment webhook signature.");
    }

    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody.toString("utf8")}`)
      .digest("hex");
    const actualBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw ApiException.unauthorized("Invalid payment webhook signature.");
    }
  }

  private toPublicOrder(
    order: Awaited<ReturnType<OrdersService["createPublicOrder"]>>,
    includeTrackingToken: boolean,
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      ...(includeTrackingToken && order.trackingToken
        ? { trackingToken: order.trackingToken }
        : {}),
      stage: order.stage,
      customer: order.customer,
      address: order.address,
      items: order.items,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: order.payment.amount,
            paidAt: order.payment.paidAt,
          }
        : null,
      deliveryMethod: order.deliveryMethod,
      deliveryStatus: order.deliveryStatus,
      delivery: order.delivery
        ? {
            method: order.delivery.method,
            company: order.delivery.company,
            address: order.delivery.address,
            trackingNumber: order.delivery.trackingNumber,
            shippingCost: order.delivery.shippingCost,
            status: order.delivery.status,
            shippedAt: order.delivery.shippedAt,
            deliveredAt: order.delivery.deliveredAt,
          }
        : null,
      status: order.status,
      notes: order.notes,
      subtotal: order.subtotal,
      deliveryCost: order.deliveryCost,
      total: order.total,
      timeline: order.timeline.map((entry) => ({
        type: entry.type,
        status: entry.status,
        happenedAt: entry.happenedAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
