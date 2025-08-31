import { DatabaseInjectionToken } from "@message-system/database";
import { Injectable, Inject } from "@nestjs/common";
import { DataSource, QueryRunner } from "typeorm";
import { RequestStorageInstance } from '../../request-storage/storage/RequestStorage';

@Injectable()
export class QueryRunnerManager {
  constructor(
    @Inject(DatabaseInjectionToken.DATA_SOURCE)
    private readonly dataSource: DataSource
  ) {}

  getQueryRunner(): QueryRunner {
    if (!RequestStorageInstance.hasQueryRunner()) {
      const runner = this.dataSource.createQueryRunner();
      RequestStorageInstance.setQueryRunner(runner);
    }
    return RequestStorageInstance.getQueryRunner();
  }
}