import { Injectable } from '@nestjs/common';
import { RepairRequest, RepairStatus as PrismaRepairStatus } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateClientRepairDto } from './dto/create-client-repair.dto';
import { CreateRepairDto } from './dto/create-repair.dto';

type RepairWire = {
  id: string;
  customerId: string;
  instrumentName: string;
  brand: string;
  issue: string;
  status: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRepairs(filters: { status?: string; customerId?: string; limit?: number } = {}): Promise<RepairWire[]> {
    const items = await this.prisma.repairRequest.findMany({
      where: {
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {})
      },
      orderBy: [{ createdAt: 'desc' }],
      ...(filters.limit ? { take: filters.limit } : {})
    });

    return items.map((item) => this.toWire(item));
  }

  async createRepair(payload: CreateRepairDto): Promise<RepairWire> {
    return this.createRepairForCustomer(payload.customerId, payload);
  }

  async createRepairForCustomer(
    customerId: string,
    payload: Pick<CreateRepairDto, 'instrumentName' | 'brand' | 'issue' | 'notes'> | CreateClientRepairDto
  ): Promise<RepairWire> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw ApiException.validation('Customer must exist.', 'customerId');
    }

    const repairCount = await this.prisma.repairRequest.count();
    const repair = await this.prisma.repairRequest.create({
      data: {
        id: `REP-${2001 + repairCount}`,
        customerId,
        instrumentName: payload.instrumentName.trim(),
        brand: payload.brand.trim(),
        issue: payload.issue.trim(),
        status: PrismaRepairStatus.new,
        notes: payload.notes.trim()
      }
    });

    await this.prisma.activity.create({
      data: {
        id: createId('activity'),
        title: 'activity.repairCreated',
        messageKey: 'activity.repairCreated',
        messageParams: {
          repairId: repair.id,
          customerId
        }
      }
    });

    return this.toWire(repair);
  }

  private toWire(repair: RepairRequest): RepairWire {
    return {
      id: repair.id,
      customerId: repair.customerId,
      instrumentName: repair.instrumentName,
      brand: repair.brand,
      issue: repair.issue,
      status: repair.status,
      notes: repair.notes,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt
    };
  }
}

