import type { Job } from 'bull';
import { MonitorEngineService } from './monitor-engine/monitor-engine.service';
import { Repository } from 'typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
import { ConfigService } from '@nestjs/config';
export declare class MonitorProcessor {
    private readonly monitorEngine;
    private readonly configService;
    private readonly logRepository;
    private readonly logger;
    constructor(monitorEngine: MonitorEngineService, configService: ConfigService, logRepository: Repository<MonitorLog>);
    handleCheck(job: Job<any>): Promise<void>;
}
