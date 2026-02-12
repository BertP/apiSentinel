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
var TaskSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const openapi_parser_service_1 = require("./openapi-parser/openapi-parser.service");
const config_1 = require("@nestjs/config");
let TaskSchedulerService = TaskSchedulerService_1 = class TaskSchedulerService {
    monitorQueue;
    openapiParser;
    configService;
    logger = new common_1.Logger(TaskSchedulerService_1.name);
    constructor(monitorQueue, openapiParser, configService) {
        this.monitorQueue = monitorQueue;
        this.openapiParser = openapiParser;
        this.configService = configService;
    }
    async onModuleInit() {
        this.logger.log('Initializing monitoring tasks...');
        await this.scheduleTasks();
    }
    async scheduleTasks() {
        try {
            const api = await this.openapiParser.parseDefinition('openapi.yaml');
            const endpoints = this.openapiParser.extractEndpoints(api);
            const interval = this.configService.get('MONITOR_INTERVAL_MS') || 60000;
            this.logger.log(`Scheduling ${endpoints.length} endpoints with ${interval}ms interval`);
            const jobs = await this.monitorQueue.getRepeatableJobs();
            for (const job of jobs) {
                await this.monitorQueue.removeRepeatableByKey(job.key);
            }
            for (const endpoint of endpoints) {
                await this.monitorQueue.add('check', { path: endpoint.path, method: endpoint.method }, {
                    repeat: { every: Number(interval) },
                    jobId: `${endpoint.method}-${endpoint.path}`,
                });
                this.logger.log(`Scheduled: ${endpoint.method} ${endpoint.path}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to schedule tasks: ${error.message}`);
        }
    }
};
exports.TaskSchedulerService = TaskSchedulerService;
exports.TaskSchedulerService = TaskSchedulerService = TaskSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('monitor')),
    __metadata("design:paramtypes", [Object, openapi_parser_service_1.OpenapiParserService,
        config_1.ConfigService])
], TaskSchedulerService);
//# sourceMappingURL=task-scheduler.service.js.map