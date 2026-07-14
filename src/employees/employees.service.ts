import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Employee } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { Role } from '../common/enums/role.enum';
import { createId } from '../common/utils/id.util';
import { PrismaService } from '../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

type EmployeeWire = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async listEmployees(): Promise<EmployeeWire[]> {
    const employees = await this.prisma.employee.findMany({
      orderBy: [{ name: 'asc' }]
    });

    return employees.map((employee) => this.toWire(employee));
  }

  async createEmployee(payload: CreateEmployeeDto): Promise<EmployeeWire> {
    await this.assertUniqueEmail(payload.email);

    const normalizedEmail = payload.email.trim().toLowerCase();
    const employee = await this.prisma.employee.create({
      data: {
        id: createId('employee'),
        name: payload.name.trim(),
        login: null,
        email: normalizedEmail,
        phone: payload.phone.trim(),
        role: (payload.role ?? Role.Admin) as never,
        status: payload.status.trim(),
        passwordHash: await bcrypt.hash(normalizedEmail, 10)
      }
    });

    return this.toWire(employee);
  }

  async updateEmployee(id: string, payload: UpdateEmployeeDto): Promise<EmployeeWire> {
    const existing = await this.prisma.employee.findUnique({ where: { id } });

    if (!existing) {
      throw ApiException.notFound('Employee was not found.');
    }

    if (payload.email) {
      await this.assertUniqueEmail(payload.email, existing.id);
    }

    const normalizedEmail = payload.email?.trim().toLowerCase();
    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        email: normalizedEmail,
        phone: payload.phone?.trim(),
        role: payload.role ? (payload.role as never) : undefined,
        status: payload.status?.trim(),
        ...(normalizedEmail && normalizedEmail !== existing.email
          ? { passwordHash: await bcrypt.hash(normalizedEmail, 10) }
          : {})
      }
    });

    return this.toWire(employee);
  }

  async deleteEmployee(id: string): Promise<void> {
    const existing = await this.prisma.employee.findUnique({ where: { id } });

    if (!existing) {
      throw ApiException.notFound('Employee was not found.');
    }

    await this.prisma.employee.delete({ where: { id } });
  }

  private async assertUniqueEmail(email: string, employeeId?: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.employee.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing && existing.id !== employeeId) {
      throw ApiException.conflict('Employee email must be unique.', 'email');
    }
  }

  private toWire(employee: Employee): EmployeeWire {
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      status: employee.status
    };
  }
}
