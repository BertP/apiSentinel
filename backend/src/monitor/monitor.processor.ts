import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MonitorEngineService } from './monitor-engine/monitor-engine.service';
import { MonitorController } from './monitor.controller';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
import { ConfigService } from '@nestjs/config';
import { OauthManagerService } from './oauth-manager/oauth-manager.service';

@Processor('monitor')
export class MonitorProcessor {
  private readonly logger = new Logger(MonitorProcessor.name);

  constructor(
    private readonly monitorEngine: MonitorEngineService,
    private readonly configService: ConfigService,
    private readonly oauthManager: OauthManagerService,
    @InjectRepository(MonitorLog)
    private readonly logRepository: Repository<MonitorLog>,
  ) { }

  @Process('auth-check')
  async handleAuthCheck(job: Job<any>) {
    this.logger.log(`Processing ${job.name} job...`);
    await this.oauthManager.testLogin();
  }

  @Process('check')
  async handleCheck(job: Job<any>) {
    const { path, method } = job.data;

    // Priority: env variable > default
    const baseUrl =
      this.configService.get<string>('API_BASE_URL') ||
      'https://api.mcs3.miele.com/v1';

    this.logger.log(`Processing check for ${method} ${path} on ${baseUrl}`);

    const result = await this.monitorEngine.checkEndpoint(baseUrl, {
      path,
      method,
    });

    const log = this.logRepository.create({
      path,
      method,
      statusCode: result.status,
      latency: result.latency,
      success: result.success,
      error: result.error,
      validationResult: (result as any).validationResult,
      validationError: (result as any).validationError,
    });

    await this.logRepository.save(log);
    MonitorController.pushLog(log);

    this.logger.log(`Job ${job.id} completed. Saved log entry.`);
  }
}
