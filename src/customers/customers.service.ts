import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerTier } from "../common/enums/customer-tier.enum";
import { ApiException } from "../common/exceptions/api.exception";
import { createId } from "../common/utils/id.util";
import { CustomerEntity } from "../database/entities";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

type CustomerWire = {
  id: string;
  name: string;
  fullName?: string;
  phone: string;
  email: string;
  tier: string;
  status: string;
  notes: string;
  ordersCount: number;
  repairsCount: number;
  registeredAt: Date;
};

type CustomerWithCounts = CustomerEntity & {
  ordersCount: number;
  repairsCount: number;
};

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async listCustomers(): Promise<CustomerWire[]> {
    const customers = await this.customerRepository.find({
      relations: {
        orders: true,
        repairs: true,
      },
      order: { name: "ASC" },
    });

    return customers.map((customer) =>
      this.toWire({
        ...customer,
        ordersCount: customer.orders.length,
        repairsCount: customer.repairs.length,
      }),
    );
  }

  async getCustomerById(id: string): Promise<CustomerWire> {
    const customer = await this.findCustomerWithCounts(id);

    if (!customer) {
      throw ApiException.notFound("Customer was not found.");
    }

    return this.toWire(customer);
  }

  async getActiveCustomerById(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findOneBy({ id });

    if (!customer) {
      throw ApiException.notFound("Customer was not found.");
    }

    if (customer.status !== "active") {
      throw ApiException.forbidden("Client is inactive.");
    }

    return customer;
  }

  async createCustomer(payload: CreateCustomerDto): Promise<CustomerWire> {
    await this.assertUniqueEmail(payload.email);

    const customer = await this.customerRepository.save(
      this.customerRepository.create({
        id: createId("customer"),
        name: payload.name.trim(),
        fullName: payload.fullName?.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim().toLowerCase(),
        tier: payload.tier,
        status: payload.status.trim(),
        notes: payload.notes.trim(),
        passwordHash: await bcrypt.hash(payload.email.trim().toLowerCase(), 10),
      }),
    );

    const createdCustomer = await this.findCustomerWithCounts(customer.id);

    if (!createdCustomer) {
      throw ApiException.notFound("Customer was not found after creation.");
    }

    return this.toWire(createdCustomer);
  }

  async findOrCreatePublicCustomer(payload: {
    name: string;
    phone: string;
    email?: string;
  }): Promise<CustomerEntity> {
    const normalizedName = payload.name.trim();
    const normalizedPhone = payload.phone.trim();
    const normalizedEmail =
      payload.email?.trim().toLowerCase() ||
      this.buildGuestEmail(normalizedPhone);

    const customerByEmail = await this.customerRepository.findOneBy({
      email: normalizedEmail,
    });

    if (customerByEmail) {
      return this.customerRepository.save({
        ...customerByEmail,
        name: normalizedName,
        fullName: normalizedName,
        phone: normalizedPhone,
        status: "active",
      });
    }

    const customerByPhone = await this.customerRepository.findOne({
      where: { phone: normalizedPhone },
      order: { createdAt: "DESC" },
    });

    if (customerByPhone) {
      return this.customerRepository.save({
        ...customerByPhone,
        name: normalizedName,
        fullName: customerByPhone.fullName || normalizedName,
        email: payload.email?.trim() ? normalizedEmail : customerByPhone.email,
        status: "active",
      });
    }

    return this.customerRepository.save(
      this.customerRepository.create({
        id: createId("customer"),
        name: normalizedName,
        fullName: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        tier: CustomerTier.Standard,
        status: "active",
        notes: "Created from public storefront flow",
        passwordHash: await bcrypt.hash(normalizedEmail, 10),
      }),
    );
  }

  async updateCustomer(
    id: string,
    payload: UpdateCustomerDto,
  ): Promise<CustomerWire> {
    const existing = await this.customerRepository.findOneBy({ id });

    if (!existing) {
      throw ApiException.notFound("Customer was not found.");
    }

    if (payload.email) {
      await this.assertUniqueEmail(payload.email, existing.id);
    }

    const nextEmail = payload.email?.trim().toLowerCase();
    const customer = await this.customerRepository.save({
      ...existing,
      name: payload.name?.trim() ?? existing.name,
      fullName: payload.fullName?.trim() ?? existing.fullName,
      phone: payload.phone?.trim() ?? existing.phone,
      email: nextEmail ?? existing.email,
      tier: payload.tier ?? existing.tier,
      status: payload.status?.trim() ?? existing.status,
      notes: payload.notes?.trim() ?? existing.notes,
      passwordHash:
        nextEmail && nextEmail !== existing.email
          ? await bcrypt.hash(nextEmail, 10)
          : existing.passwordHash,
    });

    const updatedCustomer = await this.findCustomerWithCounts(customer.id);

    if (!updatedCustomer) {
      throw ApiException.notFound("Customer was not found after update.");
    }

    return this.toWire(updatedCustomer);
  }

  async deleteCustomer(id: string): Promise<void> {
    const existing = await this.customerRepository.findOne({
      where: { id },
      relations: {
        orders: true,
        repairs: true,
      },
    });

    if (!existing) {
      throw ApiException.notFound("Customer was not found.");
    }

    if (existing.orders.length > 0 || existing.repairs.length > 0) {
      throw ApiException.conflict(
        "Customer cannot be deleted while linked orders or repairs exist.",
      );
    }

    await this.customerRepository.delete({ id });
  }

  private async assertUniqueEmail(
    email: string,
    customerId?: string,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.customerRepository.findOneBy({
      email: normalizedEmail,
    });

    if (existing && existing.id !== customerId) {
      throw ApiException.conflict("Customer email must be unique.", "email");
    }
  }

  private async findCustomerWithCounts(
    id: string,
  ): Promise<CustomerWithCounts | null> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: {
        orders: true,
        repairs: true,
      },
    });

    if (!customer) {
      return null;
    }

    return {
      ...customer,
      ordersCount: customer.orders.length,
      repairsCount: customer.repairs.length,
    };
  }

  private toWire(customer: CustomerWithCounts | CustomerEntity): CustomerWire {
    return {
      id: customer.id,
      name: customer.name,
      fullName: customer.fullName ?? customer.name,
      phone: customer.phone,
      email: customer.email,
      tier: customer.tier,
      status: customer.status,
      notes: customer.notes,
      ordersCount: "ordersCount" in customer ? customer.ordersCount : 0,
      repairsCount: "repairsCount" in customer ? customer.repairsCount : 0,
      registeredAt: customer.createdAt,
    };
  }

  private buildGuestEmail(phone: string): string {
    const normalizedDigits = phone.replace(/\D+/g, "") || createId("guest");
    return `guest-${normalizedDigits}@public.music-service.local`;
  }
}
