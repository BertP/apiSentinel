import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export interface MonitorConfiguration {
  manualToken?: string;
  activeEndpoints: string[];
  emailRecipients: string[];
  alertEndpoints: string[];
  deviceId: string;
  stateAutomationEnabled: boolean;
}

@Injectable()
export class MonitorConfigService {
  private readonly logger = new Logger(MonitorConfigService.name);
  private readonly configPath = path.join(process.cwd(), 'config.json');

  private currentConfig: MonitorConfiguration = {
    activeEndpoints: ['/devices'], // Default starting endpoint
    emailRecipients: [],
    alertEndpoints: [],
    deviceId: '',
    stateAutomationEnabled: false,
  };

  private configUpdateSubject: BehaviorSubject<MonitorConfiguration>;
  public configUpdates$;

  constructor() {
    this.loadConfig();
    this.configUpdateSubject = new BehaviorSubject<MonitorConfiguration>(this.currentConfig);
    this.configUpdates$ = this.configUpdateSubject.asObservable();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.currentConfig = { ...this.currentConfig, ...JSON.parse(data) };
        this.logger.log(`Configuration loaded from ${this.configPath}`);
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
