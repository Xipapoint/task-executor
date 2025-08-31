import { Test } from '@nestjs/testing';
import { RedisModule } from './redis.module';
import { RedisClient } from './redis.client';

describe('RedisModule', () => {
  it('should compile the module', async () => {
    const mockRedisClient = {
      getClient: jest.fn(),
    };

    const module = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(RedisClient)
      .useValue(mockRedisClient)
      .compile();

    expect(module).toBeDefined();
  });
});
