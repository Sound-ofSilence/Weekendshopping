'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import {
  getAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress,
  type Address,
} from '@/lib/address-store';

export default function AddressPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const [form, setForm] = useState({
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    tag: '',
    isDefault: false,
  });

  useEffect(() => {
    refresh();
    setMounted(true);
  }, []);

  const refresh = () => setAddresses(getAddresses());

  const openNew = () => {
    setEditing(null);
    setForm({
      receiver: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      tag: '',
      isDefault: false,
    });
    setShowEditor(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      receiver: addr.receiver,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      tag: addr.tag || '',
      isDefault: addr.isDefault,
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!form.receiver.trim()) return alert('请填写收货人');
    if (!form.phone.trim()) return alert('请填写手机号');
    if (!form.province.trim() || !form.city.trim() || !form.district.trim())
      return alert('请填写完整的省市区');
    if (!form.detail.trim()) return alert('请填写详细地址');

    if (editing) {
      updateAddress(editing.id, form);
    } else {
      addAddress(form);
    }
    setShowEditor(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (confirm('确定删除这个地址吗？')) {
      removeAddress(id);
      refresh();
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultAddress(id);
    refresh();
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pb-24">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">收货地址</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">📍</div>
            <p className="text-text-secondary">还没有收货地址</p>
            <Button onClick={openNew}>+ 添加地址</Button>
          </div>
        )}

        {addresses.map((addr) => (
          <Card key={addr.id} className="rounded-none">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={addr.isDefault}
                onChange={() => handleSetDefault(addr.id)}
                className="mt-1 h-4 w-4 cursor-pointer accent-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{addr.receiver}</span>
                  <span className="text-xs text-text-secondary">{addr.phone}</span>
                  {addr.tag && (
                    <span className="rounded bg-primary-light px-1.5 py-0.5 text-xs text-primary">
                      {addr.tag}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-white">
                      默认
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {addr.province}
                  {addr.city}
                  {addr.district}
                  {addr.detail}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-border-light pt-3">
              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="cursor-pointer text-xs text-text-secondary hover:text-primary"
                >
                  设为默认
                </button>
              )}
              <button
                onClick={() => openEdit(addr)}
                className="cursor-pointer text-xs text-text-secondary hover:text-primary"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                className="cursor-pointer text-xs text-text-secondary hover:text-error"
              >
                删除
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部添加按钮 */}
      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto max-w-screen-xl px-4 py-3">
          <Button size="lg" className="w-full" onClick={openNew}>
            + 新增收货地址
          </Button>
        </div>
      </div>

      {/* 编辑弹层 */}
      {showEditor && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowEditor(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-card p-4 md:left-1/2 md:right-auto md:w-[500px] md:-translate-x-1/2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editing ? '编辑地址' : '新增地址'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="cursor-pointer text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  收货人
                </label>
                <Input
                  placeholder="请输入姓名"
                  value={form.receiver}
                  onChange={(e) => setForm({ ...form, receiver: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  手机号
                </label>
                <Input
                  placeholder="请输入手机号"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    省
                  </label>
                  <Input
                    placeholder="广东省"
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    市
                  </label>
                  <Input
                    placeholder="深圳市"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    区
                  </label>
                  <Input
                    placeholder="南山区"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  详细地址
                </label>
                <Input
                  placeholder="街道、门牌号等"
                  value={form.detail}
                  onChange={(e) => setForm({ ...form, detail: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  标签
                </label>
                <div className="flex gap-2">
                  {['家', '公司', '学校'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setForm({ ...form, tag })}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition ${
                        form.tag === tag
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border text-text-secondary hover:border-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="text-sm">设为默认地址</span>
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditor(false)}
              >
                取消
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}