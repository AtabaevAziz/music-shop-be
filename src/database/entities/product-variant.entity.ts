import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { ProductStatus } from "../../common/enums/product-status.enum";
import { ProductEntity } from "./product.entity";

@Entity({ name: "ProductVariant" })
@Unique("ProductVariant_product_color_key", ["productId", "colorKey"])
@Unique("ProductVariant_sku_key", ["sku"])
@Index("ProductVariant_productId_idx", ["productId"])
export class ProductVariantEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "productId" })
  productId!: string;

  @Column({ type: "text", name: "colorKey" })
  colorKey!: string;

  @Column({ type: "text", name: "colorName" })
  colorName!: string;

  @Column({ type: "text", name: "sku" })
  sku!: string;

  @Column({ type: "text", name: "barcode", nullable: true })
  barcode!: string | null;

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

  @Column({ type: "text", array: true, name: "images" })
  images!: string[];

  @Column({ type: "text", name: "primaryImage", nullable: true })
  primaryImage!: string | null;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3, name: "updatedAt" })
  updatedAt!: Date;

  @ManyToOne(() => ProductEntity, (product) => product.variants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product!: ProductEntity;
}
