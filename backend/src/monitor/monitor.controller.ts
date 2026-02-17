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
import { MonitorSSEService } from './monitor-sse.service';
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
    private readonly monitorSSE: MonitorSSEService,
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
    const config = this.configService.getConfig();
    const activePaths = config.activeEndpoints;

    if (activePaths.length === 0) {
      return [];
    }

    const stats = await this.logRepository
      .createQueryBuilder('log')
      .where('log.path IN (:...activePaths)', { activePaths })
      .select([
        'log.path',
        'log.method',
        'COUNT(log.id) as count',
        'SUM(CASE WHEN log.success = true THEN 1 ELSE 0 END) as "successCount"',
        'AVG(log.latency) as "avgLatency"',
        'MAX(log.timestamp) as "lastTimestamp"',
      ])
      .groupBy('log.path')
      .addGroupBy('log.method')
      .getRawMany();

    const enrichedStats = await Promise.all(stats.map(async s => {
      const latest = await this.logRepository.findOne({
        where: { path: s.log_path, method: s.log_method },
        order: { timestamp: 'DESC' },
        select: ['statusCode', 'deviceId']
      });

      return {
        path: s.log_path,
        method: s.log_method,
        count: parseInt(s.count),
        successCount: parseInt(s.successCount),
        avgLatency: parseFloat(s.avgLatency),
        lastStatus: latest?.statusCode || 0,
        lastTimestamp: s.lastTimestamp,
        deviceId: latest?.deviceId
      };
    }));

    return enrichedStats;
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

  @Post('sse/start')
  async startSSE(@Body('path') path?: string) {
    await this.monitorSSE.startMonitoring(path);
    return { success: true, message: `SSE Monitoring started for ${path || 'all devices'}` };
  }

  @Post('sse/stop')
  async stopSSE(@Body('path') path: string) {
    this.monitorSSE.stopMonitoring(path);
    return { success: true, message: `SSE Monitoring stopped for ${path}` };
  }

  @Sse('sse/raw')
  sseRaw(): Observable<MessageEvent> {
    return this.monitorSSE.rawEventSubject
      .asObservable()
      .pipe(map((event) => ({ data: event }) as MessageEvent));
  }

  @Get('sse-viewer')
  getSSEViewer() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API SENTINEL | Live SSE Terminal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'JetBrains+Mono', monospace; }
        .log-entry:hover { background: rgba(59, 130, 246, 0.05); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
    </style>
</head>
<body class="bg-[#020617] text-slate-300 min-h-screen flex flex-col overflow-hidden">
    <header class="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
            <div class="bg-blue-600 p-1 rounded shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h1 class="text-sm font-black tracking-widest text-slate-100 uppercase italic">Live SSE Terminal</h1>
        </div>
        <div class="flex items-center gap-4">
            <div id="status" class="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Connecting...</span>
            </div>
            <button onclick="clearLogs()" class="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Clear</button>
        </div>
    </header>

    <div id="logs" class="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
        <!-- Logs will appear here -->
    </div>

    <script>
        const logsContainer = document.getElementById('logs');
        const statusContainer = document.getElementById('status');
        const eventSource = new EventSource('/monitor/sse/raw');

        eventSource.onopen = () => {
            statusContainer.innerHTML = \`<div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div><span class="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Streaming Live</span>\`;
        };

        eventSource.onerror = () => {
            statusContainer.innerHTML = \`<div class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div><span class="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Connection Failed</span>\`;
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            addLog(data.path, data.data);
        };

        function addLog(path, content) {
            const entry = document.createElement('div');
            entry.className = 'log-entry py-2 px-3 rounded border border-transparent hover:border-slate-800 transition-all duration-200 group';
            
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch {
                parsed = content;
            }

            const timestamp = new Date().toLocaleTimeString();
            
            entry.innerHTML = \`
                <div class="flex items-start gap-4">
                    <span class="text-slate-600 font-bold shrink-0 uppercase tracking-tighter text-[10px] mt-0.5">\${timestamp}</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-blue-500 font-black text-[10px] brightness-125 uppercase tracking-widest">SSE_UPDATE</span>
                            <span class="text-slate-500 font-mono text-[10px]">\${path}</span>
                        </div>
                        <pre class="text-slate-300 font-mono whitespace-pre-wrap break-all">\${JSON.stringify(parsed, null, 2)}</pre>
                    </div>
                </div>
            \`;

            logsContainer.appendChild(entry);
            logsContainer.scrollTop = logsContainer.scrollHeight;

            // Keep only last 100 entries to prevent memory leak
            if (logsContainer.children.length > 100) {
                logsContainer.removeChild(logsContainer.firstChild);
            }
        }

        function clearLogs() {
            logsContainer.innerHTML = '';
        }
    </script>
</body>
</html>
    `;
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
