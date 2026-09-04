import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { CustomerTier } from '../../common/enums/customer-tier.enum';
import { OrderEntity } from './order.entity';
import { RepairRequestEntity } from './repair-request.entity';
import { SessionEntity } from './session.entity';

@Entity({ name: 'Customer' })
@Unique('Customer_email_key', ['email'])
export class CustomerEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'name' })
  name!: string;

  @Column({ type: 'text', name: 'fullName', nullable: true })
  fullName!: string | null;

  @Column({ type: 'text', name: 'phone' })
  phone!: string;

  @Column({ type: 'text', name: 'email' })
  email!: string;

  @Column({
    type: 'enum',
    enum: CustomerTier,
    enumName: 'CustomerTier',
    name: 'tier'
  })
  tier!: CustomerTier;

  @Column({ type: 'text', name: 'status' })
  status!: string;

  @Column({ type: 'text', name: 'notes' })
  notes!: string;

  @Column({ type: 'text', name: 'passwordHash' })
  passwordHash!: string;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'updatedAt' })
  updatedAt!: Date;

  @OneToMany(() => SessionEntity, (session) => session.customer)
  sessions!: SessionEntity[];

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders!: OrderEntity[];

  @OneToMany(() => RepairRequestEntity, (repair) => repair.customer)
  repairs!: RepairRequestEntity[];
}
