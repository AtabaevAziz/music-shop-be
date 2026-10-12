import {
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  REPAIR_STATUS_TRANSITIONS,
} from "./workflow.constants";
import { OrderStatus } from "../enums/order-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";
import { RepairStatus } from "../enums/repair-status.enum";

describe("workflow transitions", () => {
  it("allows payment processing to finish or fail, but keeps terminal states terminal", () => {
    expect(PAYMENT_STATUS_TRANSITIONS[PaymentStatus.Pending]).toEqual(
      expect.arrayContaining([
        PaymentStatus.Processing,
        PaymentStatus.Paid,
        PaymentStatus.Failed,
        PaymentStatus.Cancelled,
      ]),
    );
    expect(PAYMENT_STATUS_TRANSITIONS[PaymentStatus.Paid]).toEqual([
      PaymentStatus.Refunded,
    ]);
    expect(PAYMENT_STATUS_TRANSITIONS[PaymentStatus.Failed]).toEqual([]);
    expect(PAYMENT_STATUS_TRANSITIONS[PaymentStatus.Refunded]).toEqual([]);
  });

  it("keeps repair workflow sequential and cancellable before completion", () => {
    expect(REPAIR_STATUS_TRANSITIONS[RepairStatus.New]).toEqual([
      RepairStatus.Diagnostics,
      RepairStatus.Cancelled,
    ]);
    expect(REPAIR_STATUS_TRANSITIONS[RepairStatus.InProgress]).toEqual([
      RepairStatus.Ready,
      RepairStatus.Cancelled,
    ]);
    expect(REPAIR_STATUS_TRANSITIONS[RepairStatus.Completed]).toEqual([]);
  });

  it("allows returns only from shipped or delivered orders", () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.Shipped]).toContain(
      OrderStatus.Returned,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.Delivered]).toContain(
      OrderStatus.Returned,
    );
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.New]).not.toContain(
      OrderStatus.Returned,
    );
  });
});
