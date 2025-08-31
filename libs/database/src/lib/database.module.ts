import {
  DynamicModule,
  Global,
  Module,
  Provider,
} from '@nestjs/common';
import { DatabaseInjectionToken } from './enum';
import { DataSource, DataSourceOptions, EntityManager, EntityTarget, ObjectLiteral, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';

export interface WriteConnection {
  readonly startTransaction: (
    level?:
      | 'READ UNCOMMITTED'
      | 'READ COMMITTED'
      | 'REPEATABLE READ'
      | 'SERIALIZABLE',
  ) => Promise<void>;
  readonly commitTransaction: () => Promise<void>;
  readonly rollbackTransaction: () => Promise<void>;
  readonly isTransactionActive: boolean;
  readonly manager: EntityManager;
}

export interface ReadConnection {
  readonly getRepository: <T extends ObjectLiteral>(
    target: EntityTarget<T>,
  ) => Repository<T>;
  readonly query: (query: string) => Promise<void>;
  readonly createQueryBuilder: <Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    alias: string,
    queryRunner?: QueryRunner,
  ) => SelectQueryBuilder<Entity>;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRootAsync(configFactory: () => Promise<DataSourceOptions>): DynamicModule {
    const dataSourceProvider: Provider = {
      provide: DatabaseInjectionToken.DATA_SOURCE,
      useFactory: async () => {
        const config = await configFactory();
        const dataSource = new DataSource({
          ...config,
        });
        await dataSource.initialize();
        return dataSource;
      },
    };

    return {
      module: DatabaseModule,
      providers: [
        dataSourceProvider,
      ],
      exports: [DatabaseInjectionToken.DATA_SOURCE],
    };
  }
}
