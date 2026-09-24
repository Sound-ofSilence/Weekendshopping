/**
 * 本地认证中心
 * 现在用 localStorage + Mock 验证码，后期接真实 /auth/login API 时只改内部实现
 */

export interface AuthUser {
  id: number;
  phone: string;
  nickname: string;
  avatar: string;
  role: 'BUYER' | 'MERCHANT' | 'ADMIN';
}

const USER_KEY = 'ws_auth_user';
const TOKEN_KEY = 'ws_auth_token';
const EVENT_NAME = 'ws_auth_updated';

// ==================== 会话 ====================

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
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getUser() && !!getToken();
}

function saveSession(user: AuthUser, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onAuthUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

// ==================== 验证码（Mock） ====================

const SMS_KEY = 'ws_sms_codes';
const SMS_TTL = 5 * 60 * 1000; // 5 分钟有效

interface SmsRecord {
  code: string;
  expiresAt: number;
}

function getSmsRecords(): Record<string, SmsRecord> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(SMS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * 发送验证码（Mock，直接返回一个固定验证码用于演示）
 */
export function sendSmsCode(phone: string): { code: string; success: boolean } {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { code: '', success: false };
  }
  // 生成 6 位验证码（演示环境固定为 123456，方便测试）
  const code = '123456';
  const records = getSmsRecords();
  records[phone] = {
    code,
    expiresAt: Date.now() + SMS_TTL,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SMS_KEY, JSON.stringify(records));
  }
  return { code, success: true };
}

export function verifySmsCode(phone: string, code: string): boolean {
  const records = getSmsRecords();
  const record = records[phone];
  if (!record) return false;
  if (record.expiresAt < Date.now()) return false;
  return record.code === code;
}

// ==================== 登录 / 注册 ====================

const USERS_KEY = 'ws_users';

interface StoredUser {
  id: number;
  phone: string;
  password: string;
  nickname: string;
  avatar: string;
  role: 'BUYER' | 'MERCHANT' | 'ADMIN';
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginWithPassword(
  phone: string,
  password: string,
): { success: boolean; user?: AuthUser; message?: string } {
  const users = getStoredUsers();
  const user = users.find((u) => u.phone === phone);
  if (!user) {
    return { success: false, message: '手机号未注册' };
  }
  if (user.password !== password) {
    return { success: false, message: '密码错误' };
  }

  const authUser: AuthUser = {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
  };
  saveSession(authUser, `mock-token-${user.id}-${Date.now()}`);
  return { success: true, user: authUser };
}

export function loginWithSms(
  phone: string,
  code: string,
): { success: boolean; user?: AuthUser; message?: string } {
  if (!verifySmsCode(phone, code)) {
    return { success: false, message: '验证码错误或已过期' };
  }

  const users = getStoredUsers();
  let user = users.find((u) => u.phone === phone);
  if (!user) {
    // 自动注册
    user = {
      id: Date.now(),
      phone,
      password: '',
      nickname: `用户${phone.slice(-4)}`,
      avatar: '',
      role: 'BUYER',
    };
    users.push(user);
    saveStoredUsers(users);
  }

  const authUser: AuthUser = {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
  };
  saveSession(authUser, `mock-token-${user.id}-${Date.now()}`);
  return { success: true, user: authUser };
}

export function register(
  phone: string,
  password: string,
  code: string,
): { success: boolean; user?: AuthUser; message?: string } {
  if (!verifySmsCode(phone, code)) {
    return { success: false, message: '验证码错误或已过期' };
  }
  if (password.length < 8 || password.length > 20) {
    return { success: false, message: '密码需 8-20 位' };
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return { success: false, message: '密码需同时包含字母和数字' };
  }

  const users = getStoredUsers();
  if (users.some((u) => u.phone === phone)) {
    return { success: false, message: '该手机号已注册' };
  }

  const newUser: StoredUser = {
    id: Date.now(),
    phone,
    password,
    nickname: `用户${phone.slice(-4)}`,
    avatar: '',
    role: 'BUYER',
  };
  users.push(newUser);
  saveStoredUsers(users);

  const authUser: AuthUser = {
    id: newUser.id,
    phone: newUser.phone,
    nickname: newUser.nickname,
    avatar: newUser.avatar,
    role: newUser.role,
  };
  saveSession(authUser, `mock-token-${newUser.id}-${Date.now()}`);
  return { success: true, user: authUser };
}