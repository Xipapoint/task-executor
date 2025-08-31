import { Module } from '@nestjs/common';
import { NestjsInjectionToken } from './InjectionToken/InjectionToken';
import { CatchFilter } from './filters';
import { RequestStorageMiddleware } from './request-storage/middleware/request-storage.middleware';
import { QueryRunnerManager } from './transactional';
import { MetricsInterceptor } from './interceptors';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { APP_INTERCEPTOR } from '@nestjs/core';

export const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'url'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency in seconds',
    labelNames: ['method', 'url'],
    buckets: [0.1, 0.5, 1, 2, 5], // кастомные интервалы
  }),
];


@Module({
  controllers: [],
  providers: [
    ...metricsProviders,
    {
      provide: NestjsInjectionToken.CATCH_FILTER,
      useClass: CatchFilter,
    },
    // {
    //   provide: NestjsInjectionToken.REQUEST_STORAGE_MIDDLEWARE,
    //   useClass: RequestStorageMiddleware,
    // },
    // {
    //   provide: NestjsInjectionToken.QUERY_RUNNER_MANAGER,
    //   useClass: QueryRunnerManager,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    }
  ],
  exports: [
    NestjsInjectionToken.CATCH_FILTER,
    // NestjsInjectionToken.REQUEST_STORAGE_MIDDLEWARE,
    // NestjsInjectionToken.QUERY_RUNNER_MANAGER,
  ],
})
export class NestjsModule {}
