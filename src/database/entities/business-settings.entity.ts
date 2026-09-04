import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProductStatus } from "../../common/enums/product-status.enum";

@Entity({ name: "BusinessSettings" })
export class BusinessSettingsEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "currency" })
  currency!: string;

  @Column({ type: "integer", name: "lowStockThreshold" })
  lowStockThreshold!: number;

  @Column({
    type: "enum",
    enum: ProductStatus,
    enumName: "ProductStatus",
    name: "defaultProductStatus",
  })
  defaultProductStatus!: ProductStatus;

  @Column({ type: "integer", name: "defaultMarkupPercent" })
  defaultMarkupPercent!: number;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updatedAt" })
  updatedAt!: Date;
}
