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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const monitor_log_entity_1 = require("./entities/monitor-log.entity");
let MonitorController = class MonitorController {
    logRepository;
    constructor(logRepository) {
        this.logRepository = logRepository;
    }
    async getLogs(limit = 100) {
        return this.logRepository.find({
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }
    async getStats() {
        const logs = await this.logRepository.find({
            order: { timestamp: 'DESC' },
            take: 1000,
        });
        const stats = {};
        logs.forEach(log => {
            const key = `${log.method} ${log.path}`;
            if (!stats[key]) {
                stats[key] = {
                    path: log.path,
                    method: log.method,
                    count: 0,
                    successCount: 0,
                    avgLatency: 0,
                    lastStatus: log.statusCode,
                    lastTimestamp: log.timestamp,
                };
            }
            stats[key].count++;
            if (log.success)
                stats[key].successCount++;
            stats[key].avgLatency = (stats[key].avgLatency * (stats[key].count - 1) + log.latency) / stats[key].count;
        });
        return Object.values(stats);
    }
};
exports.MonitorController = MonitorController;
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonitorController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitorController.prototype, "getStats", null);
exports.MonitorController = MonitorController = __decorate([
    (0, common_1.Controller)('monitor'),
    __param(0, (0, typeorm_1.InjectRepository)(monitor_log_entity_1.MonitorLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MonitorController);
//# sourceMappingURL=monitor.controller.js.map