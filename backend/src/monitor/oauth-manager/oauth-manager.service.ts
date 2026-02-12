import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OauthManagerService {
    private readonly logger = new Logger(OauthManagerService.name);
    private accessToken: string | null = null;
    private expiresAt: number = 0;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async getAccessToken(): Promise<string | null> {
        if (this.accessToken && Date.now() < this.expiresAt) {
            return this.accessToken;
        }

        try {
            const tokenUrl = this.configService.get<string>('OAUTH2_TOKEN_URL');
            const clientId = this.configService.get<string>('OAUTH2_CLIENT_ID');
            const clientSecret = this.configService.get<string>('OAUTH2_CLIENT_SECRET');
            const username = this.configService.get<string>('OAUTH2_USERNAME');
            const password = this.configService.get<string>('OAUTH2_PASSWORD');

            if (!tokenUrl) {
                this.logger.warn('OAUTH2_TOKEN_URL not configured. Skipping token procurement.');
                return null;
            }

            this.logger.log(`Requesting new access token from: ${tokenUrl}`);

            const response = await firstValueFrom(
                this.httpService.post(tokenUrl, {
                    grant_type: 'password',
                    client_id: clientId,
                    client_secret: clientSecret,
                    username,
                    password,
                }),
            );

            this.accessToken = response.data.access_token;
            this.expiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

            return this.accessToken;
        } catch (error) {
            this.logger.error(`Error procuring access token: ${error.message}`);
            return null;
        }
    }
}
