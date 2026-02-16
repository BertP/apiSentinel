import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export interface MonitorConfiguration {
  manualToken?: string;
  activeEndpoints: string[];
  emailRecipients: string[];
  alertEndpoints: string[];
  deviceId: string;
}

@Injectable()
export class MonitorConfigService implements OnModuleInit {
  private readonly logger = new Logger(MonitorConfigService.name);
  private readonly configPath = path.join(process.cwd(), 'config.json');

  private currentConfig: MonitorConfiguration = {
    activeEndpoints: ['/devices'], // Default starting endpoint
    emailRecipients: [],
    alertEndpoints: [],
    deviceId: '',
  };

  private configUpdateSubject = new Subject<MonitorConfiguration>();
  public configUpdates$ = this.configUpdateSubject.asObservable();

  onModuleInit() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.currentConfig = { ...this.currentConfig, ...JSON.parse(data) };
        this.logger.log(`Configuration loaded from ${this.configPath}`);
        this.configUpdateSubject.next(this.currentConfig);
      }
    } catch (err) {
      this.logger.error(`Failed to load config: ${err.message}`);
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.currentConfig, null, 2));
      this.logger.log(`Configuration saved to ${this.configPath}`);
    } catch (err) {
      this.logger.error(`Failed to save config: ${err.message}`);
    }
  }

  getConfig(): MonitorConfiguration {
    return this.currentConfig;
  }

  updateConfig(config: Partial<MonitorConfiguration>) {
    this.currentConfig = {
      ...this.currentConfig,
      ...config,
    };
    this.logger.log(
      `Configuration updated: ${JSON.stringify(this.currentConfig)}`,
    );
    this.saveConfig();
    this.configUpdateSubject.next(this.currentConfig);
  }
}
