import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Customer, Prisma } from '@prisma/client';
import { CustomerTier } from '../common/enums/customer-tier.enum';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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

type CustomerWithCounts = Prisma.CustomerGetPayload<{
  include: {
    _count: {
      select: {
        orders: true;
        repairs: true;
      };
    };
  };
}>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(): Promise<CustomerWire[]> {
    const customers = await this.prisma.customer.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            repairs: true
          }
        }
      },
      orderBy: [{ name: 'asc' }]
    });

    return customers.map((customer) => this.toWire(customer));
  }

  async getCustomerById(id: string): Promise<CustomerWire> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            repairs: true
          }
        }
      }
    });

    if (!customer) {
      throw ApiException.notFound('Customer was not found.');
    }

    return this.toWire(customer);
  }

  async getActiveCustomerById(id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw ApiException.notFound('Customer was not found.');
    }

    if (customer.status !== 'active') {
      throw ApiException.forbidden('Client is inactive.');
    }

    return customer;
  }

  async createCustomer(payload: CreateCustomerDto): Promise<CustomerWire> {
    await this.assertUniqueEmail(payload.email);

    const customer = await this.prisma.customer.create({
      data: {
        id: createId('customer'),
        name: payload.name.trim(),
        fullName: payload.fullName?.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim().toLowerCase(),
        tier: payload.tier as never,
        status: payload.status.trim(),
        notes: payload.notes.trim(),
        passwordHash: await bcrypt.hash(payload.email.trim().toLowerCase(), 10)
      }
    });

    return this.toWire(customer);
  }

  async findOrCreatePublicCustomer(payload: {
    name: string;
    phone: string;
    email?: string;
  }): Promise<Customer> {
    const normalizedName = payload.name.trim();
    const normalizedPhone = payload.phone.trim();
    const normalizedEmail =
      payload.email?.trim().toLowerCase() || this.buildGuestEmail(normalizedPhone);

    const customerByEmail = await this.prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (customerByEmail) {
      return this.prisma.customer.update({
        where: { id: customerByEmail.id },
        data: {
          name: normalizedName,
          fullName: normalizedName,
          phone: normalizedPhone,
          status: 'active'
        }
      });
    }

    const customerByPhone = await this.prisma.customer.findFirst({
      where: { phone: normalizedPhone },
      orderBy: [{ createdAt: 'desc' }]
    });

    if (customerByPhone) {
      return this.prisma.customer.update({
        where: { id: customerByPhone.id },
        data: {
          name: normalizedName,
          fullName: customerByPhone.fullName || normalizedName,
          email: customerByPhone.email || normalizedEmail,
          status: 'active'
        }
      });
    }

    return this.prisma.customer.create({
      data: {
        id: createId('customer'),
        name: normalizedName,
        fullName: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        tier: CustomerTier.Standard,
        status: 'active',
        notes: 'Created from public storefront flow',
        passwordHash: await bcrypt.hash(normalizedEmail, 10)
      }
    });
  }

  async updateCustomer(id: string, payload: UpdateCustomerDto): Promise<CustomerWire> {
    const existing = await this.prisma.customer.findUnique({ where: { id } });

    if (!existing) {
      throw ApiException.notFound('Customer was not found.');
    }

    if (payload.email) {
      await this.assertUniqueEmail(payload.email, existing.id);
    }

    const nextEmail = payload.email?.trim().toLowerCase();
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        fullName: payload.fullName?.trim(),
        phone: payload.phone?.trim(),
        email: nextEmail,
        tier: payload.tier as never,
        status: payload.status?.trim(),
        notes: payload.notes?.trim(),
        ...(nextEmail && nextEmail !== existing.email
          ? { passwordHash: await bcrypt.hash(nextEmail, 10) }
          : {})
      }
    });

    return this.toWire(customer);
  }

  async deleteCustomer(id: string): Promise<void> {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { select: { id: true }, take: 1 },
        repairs: { select: { id: true }, take: 1 }
      }
    });

    if (!existing) {
      throw ApiException.notFound('Customer was not found.');
    }

    if (existing.orders.length > 0 || existing.repairs.length > 0) {
      throw ApiException.conflict('Customer cannot be deleted while linked orders or repairs exist.');
    }

    await this.prisma.customer.delete({ where: { id } });
  }

  private async assertUniqueEmail(email: string, customerId?: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing && existing.id !== customerId) {
      throw ApiException.conflict('Customer email must be unique.', 'email');
    }
  }

  private toWire(customer: CustomerWithCounts | Customer): CustomerWire {
    const ordersCount = '_count' in customer ? customer._count.orders : 0;
    const repairsCount = '_count' in customer ? customer._count.repairs : 0;

    return {
      id: customer.id,
      name: customer.name,
      fullName: customer.fullName ?? customer.name,
      phone: customer.phone,
      email: customer.email,
      tier: customer.tier,
      status: customer.status,
      notes: customer.notes,
      ordersCount,
      repairsCount,
      registeredAt: customer.createdAt
    };
  }

  private buildGuestEmail(phone: string): string {
    const normalizedDigits = phone.replace(/\D+/g, '') || createId('guest');
    return `guest-${normalizedDigits}@public.music-service.local`;
  }
}
