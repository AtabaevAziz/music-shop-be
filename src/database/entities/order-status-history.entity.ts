import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { ActorType } from '../../common/enums/actor-type.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { EmployeeEntity } from './employee.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'OrderStatusHistory' })
@Index('OrderStatusHistory_orderId_idx', ['orderId'])
@Index('OrderStatusHistory_changedAt_idx', ['changedAt'])
export class OrderStatusHistoryEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'orderId' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    name: 'oldStatus',
    nullable: true
  })
  oldStatus!: OrderStatus | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    name: 'newStatus'
  })
  newStatus!: OrderStatus;

  @Column({
    type: 'enum',
    enum: ActorType,
    enumName: 'ActorType',
    name: 'changedByType',
    default: ActorType.System
  })
  changedByType!: ActorType;

  @Column({ type: 'text', name: 'changedById', nullable: true })
  changedById!: string | null;

  @Column({ type: 'text', name: 'comment', nullable: true })
  comment!: string | null;

  @Column({ type: 'timestamp', precision: 3, name: 'changedAt', default: () => 'CURRENT_TIMESTAMP' })
  changedAt!: Date;

  @ManyToOne(() => OrderEntity, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order!: OrderEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.statusChanges, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById', referencedColumnName: 'id' })
  employee!: EmployeeEntity | null;
}
