import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { MonitorConfigService } from '../monitor-config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthLog } from '../entities/auth-log.entity';

@Injectable()
export class OauthManagerService {
  private readonly logger = new Logger(OauthManagerService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly monitorConfig: MonitorConfigService,
    @InjectRepository(AuthLog)
    private readonly authLogRepository: Repository<AuthLog>,
  ) { }

  async getAccessToken(): Promise<string | null> {
    // 1. Check for dynamic manual token from UI first
    const dynamicToken = this.monitorConfig.getConfig().manualToken;
    if (dynamicToken) {
      return dynamicToken;
    }

    // 2. Check for manual override from .env
    const envManualToken = this.configService.get<string>(
      'MANUAL_ACCESS_TOKEN',
    );
    if (envManualToken) {
      return envManualToken;
    }

    if (this.accessToken && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    // Attempt refresh if we have a refresh token
    if (this.refreshToken) {
      this.logger.log('Access token expired, attempting refresh...');
      const success = await this.fetchNewToken('refresh_token');
      if (success) return this.accessToken;
    }

    return this.fetchNewToken('password');
  }

  private async fetchNewToken(
    grantType: 'password' | 'refresh_token',
    isTest = false,
  ): Promise<string | null> {
    const start = Date.now();
    try {
      const tokenUrl = this.configService.get<string>('OAUTH2_TOKEN_URL');
      const clientId = this.configService.get<string>('OAUTH2_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'OAUTH2_CLIENT_SECRET',
      );
      const username = this.configService.get<string>('OAUTH2_USERNAME');
      const password = this.configService.get<string>('OAUTH2_PASSWORD');
      const vg = this.configService.get<string>('OAUTH2_VG');

      if (!tokenUrl) {
        this.logger.warn(
          'OAUTH2_TOKEN_URL not configured. Skipping token procurement.',
        );
        return null;
      }

      this.logger.log(
        `Requesting token (${grantType}) from: ${tokenUrl}${isTest ? ' (Health Check)' : ''}`,
      );

      const params = new URLSearchParams();
      params.append('grant_type', grantType);
      params.append('client_id', clientId || '');
      params.append('client_secret', clientSecret || '');

      if (grantType === 'password') {
        params.append('username', username || '');
        params.append('password', password || '');
      } else {
        params.append('refresh_token', this.refreshToken || '');
      }

      if (vg) {
        params.append('vg', vg);
      }

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'API-Sentinel/v0.0.1',
          },
        }),
      );

      this.accessToken = response.data.access_token as string;
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token as string;
      }
      this.expiresAt = Date.now() + response.data.expires_in * 1000 - 60000; // 1 minute buffer

      if (isTest) {
        await this.recordAuthLog(true, response.status, Date.now() - start);
      }

      return this.accessToken;
    } catch (error: any) {
      const latency = Date.now() - start;
      const status = error.response?.status || 500;
      const message = error.response
        ? JSON.stringify(error.response.data)
        : error.message;

      this.logger.error(
        `Error during ${grantType} grant: ${status} - ${message}`,
      );

      if (isTest) {
        await this.recordAuthLog(false, status, latency, message);
      }

      // If refresh failed, clear tokens and let it fallback to password grant
      if (grantType === 'refresh_token') {
        this.accessToken = null;
        this.refreshToken = null;
      }

      return null;
    }
  }

  async testLogin(): Promise<boolean> {
    const token = await this.fetchNewToken('password', true);
    return !!token;
  }

  private async recordAuthLog(
    success: boolean,
    statusCode: number,
    latency: number,
    errorMessage?: string,
  ) {
    try {
      const log = this.authLogRepository.create({
        success,
        statusCode,
        latency,
        errorMessage,
        tokenType: 'access',
      });
      await this.authLogRepository.save(log);
    } catch (err) {
      this.logger.error('Failed to save auth log', err);
    }
  }

  getTokenStatus() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
      expiresIn:
        this.expiresAt > Date.now()
          ? Math.floor((this.expiresAt - Date.now()) / 1000)
          : 0,
      isManual:
        !!this.monitorConfig.getConfig().manualToken ||
        !!this.configService.get<string>('MANUAL_ACCESS_TOKEN'),
    };
  }
}
