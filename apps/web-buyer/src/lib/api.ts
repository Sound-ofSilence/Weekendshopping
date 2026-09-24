/**
 * API 客户端
 * 统一使用 /api 前缀：
 *   - 本地开发：Next.js rewrite 转发到 http://localhost:4000
 *   - 生产环境：Nginx 转发到 weekend-api:4000
 */

const API_BASE = '/api';
const TOKEN_KEY = 'ws_auth_token';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 处理非 2xx 响应
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      msg = errJson.message || msg;
    } catch {
      // 忽略
    }
    throw new ApiError(res.status, msg);
  }

  const json: ApiResponse<T> = await res.json();

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};