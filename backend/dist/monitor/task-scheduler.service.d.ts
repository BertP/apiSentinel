import { OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bull';
import { OpenapiParserService } from './openapi-parser/openapi-parser.service';
import { ConfigService } from '@nestjs/config';
export declare class TaskSchedulerService implements OnModuleInit {
    private readonly monitorQueue;
    private readonly openapiParser;
    private readonly configService;
    private readonly logger;
    constructor(monitorQueue: Queue, openapiParser: OpenapiParserService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    scheduleTasks(): Promise<void>;
}
