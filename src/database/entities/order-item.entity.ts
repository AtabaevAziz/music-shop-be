import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { ProductEntity } from './product.entity';

@Entity({ name: 'OrderItem' })
@Index('OrderItem_orderId_idx', ['orderId'])
@Index('OrderItem_productId_idx', ['productId'])
export class OrderItemEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'orderId' })
  orderId!: string;

  @Column({ type: 'text', name: 'productId' })
  productId!: string;

  @Column({ type: 'text', name: 'productName' })
  productName!: string;

  @Column({ type: 'integer', name: 'quantity' })
  quantity!: number;

  @Column({ type: 'integer', name: 'unitPrice' })
  unitPrice!: number;

  @Column({ type: 'integer', name: 'totalPrice' })
  totalPrice!: number;

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order!: OrderEntity;

  @ManyToOne(() => ProductEntity, (product) => product.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId', referencedColumnName: 'id' })
  product!: ProductEntity;
}
