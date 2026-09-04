import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { OrderEntity } from './order.entity';

@Entity({ name: 'Payment' })
@Index('Payment_orderId_idx', ['orderId'])
@Index('Payment_status_idx', ['status'])
export class PaymentEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'orderId' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    name: 'method'
  })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'PaymentStatus',
    name: 'status'
  })
  status!: PaymentStatus;

  @Column({ type: 'integer', name: 'amount' })
  amount!: number;

  @Column({ type: 'text', name: 'transactionId', nullable: true })
  transactionId!: string | null;

  @Column({ type: 'text', name: 'provider', nullable: true })
  provider!: string | null;

  @Column({ type: 'jsonb', name: 'providerPayload', nullable: true })
  providerPayload!: Record<string, unknown> | null;

  @Column({ type: 'timestamp', precision: 3, name: 'paidAt', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => OrderEntity, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order!: OrderEntity;
}
