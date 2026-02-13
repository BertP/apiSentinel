import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { OpenapiParserService } from './openapi-parser/openapi-parser.service';
import { ConfigService } from '@nestjs/config';
import { MonitorConfigService } from './monitor-config.service';
import * as path from 'path';

@Injectable()
export class TaskSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectQueue('monitor') private readonly monitorQueue: Queue,
    private readonly openapiParser: OpenapiParserService,
    private readonly configService: ConfigService,
    private readonly monitorConfig: MonitorConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing monitoring tasks...');
    await this.scheduleTasks();

    // Listen for dynamic updates
    this.monitorConfig.configUpdates$.subscribe(() => {
      this.logger.log('Configuration changed, rescheduling tasks...');
      this.scheduleTasks();
    });
  }

  async scheduleTasks() {
    try {
      const specPath = path.join(process.cwd(), '..', 'openapi.yaml');
      const api = await this.openapiParser.parseDefinition(specPath);
      const allEndpoints = this.openapiParser.extractEndpoints(api);

      const activePaths = this.monitorConfig.getConfig().activeEndpoints;
      const endpoints = allEndpoints.filter((e) =>
        activePaths.includes(e.path),
      );
      const interval =
        this.configService.get<number>('MONITOR_INTERVAL_MS') || 60000;

      this.logger.log(
        `Scheduling ${endpoints.length} endpoints with ${interval}ms interval`,
      );

      // Clear existing repeatable jobs to avoid duplicates on restart
      const jobs = await this.monitorQueue.getRepeatableJobs();
      for (const job of jobs) {
        await this.monitorQueue.removeRepeatableByKey(job.key);
      }

      for (const endpoint of endpoints) {
        await this.monitorQueue.add(
          'check',
          { path: endpoint.path, method: endpoint.method },
          {
            repeat: { every: Number(interval) },
            jobId: `${endpoint.method}-${endpoint.path}`,
          },
        );
        this.logger.log(`Scheduled: ${endpoint.method} ${endpoint.path}`);
      }

      // 6-hour auth health check
      const authInterval = 6 * 60 * 60 * 1000; // 6 hours
      await this.monitorQueue.add(
        'auth-check',
        {},
        {
          repeat: { every: authInterval },
          jobId: 'auth-health-check',
        },
      );
      this.logger.log('Scheduled: OAuth2 health check (6h interval)');
    } catch (error) {
      this.logger.error(`Failed to schedule tasks: ${error.message}`);
    }
  }
}
