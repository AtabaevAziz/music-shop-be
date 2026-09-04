import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../common/utils/id.util';
import {
  DEFAULT_SESSION_COOKIE_NAME,
  DEFAULT_SESSION_COOKIE_SAME_SITE,
  DEFAULT_SESSION_TTL_HOURS
} from '../common/constants/auth.constants';
import { SessionDto } from './types/session.dto';
import { Role } from '../common/enums/role.enum';
import { PrincipalType } from '../common/enums/principal-type.enum';
import { CustomerEntity, EmployeeEntity, SessionEntity } from '../database/entities';

type SessionRecord = SessionEntity & {
  employee: EmployeeEntity | null;
  customer: CustomerEntity | null;
};

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
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

  async createEmployeeSession(employee: EmployeeEntity): Promise<{ sessionId: string; session: SessionDto }> {
    const sessionId = createId('session');
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.sessionRepository.save(
      this.sessionRepository.create({
        id: sessionId,
        principalType: PrincipalType.Employee,
        employeeId: employee.id,
        expiresAt
      })
    );

    return {
      sessionId,
      session: {
        role: employee.role as Role,
        name: employee.name,
        employeeId: employee.id
      }
    };
  }

  async createCustomerSession(customer: CustomerEntity): Promise<{ sessionId: string; session: SessionDto }> {
    const sessionId = createId('session');
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.sessionRepository.save(
      this.sessionRepository.create({
        id: sessionId,
        principalType: PrincipalType.Customer,
        customerId: customer.id,
        expiresAt
      })
    );

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

    const sessionRecord = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: {
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

    await this.sessionRepository.delete({ id: sessionId });
  }

  private async normalizeSession(sessionRecord: SessionRecord | null): Promise<SessionDto | null> {
    if (!sessionRecord) {
      return null;
    }

    if (sessionRecord.expiresAt.getTime() <= Date.now()) {
      await this.clearSession(sessionRecord.id);
      return null;
    }

    if (sessionRecord.principalType === PrincipalType.Employee) {
      if (!sessionRecord.employee || sessionRecord.employee.status !== 'active') {
        await this.clearSession(sessionRecord.id);
        return null;
      }

      return {
        role: sessionRecord.employee.role as Role,
        name: sessionRecord.employee.name,
        employeeId: sessionRecord.employee.id
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
