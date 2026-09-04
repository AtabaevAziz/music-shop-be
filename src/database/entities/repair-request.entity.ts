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
import { RepairStatus } from '../../common/enums/repair-status.enum';
import { CustomerEntity } from './customer.entity';

@Entity({ name: 'RepairRequest' })
@Index('RepairRequest_customerId_idx', ['customerId'])
@Index('RepairRequest_status_idx', ['status'])
export class RepairRequestEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'customerId' })
  customerId!: string;

  @Column({ type: 'text', name: 'instrumentName' })
  instrumentName!: string;

  @Column({ type: 'text', name: 'brand' })
  brand!: string;

  @Column({ type: 'text', name: 'issue' })
  issue!: string;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    enumName: 'RepairStatus',
    name: 'status'
  })
  status!: RepairStatus;

  @Column({ type: 'text', name: 'notes' })
  notes!: string;

  @Column({ type: 'integer', name: 'estimatedCost', nullable: true })
  estimatedCost!: number | null;

  @Column({ type: 'text', name: 'assignedMasterName', nullable: true })
  assignedMasterName!: string | null;

  @Column({ type: 'timestamp', precision: 3, name: 'receivedAt', nullable: true })
  receivedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.repairs, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId', referencedColumnName: 'id' })
  customer!: CustomerEntity;
}
