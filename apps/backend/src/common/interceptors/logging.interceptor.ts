import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor
  implements NestInterceptor
{
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request =
      context.switchToHttp().getRequest();

    const response =
      context.switchToHttp().getResponse();

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        const method = request.method;

        const url = request.originalUrl;

        const status = response.statusCode;

        const ip = request.ip;

        const user =
          request.user?.id ??
          request.user?.email ??
          'Anonymous';

        this.logger.log(
          `${method} ${url} ${status} ${duration}ms IP:${ip} User:${user}`,
        );
      }),
    );
  }
}