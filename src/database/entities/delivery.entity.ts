import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { DeliveryMethod } from '../../common/enums/delivery-method.enum';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { OrderEntity } from './order.entity';

@Entity({ name: 'Delivery' })
@Unique('Delivery_orderId_key', ['orderId'])
@Index('Delivery_status_idx', ['status'])
export class DeliveryEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'orderId' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    enumName: 'DeliveryMethod',
    name: 'method'
  })
  method!: DeliveryMethod;

  @Column({ type: 'text', name: 'company', nullable: true })
  company!: string | null;

  @Column({ type: 'text', name: 'address' })
  address!: string;

  @Column({ type: 'text', name: 'trackingNumber', nullable: true })
  trackingNumber!: string | null;

  @Column({ type: 'integer', name: 'shippingCost', default: 0 })
  shippingCost!: number;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    enumName: 'DeliveryStatus',
    name: 'status'
  })
  status!: DeliveryStatus;

  @Column({ type: 'timestamp', precision: 3, name: 'shippedAt', nullable: true })
  shippedAt!: Date | null;

  @Column({ type: 'timestamp', precision: 3, name: 'deliveredAt', nullable: true })
  deliveredAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'updatedAt' })
  updatedAt!: Date;

  @OneToOne(() => OrderEntity, (order) => order.delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order!: OrderEntity;
}
