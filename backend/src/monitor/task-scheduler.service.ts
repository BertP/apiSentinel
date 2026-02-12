import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OpenapiParserService } from './openapi-parser/openapi-parser.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(TaskSchedulerService.name);

    constructor(
        @InjectQueue('monitor') private readonly monitorQueue: Queue,
        private readonly openapiParser: OpenapiParserService,
        private readonly configService: ConfigService,
    ) { }

    async onModuleInit() {
        this.logger.log('Initializing monitoring tasks...');
        await this.scheduleTasks();
    }

    async scheduleTasks() {
        try {
            const api = await this.openapiParser.parseDefinition('openapi.yaml');
            const endpoints = this.openapiParser.extractEndpoints(api);
            const interval = this.configService.get<number>('MONITOR_INTERVAL_MS') || 60000;

            this.logger.log(`Scheduling ${endpoints.length} endpoints with ${interval}ms interval`);

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
        } catch (error) {
            this.logger.error(`Failed to schedule tasks: ${error.message}`);
        }
    }
}
