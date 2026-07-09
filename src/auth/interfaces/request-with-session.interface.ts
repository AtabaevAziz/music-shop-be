import { Request } from 'express';
import { SessionDto } from '../types/session.dto';

export interface RequestWithSession extends Request {
  currentSession?: SessionDto;
  cookies: Record<string, string | undefined>;
}

