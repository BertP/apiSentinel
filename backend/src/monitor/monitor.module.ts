import { Module } from '@nestjs/common';
import { OpenapiParserService } from './openapi-parser/openapi-parser.service';
import { MonitorEngineService } from './monitor-engine/monitor-engine.service';
import { OauthManagerService } from './oauth-manager/oauth-manager.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
import { MonitorProcessor } from './monitor.processor';
import { TaskSchedulerService } from './task-scheduler.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BullModule.registerQueue({
      name: 'monitor',
    }),
    TypeOrmModule.forFeature([MonitorLog]),
  ],
  providers: [
    OpenapiParserService,
    MonitorEngineService,
    OauthManagerService,
    MonitorProcessor,
    TaskSchedulerService
  ],
  exports: [OpenapiParserService, MonitorEngineService, OauthManagerService],
})
export class MonitorModule { }
