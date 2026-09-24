/**
 * 认证中心
 * 真实调用后端 /auth/* 接口
 */

import { api, ApiError } from './api';

export interface AuthUser {
  id: number;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  role: 'BUYER' | 'MERCHANT' | 'ADMIN';
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

const USER_KEY = 'ws_auth_user';
const ACCESS_TOKEN_KEY = 'ws_auth_token';
const REFRESH_TOKEN_KEY = 'ws_auth_refresh_token';
const EVENT_NAME = 'ws_auth_updated';

// ==================== 会话（本地存储） ====================

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getUser() && !!getToken();
}

function saveSession(
  user: AuthUser,
  accessToken: string,
  refreshToken: string,
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.dispatchEvent(new Event(EVENT_NAME));
}

function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onAuthUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

// ==================== 后端返回结构 ====================

interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    phone: string;
    nickname: string | null;
    avatar: string | null;
    role?: string;
    roles?: { roleCode: string }[];
  };
}

function normalizeUser(raw: BackendAuthResponse['user']): AuthUser {
  let role: AuthUser['role'] = 'BUYER';
  if (raw.role === 'ADMIN' || raw.role === 'MERCHANT' || raw.role === 'BUYER') {
    role = raw.role;
  } else if (raw.roles?.[0]?.roleCode) {
    const r = raw.roles[0].roleCode.toUpperCase();
    if (r === 'ADMIN' || r === 'MERCHANT' || r === 'BUYER') {
      role = r as AuthUser['role'];
    }
  }
  return {
    id: raw.id,
    phone: raw.phone,
    nickname: raw.nickname,
    avatar: raw.avatar,
    role,
  };
}

function handleApiError(err: unknown): AuthResult {
  if (err instanceof ApiError) {
    return { success: false, message: err.message || '请求失败' };
  }
  console.error('Auth error:', err);
  return { success: false, message: '网络异常，请检查网络后重试' };
}

// ==================== 发送验证码 ====================

export async function sendSmsCode(
  phone: string,
): Promise<{ success: boolean; message?: string }> {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '请输入正确的手机号' };
  }
  try {
    await api.post('/auth/send-sms', { phone });
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: err.message };
    }
    return { success: false, message: '发送失败，请重试' };
  }
}

// ==================== 登录 ====================

export async function loginWithPassword(
  phone: string,
  password: string,
): Promise<AuthResult> {
  try {
    const data = await api.post<BackendAuthResponse>('/auth/login', {
      phone,
      password,
    });
    const user = normalizeUser(data.user);
    saveSession(user, data.accessToken, data.refreshToken);
    return { success: true, user };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function loginWithSms(
  phone: string,
  smsCode: string,
): Promise<AuthResult> {
  try {
    const data = await api.post<BackendAuthResponse>('/auth/login', {
      phone,
      smsCode,
    });
    const user = normalizeUser(data.user);
    saveSession(user, data.accessToken, data.refreshToken);
    return { success: true, user };
  } catch (err) {
    return handleApiError(err);
  }
}

// ==================== 注册 ====================

export async function register(
  phone: string,
  password: string,
  smsCode: string,
): Promise<AuthResult> {
  try {
    const nickname = `用户${phone.slice(-4)}`;
    const data = await api.post<BackendAuthResponse>('/auth/register', {
      phone,
      password,
      smsCode,
      nickname,
    });
    const user = normalizeUser(data.user);
    saveSession(user, data.accessToken, data.refreshToken);
    return { success: true, user };
  } catch (err) {
    return handleApiError(err);
  }
}

// ==================== 刷新 ====================

export async function refreshSession(): Promise<AuthResult> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return { success: false, message: '未登录' };
  }
  try {
    const data = await api.post<BackendAuthResponse>('/auth/refresh', {
      refreshToken,
    });
    const user = normalizeUser(data.user);
    saveSession(user, data.accessToken, data.refreshToken);
    return { success: true, user };
  } catch (err) {
    clearSession();
    return handleApiError(err);
  }
}

// ==================== 登出 ====================

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // 忽略（JWT 无状态，即使请求失败也清本地）
  }
  clearSession();
}