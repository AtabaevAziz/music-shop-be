import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { InventoryMovementType } from "../../common/enums/inventory-movement-type.enum";
import { ProductEntity } from "./product.entity";
import { ProductVariantEntity } from "./product-variant.entity";

@Entity({ name: "InventoryMovement" })
@Index("InventoryMovement_productId_idx", ["productId"])
@Index("InventoryMovement_createdAt_idx", ["createdAt"])
export class InventoryMovementEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "productId" })
  productId!: string;

  @Column({ type: "text", name: "variantId", nullable: true })
  variantId!: string | null;

  @Column({ type: "integer", name: "delta" })
  delta!: number;

  @Column({
    type: "enum",
    enum: InventoryMovementType,
    enumName: "InventoryMovementType",
    name: "type",
    default: InventoryMovementType.ManualAdjustment,
  })
  type!: InventoryMovementType;

  @Column({ type: "text", name: "reason" })
  reason!: string;

  @Column({ type: "text", name: "referenceType", nullable: true })
  referenceType!: string | null;

  @Column({ type: "text", name: "referenceId", nullable: true })
  referenceId!: string | null;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @ManyToOne(() => ProductEntity, (product) => product.inventoryMoves, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product!: ProductEntity;

  @ManyToOne(() => ProductVariantEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "variantId", referencedColumnName: "id" })
  variant!: ProductVariantEntity | null;
}
