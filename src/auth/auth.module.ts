import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientOnlyGuard } from './guards/client-only.guard';
import { SessionService } from './session.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { StaffOnlyGuard } from './guards/staff-only.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionAuthGuard, StaffOnlyGuard, ClientOnlyGuard],
  exports: [SessionService, SessionAuthGuard, StaffOnlyGuard, ClientOnlyGuard]
})
export class AuthModule {}
