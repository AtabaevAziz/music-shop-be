import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ApiException } from '../common/exceptions/api.exception';
import * as bcrypt from 'bcrypt';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService
  ) {}

  async login(payload: LoginDto): Promise<{ sessionId: string; session: { role: string; name: string; customerId?: string } }> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ login: payload.login }, { email: payload.login }]
      }
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

    const customer = await this.prisma.customer.findUnique({
      where: { email: payload.login }
    });

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
}

