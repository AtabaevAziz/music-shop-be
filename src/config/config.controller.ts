import { Controller, Get } from '@nestjs/common';
import { RuntimeConfigService } from './config.service';

@Controller('config')
export class RuntimeConfigController {
  constructor(private readonly runtimeConfigService: RuntimeConfigService) {}

  @Get('app')
  getAppConfig() {
    return this.runtimeConfigService.getAppConfig();
  }

  @Get('auth')
  getAuthConfig() {
    return this.runtimeConfigService.getAuthConfig();
  }

  @Get('navigation')
  getNavigationConfig() {
    return this.runtimeConfigService.getNavigationConfig();
  }

  @Get('permissions')
  getPermissionsConfig() {
    return this.runtimeConfigService.getPermissionsConfig();
  }

  @Get('workflows')
  getWorkflowConfig() {
    return this.runtimeConfigService.getWorkflowConfig();
  }

  @Get('dictionaries')
  getDictionariesConfig() {
    return this.runtimeConfigService.getDictionariesConfig();
  }
}

