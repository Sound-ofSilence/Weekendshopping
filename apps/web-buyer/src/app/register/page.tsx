'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { sendSmsCode, register } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (!/^1[3-9]\d{9}$/.test(phone)) return alert('请输入正确的手机号');
    if (!code) return alert('请输入验证码');
    if (!password) return alert('请输入密码');
    if (password !== confirmPassword) return alert('两次密码不一致');
    if (!agreed) return alert('请先同意用户协议和隐私政策');

    setSubmitting(true);
    const result = await register(phone, password, code);

    if (result.success) {
      alert('注册成功，已自动登录');
      router.push('/me');
    } else {
      alert(result.message || '注册失败');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-primary">Weekend</span>
          <span className="ml-1 text-3xl font-bold text-text-primary">Shopping</span>
          <p className="mt-2 text-sm text-text-secondary">创建新账号</p>
        </div>

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

          <div>
            <label className="mb-1 block text-xs text-text-secondary">验证码</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="6 位验证码"
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

          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              密码（8-20 位，含字母和数字）
            </label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-text-secondary">确认密码</label>
            <Input
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 pt-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
            />
            <span>
              我已阅读并同意
              <span className="text-primary"> 《用户协议》 </span>
              和
              <span className="text-primary"> 《隐私政策》 </span>
            </span>
          </label>

          <Button size="lg" className="w-full" onClick={handleSubmit} loading={submitting}>
            注册
          </Button>

          <div className="text-center text-xs">
            <Link href="/login" className="text-primary hover:underline">
              已有账号？去登录
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-disabled">
          验证码会打印在后端日志中
        </p>
      </div>
    </div>
  );
}