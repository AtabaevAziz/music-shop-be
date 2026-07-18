import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'music-shop-be',
      apiPrefix: '/api/v1',
      timestamp: new Date().toISOString()
    };
  }
}
