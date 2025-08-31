import { InternalServerErrorException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { QueryRunner } from 'typeorm';


class Storage {
  constructor(
    readonly transactionDepth = 0,
    readonly queryRunner?: QueryRunner,
  ) {}
}

export interface RequestStorage {
  reset: (requestContextObject: any) => void;
  resetTransactionDepth: () => void;
  increaseTransactionDepth: () => void;
  decreaseTransactionDepth: () => void;
  getStorage: () => Storage
  setQueryRunner: (queryRunner: QueryRunner) => void
  getQueryRunner: () => QueryRunner
  hasQueryRunner: () => boolean
}

export class RequestStorageImplement implements RequestStorage {
  private readonly storage = new AsyncLocalStorage<Storage>();

  reset(): void {
    this.storage.enterWith({ transactionDepth: 0 });
  }

  resetTransactionDepth(): void {
    const storage = this.getStorage();
    this.storage.enterWith({ ...storage, transactionDepth: 0 });
  }

  increaseTransactionDepth(): void {
    const storage = this.getStorage();
    this.storage.enterWith({
      ...storage,
      transactionDepth: storage.transactionDepth + 1,
    });
  }

  decreaseTransactionDepth(): void {
    const storage = this.getStorage();
    this.storage.enterWith({
      ...storage,
      transactionDepth: storage.transactionDepth - 1,
    });
  }

  getStorage(): Storage {
    const storage = this.storage.getStore();
    if (!storage)
      throw new InternalServerErrorException('RequestStorage is not found');
    return storage;
  }

  setQueryRunner(queryRunner: QueryRunner): void {
    const storage = this.getStorage();
    this.storage.enterWith({ ...storage, queryRunner });
  }

  getQueryRunner(): QueryRunner {
    const storage = this.getStorage();
    if (!storage.queryRunner)
      throw new InternalServerErrorException('QueryRunner not found');
    return storage.queryRunner;
  }

  hasQueryRunner(): boolean {
    const storage = this.storage.getStore();
    return !!storage?.queryRunner;
  }
}

export const RequestStorageInstance = new RequestStorageImplement();