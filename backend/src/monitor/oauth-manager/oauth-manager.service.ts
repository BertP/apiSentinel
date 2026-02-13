import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { MonitorConfigService } from '../monitor-config.service';

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
    ) { }

    async getAccessToken(): Promise<string | null> {
        // 1. Check for dynamic manual token from UI first
        const dynamicToken = this.monitorConfig.getConfig().manualToken;
        if (dynamicToken) {
            return dynamicToken;
        }

        // 2. Check for manual override from .env
        const envManualToken = this.configService.get<string>('MANUAL_ACCESS_TOKEN');
        if (envManualToken) {
            return envManualToken;
        }

        if (this.accessToken && Date.now() < this.expiresAt) {
            return this.accessToken;
        }

        try {
            const tokenUrl = this.configService.get<string>('OAUTH2_TOKEN_URL');
            const clientId = this.configService.get<string>('OAUTH2_CLIENT_ID');
            const clientSecret = this.configService.get<string>('OAUTH2_CLIENT_SECRET');
            const username = this.configService.get<string>('OAUTH2_USERNAME');
            const password = this.configService.get<string>('OAUTH2_PASSWORD');
            const vg = this.configService.get<string>('OAUTH2_VG');

            if (!tokenUrl) {
                this.logger.warn('OAUTH2_TOKEN_URL not configured. Skipping token procurement.');
                return null;
            }

            this.logger.log(`Requesting new access token from: ${tokenUrl}`);

            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('client_id', clientId || '');
            params.append('client_secret', clientSecret || '');
            params.append('username', username || '');
            params.append('password', password || '');
            if (vg) {
                params.append('vg', vg);
            }

            const response = await firstValueFrom(
                this.httpService.post(
                    tokenUrl,
                    params.toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'apiMonitor/0.0.1',
                        },
                    },
                ),
            );

            this.accessToken = response.data.access_token;
            this.refreshToken = response.data.refresh_token;
            this.expiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

            return this.accessToken;
        } catch (error) {
            if (error.response) {
                this.logger.error(`Error procuring access token: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                this.logger.error(`Error procuring access token: ${error.message}`);
            }
            return null;
        }
    }

    getTokenStatus() {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expiresAt: this.expiresAt,
            expiresIn: this.expiresAt > Date.now() ? Math.floor((this.expiresAt - Date.now()) / 1000) : 0,
            isManual: !!this.monitorConfig.getConfig().manualToken || !!this.configService.get<string>('MANUAL_ACCESS_TOKEN'),
        };
    }
}
