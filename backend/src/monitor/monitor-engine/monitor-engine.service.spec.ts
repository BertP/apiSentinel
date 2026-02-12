import { Test, TestingModule } from '@nestjs/testing';
import { MonitorEngineService } from './monitor-engine.service';

describe('MonitorEngineService', () => {
  let service: MonitorEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitorEngineService],
    }).compile();

    service = module.get<MonitorEngineService>(MonitorEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
