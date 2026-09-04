import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity({ name: 'Category' })
@Unique('Category_slug_key', ['slug'])
export class CategoryEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id!: string;

  @Column({ type: 'text', name: 'name' })
  name!: string;

  @Column({ type: 'text', name: 'slug' })
  slug!: string;

  @Column({ type: 'text', name: 'parentId', nullable: true })
  parentId!: string | null;

  @Column({ type: 'text', name: 'image' })
  image!: string;

  @Column({ type: 'text', name: 'status' })
  status!: string;

  @Column({ type: 'text', name: 'description' })
  description!: string;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => CategoryEntity, (category) => category.children, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parentId', referencedColumnName: 'id' })
  parent!: CategoryEntity | null;

  @OneToMany(() => CategoryEntity, (category) => category.parent)
  children!: CategoryEntity[];

  @OneToMany(() => ProductEntity, (product) => product.category)
  products!: ProductEntity[];
}
