import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { PrincipalType } from "../../common/enums/principal-type.enum";
import { CustomerEntity } from "./customer.entity";
import { EmployeeEntity } from "./employee.entity";

@Entity({ name: "Session" })
@Index("Session_expiresAt_idx", ["expiresAt"])
export class SessionEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({
    type: "enum",
    enum: PrincipalType,
    enumName: "PrincipalType",
    name: "principalType",
  })
  principalType!: PrincipalType;

  @Column({ type: "text", name: "employeeId", nullable: true })
  employeeId!: string | null;

  @Column({ type: "text", name: "customerId", nullable: true })
  customerId!: string | null;

  @Column({ type: "timestamp", precision: 3, name: "expiresAt" })
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updatedAt" })
  updatedAt!: Date;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.sessions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "employeeId", referencedColumnName: "id" })
  employee!: EmployeeEntity | null;

  @ManyToOne(() => CustomerEntity, (customer) => customer.sessions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "customerId", referencedColumnName: "id" })
  customer!: CustomerEntity | null;
}
