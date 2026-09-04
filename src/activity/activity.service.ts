import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createId } from "../common/utils/id.util";
import { ActivityEntity } from "../database/entities";

type ActivityItem = {
  id: string;
  title: string;
  messageKey: string;
  messageParams: Record<string, string | number | boolean | null>;
  timestamp: Date;
};

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
  ) {}

  async list(limit?: number): Promise<ActivityItem[]> {
    const items = await this.activityRepository.find({
      order: { timestamp: "DESC" },
      ...(limit ? { take: limit } : {}),
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      messageKey: item.messageKey,
      messageParams: item.messageParams as Record<
        string,
        string | number | boolean | null
      >,
      timestamp: item.timestamp,
    }));
  }

  async record(
    title: string,
    messageKey: string,
    messageParams: Record<string, string | number | boolean | null>,
    timestamp?: Date,
  ): Promise<void> {
    await this.activityRepository.save(
      this.activityRepository.create({
        id: createId("activity"),
        title,
        messageKey,
        messageParams,
        ...(timestamp ? { timestamp } : {}),
      }),
    );
  }
}
