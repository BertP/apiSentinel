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
  private readonly configPath = fs.existsSync('/app/config.json')
    ? '/app/config.json'
    : path.join(process.cwd(), 'config.json');

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
    this.logger.log(`MonitorConfigService initializing. CWD: ${process.cwd()}`);
    this.logger.log(`Expected config path: ${this.configPath}`);
    this.loadConfig();
    this.configUpdateSubject = new BehaviorSubject<MonitorConfiguration>(
      this.currentConfig,
    );
    this.configUpdates$ = this.configUpdateSubject.asObservable();
  }

  private loadConfig() {
    try {
      this.logger.log(`Checking for config at: ${this.configPath}`);
      const exists = fs.existsSync(this.configPath);
      this.logger.log(`Config file exists? ${exists}`);

      if (exists) {
        this.logger.log(`Reading config file...`);
        const data = fs.readFileSync(this.configPath, 'utf8');
        if (data && data.trim()) {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            this.currentConfig = { ...this.currentConfig, ...parsed };
            this.logger.log(
              `Configuration merged. Active Endpoints: ${JSON.stringify(this.currentConfig.activeEndpoints)}`,
            );
          } else {
            this.logger.warn('Config file contains invalid JSON object.');
          }
        } else {
          this.logger.warn('Config file is empty.');
        }
      } else {
        this.logger.warn(
          `Config file NOT found at ${this.configPath}. Using defaults.`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to load config: ${err.message}`, err.stack);
    }
  }

  private saveConfig() {
    try {
      this.logger.log(`Saving configuration to ${this.configPath}...`);
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.currentConfig, null, 2),
      );
      this.logger.log('Configuration saved successfully.');
    } catch (err) {
      this.logger.error(`Failed to save config: ${err.message}`, err.stack);
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
