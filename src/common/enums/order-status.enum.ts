export enum OrderStatus {
  New = 'new',
  Confirmed = 'confirmed',
  SentToWarehouse = 'sent_to_warehouse',
  Picking = 'picking',
  Picked = 'picked',
  Packing = 'packing',
  Packed = 'packed',
  ReadyForShipment = 'ready_for_shipment',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  StockProblem = 'stock_problem',
  Returned = 'returned'
}
