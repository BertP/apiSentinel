import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface MonitorConfiguration {
    manualToken?: string;
    activeEndpoints: string[];
}

@Injectable()
export class MonitorConfigService {
    private readonly logger = new Logger(MonitorConfigService.name);
    private currentConfig: MonitorConfiguration = {
        activeEndpoints: ['/devices'], // Default starting endpoint
    };

    private configUpdateSubject = new Subject<MonitorConfiguration>();
    public configUpdates$ = this.configUpdateSubject.asObservable();

    getConfig(): MonitorConfiguration {
        return this.currentConfig;
    }

    updateConfig(config: Partial<MonitorConfiguration>) {
        this.currentConfig = {
            ...this.currentConfig,
            ...config,
        };
        this.logger.log(`Configuration updated: ${JSON.stringify(this.currentConfig)}`);
        this.configUpdateSubject.next(this.currentConfig);
    }
}
