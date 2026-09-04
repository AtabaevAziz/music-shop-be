import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { DeliveryMethod } from "../../common/enums/delivery-method.enum";
import { OrderStatus } from "../../common/enums/order-status.enum";
import { PaymentMethod } from "../../common/enums/payment-method.enum";
import { PaymentStatus } from "../../common/enums/payment-status.enum";
import { CustomerEntity } from "./customer.entity";
import { DeliveryEntity } from "./delivery.entity";
import { OrderItemEntity } from "./order-item.entity";
import { OrderStatusHistoryEntity } from "./order-status-history.entity";
import { PackagingDetailEntity } from "./packaging-detail.entity";
import { PaymentEntity } from "./payment.entity";

@Entity({ name: "Order" })
@Unique("Order_orderNumber_key", ["orderNumber"])
@Index("Order_customerId_idx", ["customerId"])
@Index("Order_status_idx", ["status"])
@Index("Order_paymentStatus_idx", ["paymentStatus"])
@Index("Order_orderNumber_idx", ["orderNumber"])
export class OrderEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "orderNumber" })
  orderNumber!: string;

  @Column({ type: "text", name: "customerId" })
  customerId!: string;

  @Column({ type: "text", name: "customerNameSnapshot" })
  customerNameSnapshot!: string;

  @Column({ type: "text", name: "phoneSnapshot" })
  phoneSnapshot!: string;

  @Column({ type: "text", name: "emailSnapshot", nullable: true })
  emailSnapshot!: string | null;

  @Column({ type: "text", name: "deliveryAddressSnapshot" })
  deliveryAddressSnapshot!: string;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    enumName: "PaymentMethod",
    name: "paymentMethod",
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    enumName: "PaymentStatus",
    name: "paymentStatus",
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: "enum",
    enum: DeliveryMethod,
    enumName: "DeliveryMethod",
    name: "deliveryMethod",
  })
  deliveryMethod!: DeliveryMethod;

  @Column({
    type: "enum",
    enum: OrderStatus,
    enumName: "OrderStatus",
    name: "status",
  })
  status!: OrderStatus;

  @Column({ type: "text", name: "notes" })
  notes!: string;

  @Column({ type: "integer", name: "subtotal", default: 0 })
  subtotal!: number;

  @Column({ type: "integer", name: "deliveryCost", default: 0 })
  deliveryCost!: number;

  @Column({ type: "integer", name: "total", default: 0 })
  total!: number;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "confirmedAt",
    nullable: true,
  })
  confirmedAt!: Date | null;

  @Column({ type: "timestamp", precision: 3, name: "packedAt", nullable: true })
  packedAt!: Date | null;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "shippedAt",
    nullable: true,
  })
  shippedAt!: Date | null;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "deliveredAt",
    nullable: true,
  })
  deliveredAt!: Date | null;

  @Column({
    type: "timestamp",
    precision: 3,
    name: "cancelledAt",
    nullable: true,
  })
  cancelledAt!: Date | null;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updatedAt" })
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.orders, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "customerId", referencedColumnName: "id" })
  customer!: CustomerEntity;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items!: OrderItemEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.order)
  payments!: PaymentEntity[];

  @OneToOne(() => DeliveryEntity, (delivery) => delivery.order)
  delivery!: DeliveryEntity | null;

  @OneToOne(() => PackagingDetailEntity, (packaging) => packaging.order)
  packaging!: PackagingDetailEntity | null;

  @OneToMany(
    () => OrderStatusHistoryEntity,
    (statusHistory) => statusHistory.order,
  )
  statusHistory!: OrderStatusHistoryEntity[];
}
