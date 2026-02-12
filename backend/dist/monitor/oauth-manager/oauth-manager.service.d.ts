import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class OauthManagerService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private accessToken;
    private expiresAt;
    constructor(httpService: HttpService, configService: ConfigService);
    getAccessToken(): Promise<string | null>;
}
