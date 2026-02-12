import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MonitorEngineService } from '../monitor-engine/monitor-engine.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorLog } from '../entities/monitor-log.entity';
import { ConfigService } from '@nestjs/config';

@Processor('monitor')
export class MonitorProcessor {
    private readonly logger = new Logger(MonitorProcessor.name);

    constructor(
        private readonly monitorEngine: MonitorEngineService,
        private readonly configService: ConfigService,
        @InjectRepository(MonitorLog)
        private readonly logRepository: Repository<MonitorLog>,
    ) { }

    @Process('check')
    async handleCheck(job: Job<any>) {
        const { path, method } = job.data;
        const baseUrl = this.configService.get<string>('API_BASE_URL') || 'https://jsonplaceholder.typicode.com';

        this.logger.log(`Processing check for ${method} ${path}`);

        const result = await this.monitorEngine.checkEndpoint(baseUrl, { path, method });

        const log = this.logRepository.create({
            path,
            method,
            statusCode: result.status,
            latency: result.latency,
            success: result.success,
            error: result.error,
        });

        await this.logRepository.save(log);

        this.logger.log(`Job ${job.id} completed. Saved log entry.`);
    }
}
