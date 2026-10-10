import { OrderStatus } from "../enums/order-status.enum";
import { RepairStatus } from "../enums/repair-status.enum";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.New]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.SentToWarehouse, OrderStatus.Cancelled],
  [OrderStatus.SentToWarehouse]: [
    OrderStatus.Picking,
    OrderStatus.StockProblem,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Picking]: [
    OrderStatus.Picked,
    OrderStatus.StockProblem,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Picked]: [
    OrderStatus.Packing,
    OrderStatus.StockProblem,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Packing]: [
    OrderStatus.Packed,
    OrderStatus.StockProblem,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Packed]: [
    OrderStatus.ReadyForShipment,
    OrderStatus.StockProblem,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.ReadyForShipment]: [
    OrderStatus.Shipped,
    OrderStatus.StockProblem,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Returned],
  [OrderStatus.Delivered]: [OrderStatus.Returned],
  [OrderStatus.StockProblem]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.Returned]: [],
};

export const REPAIR_STATUS_TRANSITIONS: Record<RepairStatus, RepairStatus[]> = {
  [RepairStatus.New]: [RepairStatus.Diagnostics, RepairStatus.Cancelled],
  [RepairStatus.Diagnostics]: [RepairStatus.InProgress, RepairStatus.Cancelled],
  [RepairStatus.InProgress]: [RepairStatus.Ready, RepairStatus.Cancelled],
  [RepairStatus.Ready]: [RepairStatus.Completed, RepairStatus.Cancelled],
  [RepairStatus.Completed]: [],
  [RepairStatus.Cancelled]: [],
};
