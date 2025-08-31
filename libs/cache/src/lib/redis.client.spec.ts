import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisClient } from './redis.client';

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
  status: 'ready',
};

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

describe('RedisClient', () => {
  let service: RedisClient;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('redis://localhost:6379'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisClient>(RedisClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get client', () => {
    expect(service.getClient()).toBe(mockRedis);
  });

  it('should set value without ttl', async () => {
    mockRedis.set.mockResolvedValue('OK');
    const result = await service.set('key', 'value');
    expect(result).toBe('OK');
    expect(mockRedis.set).toHaveBeenCalledWith('key', 'value');
  });

  it('should set value with ttl', async () => {
    mockRedis.set.mockResolvedValue('OK');
    const result = await service.set('key', 'value', 60);
    expect(result).toBe('OK');
    expect(mockRedis.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
  });

  it('should get value', async () => {
    mockRedis.get.mockResolvedValue('value');
    const result = await service.get('key');
    expect(result).toBe('value');
    expect(mockRedis.get).toHaveBeenCalledWith('key');
  });

  it('should delete key', async () => {
    mockRedis.del.mockResolvedValue(1);
    const result = await service.del('key');
    expect(result).toBe(1);
    expect(mockRedis.del).toHaveBeenCalledWith('key');
  });
});
