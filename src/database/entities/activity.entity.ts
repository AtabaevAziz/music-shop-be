import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: "Activity" })
@Index("Activity_timestamp_idx", ["timestamp"])
export class ActivityEntity {
  @PrimaryColumn({ type: "text", name: "id" })
  id!: string;

  @Column({ type: "text", name: "title" })
  title!: string;

  @Column({ type: "text", name: "messageKey" })
  messageKey!: string;

  @Column({ type: "jsonb", name: "messageParams" })
  messageParams!: Record<string, string | number | boolean | null>;

  @CreateDateColumn({ type: "timestamp", precision: 3, name: "timestamp" })
  timestamp!: Date;
}
