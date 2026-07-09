import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Customer } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

type CustomerWire = {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: string;
  status: string;
  notes: string;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(): Promise<CustomerWire[]> {
    const customers = await this.prisma.customer.findMany({
      orderBy: [{ name: 'asc' }]
    });

    return customers.map((customer) => this.toWire(customer));
  }

  async getCustomerById(id: string): Promise<CustomerWire> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

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

  private toWire(customer: Customer): CustomerWire {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      tier: customer.tier,
      status: customer.status,
      notes: customer.notes
    };
  }
}
