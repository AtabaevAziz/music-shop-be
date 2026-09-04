import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception';
import { Role } from '../common/enums/role.enum';
import { createId } from '../common/utils/id.util';
import { EmployeeEntity } from '../database/entities';
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
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>
  ) {}

  async listEmployees(): Promise<EmployeeWire[]> {
    const employees = await this.employeeRepository.find({
      order: { name: 'ASC' }
    });

    return employees.map((employee) => this.toWire(employee));
  }

  async createEmployee(payload: CreateEmployeeDto): Promise<EmployeeWire> {
    await this.assertUniqueEmail(payload.email);

    const normalizedEmail = payload.email.trim().toLowerCase();
    const employee = await this.employeeRepository.save(
      this.employeeRepository.create({
        id: createId('employee'),
        name: payload.name.trim(),
        login: null,
        email: normalizedEmail,
        phone: payload.phone.trim(),
        role: payload.role ?? Role.Admin,
        status: payload.status.trim(),
        passwordHash: await bcrypt.hash(normalizedEmail, 10)
      })
    );

    return this.toWire(employee);
  }

  async updateEmployee(id: string, payload: UpdateEmployeeDto): Promise<EmployeeWire> {
    const existing = await this.employeeRepository.findOneBy({ id });

    if (!existing) {
      throw ApiException.notFound('Employee was not found.');
    }

    if (payload.email) {
      await this.assertUniqueEmail(payload.email, existing.id);
    }

    const normalizedEmail = payload.email?.trim().toLowerCase();
    const employee = await this.employeeRepository.save({
      ...existing,
      name: payload.name?.trim() ?? existing.name,
      email: normalizedEmail ?? existing.email,
      phone: payload.phone?.trim() ?? existing.phone,
      role: payload.role ?? existing.role,
      status: payload.status?.trim() ?? existing.status,
      passwordHash:
        normalizedEmail && normalizedEmail !== existing.email
          ? await bcrypt.hash(normalizedEmail, 10)
          : existing.passwordHash
    });

    return this.toWire(employee);
  }

  async deleteEmployee(id: string): Promise<void> {
    const existing = await this.employeeRepository.findOneBy({ id });

    if (!existing) {
      throw ApiException.notFound('Employee was not found.');
    }

    await this.employeeRepository.delete({ id });
  }

  private async assertUniqueEmail(email: string, employeeId?: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.employeeRepository.findOneBy({ email: normalizedEmail });

    if (existing && existing.id !== employeeId) {
      throw ApiException.conflict('Employee email must be unique.', 'email');
    }
  }

  private toWire(employee: EmployeeEntity): EmployeeWire {
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
