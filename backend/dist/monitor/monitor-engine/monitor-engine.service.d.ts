import { HttpService } from '@nestjs/axios';
import { OauthManagerService } from '../oauth-manager/oauth-manager.service';
export declare class MonitorEngineService {
    private readonly httpService;
    private readonly oauthManager;
    private readonly logger;
    constructor(httpService: HttpService, oauthManager: OauthManagerService);
    checkEndpoint(baseUrl: string, endpoint: {
        path: string;
        method: string;
    }): Promise<{
        status: number;
        latency: number;
        success: boolean;
        error?: undefined;
    } | {
        status: any;
        latency: number;
        success: boolean;
        error: any;
    }>;
}
