import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { ErrorCode, ErrorCodeValue, ErrorMessage } from '../constants/error-codes';
import { TRACE_ID_KEY } from '../constants/trace-id.constant';
import { AppException } from '../exceptions/app.exception';
import type { ApiResponse } from '../interfaces/api-response.interface';

interface HttpErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const traceId = this.cls.get<string>(TRACE_ID_KEY) ?? '';

    let statusCode: number;
    let code: ErrorCodeValue;
    let message: string;

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse() as string | HttpErrorBody;
      if (this.isValidationError(statusCode, body)) {
        code = ErrorCode.VALIDATION_FAILED;
        message = this.extractMessage(body) || ErrorMessage[code];
      } else {
        code = this.mapHttpStatusToCode(statusCode);
        message = this.extractMessage(body) || ErrorMessage[code] || exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrorCode.INTERNAL_ERROR;
      message = ErrorMessage[code];
    }

    const payload: ApiResponse<null> = { code, message, data: null, traceId };
    response.status(statusCode).json(payload);
  }

  private isValidationError(statusCode: number, body: string | HttpErrorBody): boolean {
    return statusCode === HttpStatus.BAD_REQUEST && typeof body === 'object' && Array.isArray(body.message);
  }

  private extractMessage(body: string | HttpErrorBody): string {
    if (typeof body === 'string') return body;
    if (Array.isArray(body.message)) return body.message.join('; ');
    if (typeof body.message === 'string') return body.message;
    return '';
  }

  private mapHttpStatusToCode(statusCode: number): ErrorCodeValue {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
