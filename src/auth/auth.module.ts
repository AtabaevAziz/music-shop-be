import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientOnlyGuard } from './guards/client-only.guard';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { SessionService } from './session.service';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionAuthGuard, AdminOnlyGuard, ClientOnlyGuard],
  exports: [SessionService, SessionAuthGuard, AdminOnlyGuard, ClientOnlyGuard]
})
export class AuthModule {}
