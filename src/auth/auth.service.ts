import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { ApiException } from '../common/exceptions/api.exception';
import * as bcrypt from 'bcrypt';
import { SessionService } from './session.service';
import { createId } from '../common/utils/id.util';
import { CustomerTier } from '../common/enums/customer-tier.enum';
import { CustomerEntity, EmployeeEntity } from '../database/entities';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly sessionService: SessionService
  ) {}

  async login(payload: LoginDto): Promise<{ sessionId: string; session: { role: string; name: string; customerId?: string } }> {
    const normalizedLogin = payload.login.trim().toLowerCase();

    const employee = await this.employeeRepository.findOne({
      where: [{ login: normalizedLogin }, { email: normalizedLogin }]
    });

    if (employee) {
      const passwordMatches = await bcrypt.compare(payload.password, employee.passwordHash);

      if (!passwordMatches) {
        throw ApiException.unauthorized('Invalid login or password.');
      }

      if (employee.status !== 'active') {
        throw ApiException.forbidden('Employee is inactive.');
      }

      return this.sessionService.createEmployeeSession(employee);
    }

    const customer = await this.customerRepository.findOneBy({ email: normalizedLogin });

    if (!customer) {
      throw ApiException.unauthorized('Invalid login or password.');
    }

    const passwordMatches = await bcrypt.compare(payload.password, customer.passwordHash);

    if (!passwordMatches) {
      throw ApiException.unauthorized('Invalid login or password.');
    }

    if (customer.status !== 'active') {
      throw ApiException.forbidden('Client is inactive.');
    }

    return this.sessionService.createCustomerSession(customer);
  }

  async register(payload: RegisterDto): Promise<{ sessionId: string; session: { role: string; name: string; customerId?: string } }> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedName = payload.name.trim();
    const normalizedPhone = payload.phone.trim();

    const [employeeConflict, customerConflict] = await Promise.all([
      this.employeeRepository.findOne({
        where: [{ email: normalizedEmail }, { login: normalizedEmail }],
        select: { id: true }
      }),
      this.customerRepository.findOne({
        where: { email: normalizedEmail },
        select: { id: true }
      })
    ]);

    if (employeeConflict || customerConflict) {
      throw ApiException.conflict('A user with this email already exists.', 'email');
    }

    const customer = await this.customerRepository.save(
      this.customerRepository.create({
        id: createId('customer'),
        name: normalizedName,
        fullName: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        tier: CustomerTier.Standard,
        status: 'active',
        notes: 'Created from public self-signup flow',
        passwordHash: await bcrypt.hash(payload.password, 10)
      })
    );

    return this.sessionService.createCustomerSession(customer);
  }
}
