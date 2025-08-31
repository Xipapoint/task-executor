import { RequestStorageInstance } from '../../request-storage';
import { QueryRunnerManager } from '../query-runner-manager/query-runner-manager';

interface TransactionalContext {
  queryRunnerManager: QueryRunnerManager
}

export function Transactional() {
  return (
    target: any,
    key: string,
    descriptor: PropertyDescriptor
  ): void => {
    const original = descriptor.value as (...args: any[]) => Promise<any>;

    descriptor.value = async function (this: TransactionalContext, ...args: any[]) {
      const qrm: QueryRunnerManager = this.queryRunnerManager;
      const runner = qrm.getQueryRunner();

      const isNested = runner.isTransactionActive;
      if (!isNested) {
        RequestStorageInstance.resetTransactionDepth();
        await runner.startTransaction();
      } else {
        RequestStorageInstance.increaseTransactionDepth();
      }

      try {
        const result = await original.apply(this, args);

        const depth = RequestStorageInstance.getStorage().transactionDepth;
        if (!isNested && depth <= 0) {
          await runner.commitTransaction();
          await runner.release();
        } else {
          RequestStorageInstance.decreaseTransactionDepth();
        }

        return result;
      } catch (err) {
        const depthOnError = RequestStorageInstance.getStorage().transactionDepth;
        if (!isNested && depthOnError <= 0) {
          await runner.rollbackTransaction();
          await runner.release();
        } else {
          RequestStorageInstance.decreaseTransactionDepth();
        }
        throw err;
      }
    };
  };
}