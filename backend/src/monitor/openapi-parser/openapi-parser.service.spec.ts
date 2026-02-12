import { Test, TestingModule } from '@nestjs/testing';
import { OpenapiParserService } from './openapi-parser.service';

describe('OpenapiParserService', () => {
  let service: OpenapiParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenapiParserService],
    }).compile();

    service = module.get<OpenapiParserService>(OpenapiParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
