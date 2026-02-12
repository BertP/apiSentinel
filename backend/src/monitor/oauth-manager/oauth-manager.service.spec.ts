import { Test, TestingModule } from '@nestjs/testing';
import { OauthManagerService } from './oauth-manager.service';

describe('OauthManagerService', () => {
  let service: OauthManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OauthManagerService],
    }).compile();

    service = module.get<OauthManagerService>(OauthManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
