import { Module } from '@nestjs/common';
import { OpenapiParserService } from './openapi-parser/openapi-parser.service';
import { MonitorEngineService } from './monitor-engine/monitor-engine.service';
import { OauthManagerService } from './oauth-manager/oauth-manager.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorLog } from './entities/monitor-log.entity';
import { AuthLog } from './entities/auth-log.entity';
import { MonitorProcessor } from './monitor.processor';
import { TaskSchedulerService } from './task-scheduler.service';
import { MonitorConfigService } from './monitor-config.service';
import { MonitorController } from './monitor.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BullModule.registerQueue({
      name: 'monitor',
    }),
    TypeOrmModule.forFeature([MonitorLog, AuthLog]),
  ],
  controllers: [MonitorController],
  providers: [
    OpenapiParserService,
    MonitorEngineService,
    OauthManagerService,
    MonitorProcessor,
    TaskSchedulerService,
    MonitorConfigService,
  ],
  exports: [OpenapiParserService, MonitorEngineService, OauthManagerService],
})
export class MonitorModule {}
