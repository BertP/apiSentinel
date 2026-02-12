import { Repository } from 'typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
export declare class MonitorController {
    private readonly logRepository;
    constructor(logRepository: Repository<MonitorLog>);
    getLogs(limit?: number): Promise<MonitorLog[]>;
    getStats(): Promise<any[]>;
}
