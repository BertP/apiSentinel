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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MonitorProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const monitor_engine_service_1 = require("./monitor-engine/monitor-engine.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const monitor_log_entity_1 = require("./entities/monitor-log.entity");
const config_1 = require("@nestjs/config");
let MonitorProcessor = MonitorProcessor_1 = class MonitorProcessor {
    monitorEngine;
    configService;
    logRepository;
    logger = new common_1.Logger(MonitorProcessor_1.name);
    constructor(monitorEngine, configService, logRepository) {
        this.monitorEngine = monitorEngine;
        this.configService = configService;
        this.logRepository = logRepository;
    }
    async handleCheck(job) {
        const { path, method } = job.data;
        const baseUrl = this.configService.get('API_BASE_URL') || 'https://api.mcs3.miele.com/v1';
        this.logger.log(`Processing check for ${method} ${path} on ${baseUrl}`);
        const result = await this.monitorEngine.checkEndpoint(baseUrl, { path, method });
        const log = this.logRepository.create({
            path,
            method,
            statusCode: result.status,
            latency: result.latency,
            success: result.success,
            error: result.error,
        });
        await this.logRepository.save(log);
        this.logger.log(`Job ${job.id} completed. Saved log entry.`);
    }
};
exports.MonitorProcessor = MonitorProcessor;
__decorate([
    (0, bull_1.Process)('check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonitorProcessor.prototype, "handleCheck", null);
exports.MonitorProcessor = MonitorProcessor = MonitorProcessor_1 = __decorate([
    (0, bull_1.Processor)('monitor'),
    __param(2, (0, typeorm_1.InjectRepository)(monitor_log_entity_1.MonitorLog)),
    __metadata("design:paramtypes", [monitor_engine_service_1.MonitorEngineService,
        config_1.ConfigService,
        typeorm_2.Repository])
], MonitorProcessor);
//# sourceMappingURL=monitor.processor.js.map