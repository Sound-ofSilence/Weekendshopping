type OrderStatus =
  | 'PENDING_PAY'
  | 'PAID'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'FINISHED'
  | 'CLOSED'
  | 'CANCELLED';

const statusMap: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAY: { label: '待付款', className: 'bg-orange-100 text-orange-600' },
  PAID: { label: '待发货', className: 'bg-blue-100 text-blue-600' },
  SHIPPED: { label: '待收货', className: 'bg-cyan-100 text-cyan-600' },
  RECEIVED: { label: '已收货', className: 'bg-green-100 text-green-600' },
  FINISHED: { label: '已完成', className: 'bg-gray-100 text-gray-600' },
  CLOSED: { label: '已关闭', className: 'bg-gray-100 text-gray-500' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
};

export function StatusTag({ status }: { status: OrderStatus }) {
  const s = statusMap[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}