import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { ApiException } from '../../common/exceptions/api.exception';
import { RequestWithSession } from '../interfaces/request-with-session.interface';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = request.currentSession;

    if (!session || session.role !== Role.Admin) {
      throw ApiException.forbidden('Admin access is required.');
    }

    return true;
  }
}
