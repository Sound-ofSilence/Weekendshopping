import { Button, Card, Input, PriceText, StatusTag } from '@/components/ui';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page p-8">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-4xl font-bold text-primary">组件测试</h1>

        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-sm text-text-secondary">Button 组件</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">主要</Button>
              <Button variant="outline">次要</Button>
              <Button variant="danger">危险</Button>
              <Button variant="primary" loading>
                加载
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-text-secondary">Input 组件</p>
            <Input placeholder="请输入手机号" />
          </div>

          <div>
            <p className="mb-2 text-sm text-text-secondary">PriceText 组件</p>
            <PriceText price="99.00" originalPrice="199.00" size="lg" />
          </div>

          <div>
            <p className="mb-2 text-sm text-text-secondary">StatusTag 组件</p>
            <div className="flex gap-2">
              <StatusTag status="PENDING_PAY" />
              <StatusTag status="PAID" />
              <StatusTag status="SHIPPED" />
              <StatusTag status="FINISHED" />
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}