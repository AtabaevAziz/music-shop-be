import { OrderStatus } from '../enums/order-status.enum';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.New]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Packed, OrderStatus.Cancelled],
  [OrderStatus.Packed]: [OrderStatus.ReadyForPickup, OrderStatus.Cancelled],
  [OrderStatus.ReadyForPickup]: [OrderStatus.Completed, OrderStatus.Cancelled],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: []
};

