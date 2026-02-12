import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OauthManagerService } from '../oauth-manager/oauth-manager.service';

@Injectable()
export class MonitorEngineService {
    private readonly logger = new Logger(MonitorEngineService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly oauthManager: OauthManagerService,
    ) { }

    async checkEndpoint(baseUrl: string, endpoint: { path: string; method: string }) {
        const url = `${baseUrl}${endpoint.path}`;
        const startTime = Date.now();

        try {
            this.logger.log(`Checking endpoint: ${endpoint.method} ${url}`);

            const token = await this.oauthManager.getAccessToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await firstValueFrom(
                this.httpService.request({
                    url,
                    method: endpoint.method as any,
                    headers,
                    timeout: 10000,
                }),
            );

            const endTime = Date.now();
            const latency = endTime - startTime;

            this.logger.log(`Result: ${response.status} - ${latency}ms`);

            return {
                status: response.status,
                latency,
                success: response.status >= 200 && response.status < 300,
            };
        } catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            const status = error.response?.status || 500;

            this.logger.error(`Failed: ${status} - ${error.message}`);

            return {
                status,
                latency,
                success: false,
                error: error.message,
            };
        }
    }
}
