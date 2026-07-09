import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { ApiException } from '../../common/exceptions/api.exception';
import { RequestWithSession } from '../interfaces/request-with-session.interface';

@Injectable()
export class ClientOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = request.currentSession;

    if (!session || session.role !== Role.Client || !session.customerId) {
      throw ApiException.forbidden('Client access is required.');
    }

    return true;
  }
}

