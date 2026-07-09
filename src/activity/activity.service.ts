import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createId } from '../common/utils/id.util';

type ActivityItem = {
  id: string;
  title: string;
  messageKey: string;
  messageParams: Record<string, string | number | boolean | null>;
  timestamp: Date;
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit?: number): Promise<ActivityItem[]> {
    const items = await this.prisma.activity.findMany({
      orderBy: [{ timestamp: 'desc' }],
      ...(limit ? { take: limit } : {})
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      messageKey: item.messageKey,
      messageParams: item.messageParams as Record<string, string | number | boolean | null>,
      timestamp: item.timestamp
    }));
  }

  async record(
    title: string,
    messageKey: string,
    messageParams: Record<string, string | number | boolean | null>,
    timestamp?: Date
  ): Promise<void> {
    await this.prisma.activity.create({
      data: {
        id: createId('activity'),
        title,
        messageKey,
        messageParams,
        ...(timestamp ? { timestamp } : {})
      }
    });
  }
}

