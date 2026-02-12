"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OauthManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthManagerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const config_1 = require("@nestjs/config");
let OauthManagerService = OauthManagerService_1 = class OauthManagerService {
    httpService;
    configService;
    logger = new common_1.Logger(OauthManagerService_1.name);
    accessToken = null;
    expiresAt = 0;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
    }
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.expiresAt) {
            return this.accessToken;
        }
        try {
            const tokenUrl = this.configService.get('OAUTH2_TOKEN_URL');
            const clientId = this.configService.get('OAUTH2_CLIENT_ID');
            const clientSecret = this.configService.get('OAUTH2_CLIENT_SECRET');
            const username = this.configService.get('OAUTH2_USERNAME');
            const password = this.configService.get('OAUTH2_PASSWORD');
            if (!tokenUrl) {
                this.logger.warn('OAUTH2_TOKEN_URL not configured. Skipping token procurement.');
                return null;
            }
            this.logger.log(`Requesting new access token from: ${tokenUrl}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(tokenUrl, {
                grant_type: 'password',
                client_id: clientId,
                client_secret: clientSecret,
                username,
                password,
            }));
            this.accessToken = response.data.access_token;
            this.expiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;
            return this.accessToken;
        }
        catch (error) {
            this.logger.error(`Error procuring access token: ${error.message}`);
            return null;
        }
    }
};
exports.OauthManagerService = OauthManagerService;
exports.OauthManagerService = OauthManagerService = OauthManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], OauthManagerService);
//# sourceMappingURL=oauth-manager.service.js.map