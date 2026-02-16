import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MonitorEngineService } from './monitor-engine/monitor-engine.service';
import { MonitorController } from './monitor.controller';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
import { ConfigService } from '@nestjs/config';
import { MonitorConfigService } from './monitor-config.service';
import { MailService } from './mail/mail.service';

@Injectable()
@Processor('monitor')
export class MonitorProcessor {
  private readonly logger = new Logger(MonitorProcessor.name);

  constructor(
    @InjectRepository(MonitorLog)
    private readonly logRepository: Repository<MonitorLog>,
    private readonly monitorEngine: MonitorEngineService,
    private readonly configService: ConfigService,
    private readonly monitorConfig: MonitorConfigService,
    private readonly mailService: MailService,
  ) { }

  @Process('check')
  async handleCheck(job: Job<{ path: string; method: string }>) {
    const { path, method } = job.data;

    // Priority: env variable > default
    const baseUrl =
      this.configService.get<string>('MIELE_API_BASE_URL') ||
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

    // Alert Handling
    if (!result.success) {
      const config = this.monitorConfig.getConfig();
      if (config.alertEndpoints.includes(path) && config.emailRecipients.length > 0) {
        this.logger.log(`Failure detected on alert-endpoint ${path}. Triggering email.`);
        await this.mailService.sendAlertEmail(
          config.emailRecipients,
          `${method} ${path}`,
          result.error || `HTTP ${result.status}`,
        );
      }
    }

    MonitorController.pushLog(log);

    this.logger.log(`Job ${job.id} completed. Saved log entry.`);
  }

  @Process('daily-report')
  async handleDailyReport(job: Job<any>) {
    this.logger.log(`Generating daily report (Job ${job.id})...`);

    // Get last 24h logs
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await this.logRepository.find({
      where: { timestamp: MoreThan(threshold) },
    });

    if (logs.length === 0) {
      this.logger.log('No logs found for the last 24h. Skipping report.');
      return;
    }

    const statsMap: Record<string, any> = {};
    logs.forEach((log) => {
      const key = `${log.method} ${log.path}`;
      if (!statsMap[key]) {
        statsMap[key] = {
          path: log.path,
          method: log.method,
          count: 0,
          successCount: 0,
          avgLatency: 0,
        };
      }
      statsMap[key].count++;
      if (log.success) statsMap[key].successCount++;
      statsMap[key].avgLatency =
        (statsMap[key].avgLatency * (statsMap[key].count - 1) + log.latency) /
        statsMap[key].count;
    });

    const stats = Object.values(statsMap).map((s) => ({
      ...s,
      successRate: (s.successCount / s.count) * 100,
    }));

    const config = this.monitorConfig.getConfig();
    if (config.emailRecipients.length > 0) {
      await this.mailService.sendDailyReport(config.emailRecipients, stats);
    }
  }
}
