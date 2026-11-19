import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    const memory = process.memoryUsage();

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
    };
  }
}