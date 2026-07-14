import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(SessionAuthGuard, AdminOnlyGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary() {
    return this.financeService.getSummary();
  }
}
