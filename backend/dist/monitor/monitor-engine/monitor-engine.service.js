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
var MonitorEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorEngineService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const oauth_manager_service_1 = require("../oauth-manager/oauth-manager.service");
let MonitorEngineService = MonitorEngineService_1 = class MonitorEngineService {
    httpService;
    oauthManager;
    logger = new common_1.Logger(MonitorEngineService_1.name);
    constructor(httpService, oauthManager) {
        this.httpService = httpService;
        this.oauthManager = oauthManager;
    }
    async checkEndpoint(baseUrl, endpoint) {
        const url = `${baseUrl}${endpoint.path}`;
        const startTime = Date.now();
        try {
            this.logger.log(`Checking endpoint: ${endpoint.method} ${url}`);
            const token = await this.oauthManager.getAccessToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request({
                url,
                method: endpoint.method,
                headers,
                timeout: 10000,
            }));
            const endTime = Date.now();
            const latency = endTime - startTime;
            this.logger.log(`Result: ${response.status} - ${latency}ms`);
            return {
                status: response.status,
                latency,
                success: response.status >= 200 && response.status < 300,
            };
        }
        catch (error) {
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
};
exports.MonitorEngineService = MonitorEngineService;
exports.MonitorEngineService = MonitorEngineService = MonitorEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        oauth_manager_service_1.OauthManagerService])
], MonitorEngineService);
//# sourceMappingURL=monitor-engine.service.js.map