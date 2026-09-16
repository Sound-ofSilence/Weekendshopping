import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { TRACE_ID_KEY } from '../constants/trace-id.constant';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-trace-id'];
    const traceId = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    req.id = traceId;
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    this.cls.runWith({ [TRACE_ID_KEY]: traceId }, () => next());
  }
}
