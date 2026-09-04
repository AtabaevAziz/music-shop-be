import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Condition } from "../../common/enums/condition.enum";
import { ProductStatus } from "../../common/enums/product-status.enum";
import { CategoryEntity } from "./category.entity";
import { InventoryMovementEntity } from "./inventory-movement.entity";
import { OrderItemEntity } from "./order-item.entity";

@Entity({ name: "Product" })
@Unique("Product_slug_key", ["slug"])
@Unique("Product_sku_key", ["sku"])
@Index("Product_status_idx", ["status"])
@Index("Product_categoryId_idx", ["categoryId"])
@Index("Product_brand_idx", ["brand"])
export class ProductEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "name" })
  name!: string;

  @Column({ type: "text", name: "slug", nullable: true })
  slug!: string | null;

  @Column({ type: "text", name: "sku" })
  sku!: string;

  @Column({ type: "text", name: "barcode", nullable: true })
  barcode!: string | null;

  @Column({ type: "text", name: "categoryId" })
  categoryId!: string;

  @Column({ type: "text", name: "brand" })
  brand!: string;

  @Column({ type: "integer", name: "price" })
  price!: number;

  @Column({ type: "integer", name: "costPrice" })
  costPrice!: number;

  @Column({ type: "integer", name: "stockQty" })
  stockQty!: number;

  @Column({ type: "integer", name: "reservedQty", default: 0 })
  reservedQty!: number;

  @Column({ type: "integer", name: "minStockQty", nullable: true })
  minStockQty!: number | null;

  @Column({
    type: "enum",
    enum: ProductStatus,
    enumName: "ProductStatus",
    name: "status",
  })
  status!: ProductStatus;

  @Column({ type: "text", name: "shortDescription" })
  shortDescription!: string;

  @Column({ type: "text", name: "description" })
  description!: string;

  @Column({ type: "jsonb", name: "specs" })
  specs!: Record<string, string>;

  @Column({ type: "text", array: true, name: "images" })
  images!: string[];

  @Column({ type: "text", name: "primaryImage", nullable: true })
  primaryImage!: string | null;

  @Column({
    type: "enum",
    enum: Condition,
    enumName: "Condition",
    name: "condition",
  })
  condition!: Condition;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updatedAt" })
  updatedAt!: Date;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "categoryId", referencedColumnName: "id" })
  category!: CategoryEntity;

  @OneToMany(
    () => InventoryMovementEntity,
    (inventoryMovement) => inventoryMovement.product,
  )
  inventoryMoves!: InventoryMovementEntity[];

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.product)
  orderItems!: OrderItemEntity[];
}
