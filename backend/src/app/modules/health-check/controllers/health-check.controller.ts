import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '../services/health-check.service';

@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) { }

  @Get()
  getStatus() {
    return this.healthCheckService.getStatus();
  }

  @Get('version')
  getVersion() {
    return this.healthCheckService.getVersion();
  }
}