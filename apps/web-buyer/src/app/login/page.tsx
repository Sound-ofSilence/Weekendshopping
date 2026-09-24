'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { sendSmsCode, loginWithSms, loginWithPassword } from '@/lib/auth-store';

type LoginMode = 'sms' | 'password';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('sms');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      alert('请输入正确的手机号');
      return;
    }
    setSending(true);
    const result = await sendSmsCode(phone);
    setSending(false);
    if (result.success) {
      setCountdown(60);
      alert('验证码已发送，请查看后端日志');
    } else {
      alert(result.message || '发送失败，请重试');
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      alert('请输入正确的手机号');
      return;
    }

    setSubmitting(true);

    let result;
    if (mode === 'sms') {
      if (!code) {
        alert('请输入验证码');
        setSubmitting(false);
        return;
      }
      result = await loginWithSms(phone, code);
    } else {
      if (!password) {
        alert('请输入密码');
        setSubmitting(false);
        return;
      }
      result = await loginWithPassword(phone, password);
    }

    if (result.success) {
      alert('登录成功');
      router.push('/me');
    } else {
      alert(result.message || '登录失败');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-primary">Weekend</span>
          <span className="ml-1 text-3xl font-bold text-text-primary">Shopping</span>
          <p className="mt-2 text-sm text-text-secondary">多商家入驻型综合电商平台</p>
        </div>

        {/* Tab 切换 */}
        <div className="mb-6 flex justify-center gap-2">
          <button
            onClick={() => setMode('sms')}
            className={`cursor-pointer rounded-full px-6 py-2 text-sm transition ${
              mode === 'sms'
                ? 'bg-primary text-white'
                : 'bg-bg-card text-text-secondary hover:text-primary'
            }`}
          >
            验证码登录
          </button>
          <button
            onClick={() => setMode('password')}
            className={`cursor-pointer rounded-full px-6 py-2 text-sm transition ${
              mode === 'password'
                ? 'bg-primary text-white'
                : 'bg-bg-card text-text-secondary hover:text-primary'
            }`}
          >
            密码登录
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-4 rounded-lg bg-bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">手机号</label>
            <Input
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              maxLength={11}
            />
          </div>

          {mode === 'sms' ? (
            <div>
              <label className="mb-1 block text-xs text-text-secondary">验证码</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="请输入 6 位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || sending}
                  loading={sending}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-text-secondary">密码</label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <Button size="lg" className="w-full" onClick={handleSubmit} loading={submitting}>
            登录
          </Button>

          <div className="flex items-center justify-between text-xs">
            <Link href="/register" className="text-primary hover:underline">
              没有账号？去注册
            </Link>
            <button
              onClick={() => alert('忘记密码（Mock）')}
              className="cursor-pointer text-text-secondary hover:text-primary"
            >
              忘记密码？
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-disabled">
          验证码会打印在后端日志中
        </p>
      </div>
    </div>
  );
}