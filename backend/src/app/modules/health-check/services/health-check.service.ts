import { Injectable } from '@nestjs/common';
import { buildInfo } from '../../../../build-info';

@Injectable()
export class HealthCheckService {
  getStatus() {
    return {
      status: 'ok',
      service: buildInfo.service,
      version: buildInfo.version,
      commit: buildInfo.commit,
      builtAt: buildInfo.builtAt,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  getVersion() {
    return buildInfo;
  }
}
