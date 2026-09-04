import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm';
import { PackagingStatus } from '../../common/enums/packaging-status.enum';
import { EmployeeEntity } from './employee.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'PackagingDetail' })
@Unique('PackagingDetail_orderId_key', ['orderId'])
export class PackagingDetailEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'orderId' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: PackagingStatus,
    enumName: 'PackagingStatus',
    name: 'status'
  })
  status!: PackagingStatus;

  @Column({ type: 'timestamp', precision: 3, name: 'packedAt', nullable: true })
  packedAt!: Date | null;

  @Column({ type: 'text', name: 'employeeId', nullable: true })
  employeeId!: string | null;

  @Column({ type: 'integer', name: 'weightGrams', nullable: true })
  weightGrams!: number | null;

  @Column({ type: 'text', name: 'dimensions', nullable: true })
  dimensions!: string | null;

  @Column({ type: 'boolean', name: 'fragile', default: false })
  fragile!: boolean;

  @Column({ type: 'text', name: 'packageType', nullable: true })
  packageType!: string | null;

  @Column({ type: 'text', name: 'comment', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'updatedAt' })
  updatedAt!: Date;

  @OneToOne(() => OrderEntity, (order) => order.packaging, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order!: OrderEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.packagingTasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employeeId', referencedColumnName: 'id' })
  employee!: EmployeeEntity | null;
}
