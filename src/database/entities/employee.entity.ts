import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Role } from "../../common/enums/role.enum";
import { PackagingDetailEntity } from "./packaging-detail.entity";
import { OrderStatusHistoryEntity } from "./order-status-history.entity";
import { SessionEntity } from "./session.entity";

@Entity({ name: "Employee" })
@Unique("Employee_login_key", ["login"])
@Unique("Employee_email_key", ["email"])
export class EmployeeEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "name" })
  name!: string;

  @Column({ type: "text", name: "login", nullable: true })
  login!: string | null;

  @Column({ type: "text", name: "email" })
  email!: string;

  @Column({ type: "text", name: "phone" })
  phone!: string;

  @Column({
    type: "enum",
    enum: Role,
    enumName: "Role",
    name: "role",
  })
  role!: Role;

  @Column({ type: "text", name: "status" })
  status!: string;

  @Column({ type: "text", name: "passwordHash" })
  passwordHash!: string;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updatedAt" })
  updatedAt!: Date;

  @OneToMany(() => SessionEntity, (session) => session.employee)
  sessions!: SessionEntity[];

  @OneToMany(
    () => PackagingDetailEntity,
    (packagingDetail) => packagingDetail.employee,
  )
  packagingTasks!: PackagingDetailEntity[];

  @OneToMany(
    () => OrderStatusHistoryEntity,
    (statusHistory) => statusHistory.employee,
  )
  statusChanges!: OrderStatusHistoryEntity[];
}
