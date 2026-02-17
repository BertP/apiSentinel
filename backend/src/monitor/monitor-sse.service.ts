import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Subject } from 'rxjs';
import { OauthManagerService } from './oauth-manager/oauth-manager.service';
import { MonitorConfigService } from './monitor-config.service';
import { MonitorLog } from './entities/monitor-log.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MonitorController } from './monitor.controller';
import * as readline from 'readline';

@Injectable()
export class MonitorSSEService implements OnModuleDestroy {
    private readonly logger = new Logger(MonitorSSEService.name);
    private activeStreams: Map<string, any> = new Map();
    public readonly rawEventSubject = new Subject<{ path: string; data: string }>();

    constructor(
        private readonly httpService: HttpService,
        private readonly oauthManager: OauthManagerService,
        private readonly configService: MonitorConfigService,
        @InjectRepository(MonitorLog)
        private readonly logRepository: Repository<MonitorLog>,
    ) { }

    onModuleDestroy() {
        this.stopAll();
    }

    async startMonitoring(path: string = '/devices/all/events') {
        const config = this.configService.getConfig();
        const deviceId = config.deviceId || 'TRIAL_DEVICE_ID';
        const dynamicPath = path.replace(/{deviceId}/g, deviceId);

        if (this.activeStreams.has(dynamicPath)) {
            this.logger.warn(`Stream for ${dynamicPath} is already active.`);
            return;
        }

        const baseUrl = process.env.MIELE_API_BASE_URL || 'https://api.mcs3.miele.com/v1';
        const url = `${baseUrl}${dynamicPath}`;

        this.logger.log(`Starting SSE monitor for ${url}`);

        try {
            const token = await this.oauthManager.getAccessToken();
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'text/event-stream',
                        'User-Agent': 'API-Sentinel/v0.0.1',
                    },
                    responseType: 'stream',
                }),
            );

            const stream = response.data;
            this.activeStreams.set(path, stream);

            const rl = readline.createInterface({
                input: stream,
                terminal: false,
            });

            let currentEvent = '';

            rl.on('line', (line) => {
                if (line.startsWith('data:')) {
                    const dataStr = line.replace('data:', '').trim();
                    if (dataStr) {
                        this.rawEventSubject.next({ path, data: dataStr });
                        this.handleEvent(path, dataStr);
                    }
                }
            });

            stream.on('end', () => {
                this.logger.warn(`SSE Stream ${path} ended. Reconnecting in 5s...`);
                this.activeStreams.delete(path);
                setTimeout(() => this.startMonitoring(path), 5000);
            });

            stream.on('error', (err: any) => {
                this.logger.error(`SSE Stream ${path} error: ${err.message}. Reconnecting in 10s...`);
                this.activeStreams.delete(path);
                setTimeout(() => this.startMonitoring(path), 10000);
            });

        } catch (err: any) {
            this.logger.error(`Failed to connect to SSE ${path}: ${err.message}. Retrying in 30s...`);
            setTimeout(() => this.startMonitoring(path), 30000);
        }
    }

    stopMonitoring(path: string) {
        const stream = this.activeStreams.get(path);
        if (stream) {
            stream.destroy();
            this.activeStreams.delete(path);
            this.logger.log(`Stopped SSE monitor for ${path}`);
        }
    }

    stopAll() {
        for (const path of this.activeStreams.keys()) {
            this.stopMonitoring(path);
        }
    }

    private async handleEvent(path: string, dataStr: string) {
        // Handle Miele SSE "ping" heartbeats
        if (dataStr === 'ping') {
            this.logger.debug(`SSE Ping received from ${path}`);
            return;
        }

        try {
            const data = JSON.parse(dataStr);
            this.logger.log(`SSE Event from ${path}: Received update`);

            // Create a log entry for the event
            const log = new MonitorLog();
            log.path = path;
            log.method = 'SSE';
            log.statusCode = 200;
            log.latency = 0;
            log.success = true;
            log.responseData = data;
            log.timestamp = new Date();

            // Determine deviceId if possible (it's often the key in the root object for /all/events)
            const deviceIds = Object.keys(data);
            if (deviceIds.length === 1) {
                log.deviceId = deviceIds[0];
            }

            const savedLog = await this.logRepository.save(log);
            MonitorController.pushLog(savedLog);

        } catch (err: any) {
            this.logger.error(`Failed to parse SSE event data: ${err.message}`);
        }
    }
}
