import { Injectable } from '@nestjs/common';
import { RepairRequest, RepairStatus as PrismaRepairStatus } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

type RepairWire = {
  id: string;
  customerId: string;
  instrumentName: string;
  brand: string;
  issue: string;
  status: string;
  notes: string;
  estimatedCost?: number;
  assignedMasterName?: string;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type RepairCreatePayload = Pick<CreateRepairDto, 'instrumentName' | 'brand' | 'issue' | 'notes'> &
  Partial<Pick<CreateRepairDto, 'estimatedCost' | 'assignedMasterName' | 'receivedAt'>>;

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

  async updateRepair(id: string, payload: UpdateRepairDto): Promise<RepairWire> {
    await this.assertCustomerExists(payload.customerId);

    try {
      const repair = await this.prisma.repairRequest.update({
        where: { id },
        data: {
          customerId: payload.customerId,
          instrumentName: payload.instrumentName.trim(),
          brand: payload.brand.trim(),
          issue: payload.issue.trim(),
          status: payload.status as PrismaRepairStatus,
          notes: payload.notes.trim(),
          estimatedCost: payload.estimatedCost,
          assignedMasterName: payload.assignedMasterName?.trim(),
          receivedAt: this.parseReceivedAt(payload.receivedAt)
        }
      });

      return this.toWire(repair);
    } catch (error: unknown) {
      this.rethrowNotFound(error, 'Repair request was not found.');
      throw error;
    }
  }

  async createRepairForCustomer(
    customerId: string,
    payload: RepairCreatePayload
  ): Promise<RepairWire> {
    await this.assertCustomerExists(customerId);

    const repairCount = await this.prisma.repairRequest.count();
    const repair = await this.prisma.repairRequest.create({
      data: {
        id: `REP-${2001 + repairCount}`,
        customerId,
        instrumentName: payload.instrumentName.trim(),
        brand: payload.brand.trim(),
        issue: payload.issue.trim(),
        status: PrismaRepairStatus.new,
        notes: payload.notes.trim(),
        estimatedCost: payload.estimatedCost,
        assignedMasterName: payload.assignedMasterName?.trim(),
        receivedAt: this.parseReceivedAt(payload.receivedAt)
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
      estimatedCost: repair.estimatedCost ?? undefined,
      assignedMasterName: repair.assignedMasterName ?? undefined,
      receivedAt: repair.receivedAt ?? undefined,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt
    };
  }

  private async assertCustomerExists(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw ApiException.validation('Customer must exist.', 'customerId');
    }
  }

  private parseReceivedAt(receivedAt?: string): Date | undefined {
    return receivedAt ? new Date(receivedAt) : undefined;
  }

  private rethrowNotFound(error: unknown, message: string): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      throw ApiException.notFound(message);
    }
  }
}
