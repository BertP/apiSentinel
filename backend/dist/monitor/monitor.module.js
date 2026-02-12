"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorModule = void 0;
const common_1 = require("@nestjs/common");
const openapi_parser_service_1 = require("./openapi-parser/openapi-parser.service");
const monitor_engine_service_1 = require("./monitor-engine/monitor-engine.service");
const oauth_manager_service_1 = require("./oauth-manager/oauth-manager.service");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const typeorm_1 = require("@nestjs/typeorm");
const monitor_log_entity_1 = require("./entities/monitor-log.entity");
const monitor_processor_1 = require("./monitor.processor");
const task_scheduler_service_1 = require("./task-scheduler.service");
let MonitorModule = class MonitorModule {
};
exports.MonitorModule = MonitorModule;
exports.MonitorModule = MonitorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            config_1.ConfigModule,
            bull_1.BullModule.registerQueue({
                name: 'monitor',
            }),
            typeorm_1.TypeOrmModule.forFeature([monitor_log_entity_1.MonitorLog]),
        ],
        providers: [
            openapi_parser_service_1.OpenapiParserService,
            monitor_engine_service_1.MonitorEngineService,
            oauth_manager_service_1.OauthManagerService,
            monitor_processor_1.MonitorProcessor,
            task_scheduler_service_1.TaskSchedulerService
        ],
        exports: [openapi_parser_service_1.OpenapiParserService, monitor_engine_service_1.MonitorEngineService, oauth_manager_service_1.OauthManagerService],
    })
], MonitorModule);
//# sourceMappingURL=monitor.module.js.map