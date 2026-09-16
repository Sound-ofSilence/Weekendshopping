import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCodeValue } from '../constants/error-codes';

export class AppException extends HttpException {
  public readonly code: ErrorCodeValue;

  constructor(code: ErrorCodeValue, message: string, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, httpStatus);
    this.code = code;
  }
}
