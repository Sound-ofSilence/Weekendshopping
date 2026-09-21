export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page p-8">
      <div className="w-full max-w-md rounded-lg bg-bg-card p-8 shadow-md">
        <h1 className="text-5xl font-bold text-primary">Weekend Shopping</h1>
        <p className="mt-4 text-lg text-text-secondary">
          多商家入驻型综合电商平台
        </p>
        <div className="mt-6 flex items-center gap-2">
          <span className="rounded-full bg-success px-3 py-1 text-xs text-text-inverse">
            已启动
          </span>
          <span className="text-xs text-text-disabled">v0.1.0</span>
        </div>
        <button className="mt-6 w-full cursor-pointer rounded-md bg-primary px-4 py-3 text-text-inverse transition hover:bg-primary-hover">
          立即体验
        </button>
      </div>
    </main>
  );
}