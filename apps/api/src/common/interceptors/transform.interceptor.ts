import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClsService } from 'nestjs-cls';
import { ErrorCode, ErrorMessage } from '../constants/error-codes';
import { TRACE_ID_KEY } from '../constants/trace-id.constant';
import type { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly cls: ClsService) {}

  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        return {
          code: ErrorCode.SUCCESS,
          message: ErrorMessage[ErrorCode.SUCCESS],
          data: data ?? null,
          traceId: this.cls.get<string>(TRACE_ID_KEY) ?? '',
        };
      }),
    );
  }
}
