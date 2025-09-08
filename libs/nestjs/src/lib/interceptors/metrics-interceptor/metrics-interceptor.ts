// metrics.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request } from 'express';
import { Counter, Histogram } from 'prom-client';
import { map } from 'rxjs/operators';
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly counter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();

    const request: Request = context.switchToHttp().getRequest();
    const showMetrics: boolean | undefined = !!request.query['showMetrics'];
    const method = request.method;
    const url = request.route?.path || request.url;

    this.counter.inc({ method, url });
    return next.handle().pipe(
        map((data) => {
        const duration = (Date.now() - now) / 1000;
        this.histogram.observe({ method, url }, duration);

        if (showMetrics) {
          return {
            ...data,
            metrics: { durationInSeconds: duration },
          };
        }
        return data;
      }),
    );
  }
}
