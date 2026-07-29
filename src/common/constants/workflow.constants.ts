import { OrderStatus } from '../enums/order-status.enum';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.New]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.AwaitingPayment]: [OrderStatus.Paid, OrderStatus.Cancelled],
  [OrderStatus.Paid]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Processing, OrderStatus.Cancelled],
  [OrderStatus.Processing]: [OrderStatus.Packed, OrderStatus.Cancelled],
  [OrderStatus.Packed]: [OrderStatus.Shipped, OrderStatus.Cancelled],
  [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Returned],
  [OrderStatus.Delivered]: [OrderStatus.Returned],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.Returned]: []
};
