import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminOnlyGuard } from "../auth/guards/admin-only.guard";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { RuntimeConfigService } from "./config.service";

@Controller("config")
export class RuntimeConfigController {
  constructor(private readonly runtimeConfigService: RuntimeConfigService) {}

  @Get("app")
  getAppConfig() {
    return this.runtimeConfigService.getAppConfig();
  }

  @Get("auth")
  getAuthConfig() {
    return this.runtimeConfigService.getAuthConfig();
  }

  @UseGuards(SessionAuthGuard)
  @Get("navigation")
  getNavigationConfig() {
    return this.runtimeConfigService.getNavigationConfig();
  }

  @UseGuards(SessionAuthGuard)
  @Get("permissions")
  getPermissionsConfig() {
    return this.runtimeConfigService.getPermissionsConfig();
  }

  @UseGuards(SessionAuthGuard, AdminOnlyGuard)
  @Get("workflows")
  getWorkflowConfig() {
    return this.runtimeConfigService.getWorkflowConfig();
  }

  @UseGuards(SessionAuthGuard, AdminOnlyGuard)
  @Get("dictionaries")
  getDictionariesConfig() {
    return this.runtimeConfigService.getDictionariesConfig();
  }
}
