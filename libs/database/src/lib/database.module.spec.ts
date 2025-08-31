import { Test } from '@nestjs/testing';
import { DatabaseModule } from './database.module';

jest.mock('typeorm', () => ({
  DataSource: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('DatabaseModule', () => {
  it('should compile the module', async () => {
    const mockConfigFactory = jest.fn().mockResolvedValue({
      type: 'sqlite',
      database: ':memory:',
    });

    const module = await Test.createTestingModule({
      imports: [DatabaseModule.forRootAsync(mockConfigFactory)],
    }).compile();

    expect(module).toBeDefined();
  });
});
