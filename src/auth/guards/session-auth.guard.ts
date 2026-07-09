import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { SessionService } from '../session.service';
import { RequestWithSession } from '../interfaces/request-with-session.interface';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = await this.sessionService.resolveRequestSession(request.cookies);

    if (!session) {
      throw ApiException.unauthorized('Authentication is required.');
    }

    request.currentSession = session;
    return true;
  }
}

