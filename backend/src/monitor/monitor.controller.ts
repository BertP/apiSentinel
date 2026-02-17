import {
  Controller,
  Get,
  Query,
  Sse,
  MessageEvent,
  Post,
  Body,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
import { AuthLog } from './entities/auth-log.entity';
import { MonitorEngineService } from './monitor-engine/monitor-engine.service';
import { Subject, ReplaySubject, Observable, map } from 'rxjs';
import { MonitorConfigService } from './monitor-config.service';
import { OpenapiParserService } from './openapi-parser/openapi-parser.service';
import { OauthManagerService } from './oauth-manager/oauth-manager.service';
import { MailService } from './mail/mail.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as path from 'path';

@Controller('monitor')
export class MonitorController {
  private static readonly logSubject = new ReplaySubject<MonitorLog>(10);

  constructor(
    @InjectRepository(MonitorLog)
    private readonly logRepository: Repository<MonitorLog>,
    @InjectRepository(AuthLog)
    private readonly authLogRepository: Repository<AuthLog>,
    private readonly configService: MonitorConfigService,
    private readonly openapiParser: OpenapiParserService,
    private readonly oauthManager: OauthManagerService,
    private readonly monitorEngine: MonitorEngineService,
    @InjectQueue('monitor') private readonly monitorQueue: Queue,
    private readonly mailService: MailService,
  ) { }

  static pushLog(log: MonitorLog) {
    this.logSubject.next(log);
  }

  @Get('oauth-status')
  getOAuthStatus() {
    return this.oauthManager.getTokenStatus();
  }

  @Post('test-auth')
  async testAuth() {
    const success = await this.oauthManager.testLogin();
    return { success };
  }

  @Get('auth-stats')
  async getAuthStats() {
    const logs = await this.authLogRepository.find({
      order: { timestamp: 'DESC' },
      take: 50,
    });

    const successCount = logs.filter((l) => l.success).length;
    const totalCount = logs.length;

    return {
      history: logs,
      stats: {
        totalChecks: totalCount,
        successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
        lastCheck: logs[0] || null,
      },
    };
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    return MonitorController.logSubject
      .asObservable()
      .pipe(map((log) => ({ data: log }) as MessageEvent));
  }

  @Get('logs')
  async getLogs(@Query('limit') limit = 100) {
    return this.logRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  @Get('stats')
  async getStats() {
    const logs = await this.logRepository.find({
      order: { timestamp: 'DESC' },
      take: 1000,
    });

    // Group by path and method for overview
    const stats: Record<string, any> = {};
    logs.forEach((log) => {
      const key = `${log.method} ${log.path}`;
      if (!stats[key]) {
        stats[key] = {
          path: log.path,
          method: log.method,
          count: 0,
          successCount: 0,
          avgLatency: 0,
          lastStatus: log.statusCode,
          lastTimestamp: log.timestamp,
          deviceId: log.deviceId,
        };
      }
      stats[key].count++;
      if (log.success) stats[key].successCount++;
      stats[key].avgLatency =
        (stats[key].avgLatency * (stats[key].count - 1) + log.latency) /
        stats[key].count;
    });

    return Object.values(stats);
  }

  @Get('account-overview')
  async getAccountOverview() {
    const baseUrl = process.env.MIELE_API_BASE_URL || 'https://api.mcs3.miele.com/v1';
    return this.monitorEngine.getAccountOverview(baseUrl);
  }

  @Get('available-endpoints')
  async getAvailableEndpoints() {
    // Path to the master openapi.yaml in the root directory
    const specPath = path.join(process.cwd(), '..', 'openapi.yaml');
    const api = await this.openapiParser.parseDefinition(specPath);
    return this.openapiParser.extractEndpoints(api);
  }

  @Get('config')
  getConfig() {
    return this.configService.getConfig();
  }

  @Post('config')
  async updateConfig(
    @Body()
    config: {
      manualToken?: string;
      activeEndpoints: string[];
      emailRecipients: string[];
      alertEndpoints: string[];
      deviceId: string;
      stateAutomationEnabled: boolean;
    },
  ) {
    this.configService.updateConfig(config);
    return { success: true, config: this.configService.getConfig() };
  }

  @Post('trigger-report')
  async triggerReport() {
    await this.monitorQueue.add('daily-report', {});
    return { success: true, message: 'Statistics report queued' };
  }

  @Get('verify-smtp')
  async verifySmtp() {
    return await this.mailService.verifyConnection();
  }
}
