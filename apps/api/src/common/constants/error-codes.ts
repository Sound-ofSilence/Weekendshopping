export const ErrorCode = {
  /** 成功 */
  SUCCESS: 0,
  // 1xxxx 参数错误
  BAD_REQUEST: 10000,
  VALIDATION_FAILED: 10001,
  // 2xxxx 认证/权限
  UNAUTHORIZED: 20000,
  TOKEN_EXPIRED: 20001,
  TOKEN_INVALID: 20002,
  FORBIDDEN: 20003,
  // 3xxxx 业务错误
  BUSINESS_ERROR: 30000,
  NOT_FOUND: 30001,
  CONFLICT: 30002,
  // 4xxxx 系统错误
  INTERNAL_ERROR: 40000,
  SERVICE_UNAVAILABLE: 40001,
  DATABASE_ERROR: 40010,
  REDIS_ERROR: 40011,
  RABBITMQ_ERROR: 40012,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessage: Record<ErrorCodeValue, string> = {
  [ErrorCode.SUCCESS]: 'success',
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.VALIDATION_FAILED]: '参数校验失败',
  [ErrorCode.UNAUTHORIZED]: '未认证或登录已失效',
  [ErrorCode.TOKEN_EXPIRED]: '登录已过期',
  [ErrorCode.TOKEN_INVALID]: '无效的令牌',
  [ErrorCode.FORBIDDEN]: '无权限访问',
  [ErrorCode.BUSINESS_ERROR]: '业务处理失败',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂不可用',
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.REDIS_ERROR]: '缓存服务错误',
  [ErrorCode.RABBITMQ_ERROR]: '消息队列错误',
};
