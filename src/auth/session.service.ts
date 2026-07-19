import { Injectable } from '@nestjs/common';
import { Customer, Employee, PrincipalType, Session } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { createId } from '../common/utils/id.util';
import {
  DEFAULT_SESSION_COOKIE_NAME,
  DEFAULT_SESSION_COOKIE_SAME_SITE,
  DEFAULT_SESSION_TTL_HOURS
} from '../common/constants/auth.constants';
import { PrismaService } from '../database/prisma.service';
import { SessionDto } from './types/session.dto';
import { Role } from '../common/enums/role.enum';

type SessionRecord = Session & {
  employee: Employee | null;
  customer: Customer | null;
};

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  get cookieName(): string {
    return this.configService.get<string>('SESSION_COOKIE_NAME') ?? DEFAULT_SESSION_COOKIE_NAME;
  }

  get sessionTtlMs(): number {
    const ttlHours =
      this.configService.get<number>('SESSION_TTL_HOURS') ?? DEFAULT_SESSION_TTL_HOURS;
    return ttlHours * 60 * 60 * 1000;
  }

  get secureCookie(): boolean {
    return (this.configService.get<string>('SESSION_SECURE_COOKIE') ?? 'false') === 'true';
  }

  get sameSiteCookie(): 'lax' | 'strict' | 'none' {
    const configuredValue =
      this.configService.get<string>('SESSION_COOKIE_SAME_SITE') ??
      DEFAULT_SESSION_COOKIE_SAME_SITE;
    const normalizedValue = configuredValue.trim().toLowerCase();

    if (normalizedValue === 'strict' || normalizedValue === 'none') {
      return normalizedValue;
    }

    return 'lax';
  }

  get cookieDomain(): string | undefined {
    const configuredValue = this.configService.get<string>('SESSION_COOKIE_DOMAIN');
    const normalizedValue = configuredValue?.trim();
    return normalizedValue ? normalizedValue : undefined;
  }

  async createEmployeeSession(employee: Employee): Promise<{ sessionId: string; session: SessionDto }> {
    const sessionId = createId('session');
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        principalType: PrincipalType.employee,
        employeeId: employee.id,
        expiresAt
      }
    });

    return {
      sessionId,
      session: {
        role: employee.role as Role,
        name: employee.name
      }
    };
  }

  async createCustomerSession(customer: Customer): Promise<{ sessionId: string; session: SessionDto }> {
    const sessionId = createId('session');
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        principalType: PrincipalType.customer,
        customerId: customer.id,
        expiresAt
      }
    });

    return {
      sessionId,
      session: {
        role: Role.Client,
        name: customer.name,
        customerId: customer.id
      }
    };
  }

  async resolveRequestSession(cookies: Record<string, string | undefined>): Promise<SessionDto | null> {
    const sessionId = cookies[this.cookieName];

    if (!sessionId) {
      return null;
    }

    const sessionRecord = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        employee: true,
        customer: true
      }
    });

    return this.normalizeSession(sessionRecord);
  }

  async clearSession(sessionId: string | undefined): Promise<void> {
    if (!sessionId) {
      return;
    }

    await this.prisma.session.deleteMany({
      where: { id: sessionId }
    });
  }

  private async normalizeSession(sessionRecord: SessionRecord | null): Promise<SessionDto | null> {
    if (!sessionRecord) {
      return null;
    }

    if (sessionRecord.expiresAt.getTime() <= Date.now()) {
      await this.clearSession(sessionRecord.id);
      return null;
    }

    if (sessionRecord.principalType === PrincipalType.employee) {
      if (!sessionRecord.employee || sessionRecord.employee.status !== 'active') {
        await this.clearSession(sessionRecord.id);
        return null;
      }

      return {
        role: sessionRecord.employee.role as Role,
        name: sessionRecord.employee.name
      };
    }

    if (!sessionRecord.customer || sessionRecord.customer.status !== 'active') {
      await this.clearSession(sessionRecord.id);
      return null;
    }

    return {
      role: Role.Client,
      name: sessionRecord.customer.name,
      customerId: sessionRecord.customer.id
    };
  }
}
