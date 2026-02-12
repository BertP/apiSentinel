import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorLog } from './entities/monitor-log.entity';

@Controller('monitor')
export class MonitorController {
    constructor(
        @InjectRepository(MonitorLog)
        private readonly logRepository: Repository<MonitorLog>,
    ) { }

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
        logs.forEach(log => {
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
                };
            }
            stats[key].count++;
            if (log.success) stats[key].successCount++;
            stats[key].avgLatency = (stats[key].avgLatency * (stats[key].count - 1) + log.latency) / stats[key].count;
        });

        return Object.values(stats);
    }
}
