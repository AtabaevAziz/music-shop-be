import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import { ApiException } from "../common/exceptions/api.exception";
import { RepairStatus } from "../common/enums/repair-status.enum";
import { createId } from "../common/utils/id.util";
import {
  getNextSequentialPrefixedId,
  isUniqueConstraintError,
} from "../common/utils/sequential-id.util";
import {
  CustomerEntity,
  RepairRequestEntity,
  ActivityEntity,
} from "../database/entities";
import { CreateRepairDto } from "./dto/create-repair.dto";
import { UpdateRepairDto } from "./dto/update-repair.dto";

type RepairWire = {
  id: string;
  customerId: string;
  instrumentName: string;
  brand: string;
  issue: string;
  status: string;
  notes: string;
  photoUrl?: string;
  estimatedCost?: number;
  assignedMasterName?: string;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type RepairCreatePayload = Pick<
  CreateRepairDto,
  "instrumentName" | "brand" | "issue" | "notes"
> &
  Partial<
    Pick<
      CreateRepairDto,
      "estimatedCost" | "assignedMasterName" | "receivedAt" | "photoUrl"
    >
  >;

@Injectable()
export class RepairsService {
  constructor(
    @InjectRepository(RepairRequestEntity)
    private readonly repairRepository: Repository<RepairRequestEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
  ) {}

  async listRepairs(
    filters: { status?: string; customerId?: string; limit?: number } = {},
  ): Promise<RepairWire[]> {
    const items = await this.repairRepository.find({
      where: {
        ...(filters.status ? { status: filters.status as RepairStatus } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
      },
      order: { createdAt: "DESC" },
      ...(filters.limit ? { take: filters.limit } : {}),
    });

    return items.map((item) => this.toWire(item));
  }

  async createRepair(payload: CreateRepairDto): Promise<RepairWire> {
    return this.createRepairForCustomer(payload.customerId, payload);
  }

  async updateRepair(
    id: string,
    payload: UpdateRepairDto,
  ): Promise<RepairWire> {
    await this.assertCustomerExists(payload.customerId);

    const existing = await this.repairRepository.findOneBy({ id });

    if (!existing) {
      throw ApiException.notFound("Repair request was not found.");
    }

    const repair = await this.repairRepository.save({
      ...existing,
      customerId: payload.customerId,
      instrumentName: payload.instrumentName.trim(),
      brand: payload.brand.trim(),
      issue: payload.issue.trim(),
      status: payload.status,
      notes: this.serializeRepairNotes(payload.notes, payload.photoUrl),
      estimatedCost: payload.estimatedCost,
      assignedMasterName: payload.assignedMasterName?.trim() ?? null,
      receivedAt: this.parseReceivedAt(payload.receivedAt) ?? null,
    });

    return this.toWire(repair);
  }

  async createRepairForCustomer(
    customerId: string,
    payload: RepairCreatePayload,
  ): Promise<RepairWire> {
    await this.assertCustomerExists(customerId);
    let repair: RepairRequestEntity | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existingRepairIds = await this.repairRepository.find({
        where: { id: Like("REP-%") },
        select: { id: true },
      });
      const repairId = getNextSequentialPrefixedId(
        existingRepairIds.map((item) => item.id),
        "REP",
        2001,
      );

      try {
        repair = await this.repairRepository.save(
          this.repairRepository.create({
            id: repairId,
            customerId,
            instrumentName: payload.instrumentName.trim(),
            brand: payload.brand.trim(),
            issue: payload.issue.trim(),
            status: RepairStatus.New,
            notes: this.serializeRepairNotes(payload.notes, payload.photoUrl),
            estimatedCost: payload.estimatedCost,
            assignedMasterName: payload.assignedMasterName?.trim() ?? null,
            receivedAt: this.parseReceivedAt(payload.receivedAt) ?? null,
          }),
        );
        break;
      } catch (error: unknown) {
        if (isUniqueConstraintError(error)) {
          continue;
        }

        throw error;
      }
    }

    if (!repair) {
      throw ApiException.conflict(
        "Could not allocate a new repair number. Please retry.",
      );
    }

    await this.activityRepository.save(
      this.activityRepository.create({
        id: createId("activity"),
        title: "activity.repairCreated",
        messageKey: "activity.repairCreated",
        messageParams: {
          repairId: repair.id,
          customerId,
        },
      }),
    );

    return this.toWire(repair);
  }

  private toWire(repair: RepairRequestEntity): RepairWire {
    const parsedNotes = this.parseRepairNotes(repair.notes);
    return {
      id: repair.id,
      customerId: repair.customerId,
      instrumentName: repair.instrumentName,
      brand: repair.brand,
      issue: repair.issue,
      status: repair.status,
      notes: parsedNotes.notes,
      photoUrl: parsedNotes.photoUrl ?? undefined,
      estimatedCost: repair.estimatedCost ?? undefined,
      assignedMasterName: repair.assignedMasterName ?? undefined,
      receivedAt: repair.receivedAt ?? undefined,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt,
    };
  }

  private async assertCustomerExists(customerId: string): Promise<void> {
    const customer = await this.customerRepository.findOneBy({
      id: customerId,
    });

    if (!customer) {
      throw ApiException.validation("Customer must exist.", "customerId");
    }
  }

  private parseReceivedAt(receivedAt?: string): Date | undefined {
    return receivedAt ? new Date(receivedAt) : undefined;
  }

  private serializeRepairNotes(
    notes: string,
    photoUrl?: string | null,
  ): string {
    const normalizedNotes = notes.trim();
    const normalizedPhotoUrl = photoUrl?.trim();

    if (!normalizedPhotoUrl) {
      return normalizedNotes;
    }

    return `${normalizedNotes}\n\nPhoto URL: ${normalizedPhotoUrl}`;
  }

  private parseRepairNotes(notes: string): {
    notes: string;
    photoUrl: string | null;
  } {
    const lines = notes.split("\n");
    const keptLines: string[] = [];
    let photoUrl: string | null = null;

    for (const line of lines) {
      if (line.startsWith("Photo URL: ")) {
        photoUrl = line.slice("Photo URL: ".length).trim() || null;
        continue;
      }

      keptLines.push(line);
    }

    return {
      notes: keptLines.join("\n").trim(),
      photoUrl,
    };
  }
}
