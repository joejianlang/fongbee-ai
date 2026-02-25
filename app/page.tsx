export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">优服佳</h1>
        <p className="text-text-secondary mb-8">
          本地服务与 AI-News Feed 集成平台
        </p>
        <div className="space-y-2">
          <p className="text-text-muted">正在初始化项目...</p>
          <p className="text-sm text-text-muted">
            移动端: <a href="/app" className="text-text-accent hover:underline">/app</a>
          </p>
          <p className="text-sm text-text-muted">
            管理端: <a href="/admin" className="text-text-accent hover:underline">/admin</a>
          </p>
        </div>
      </div>
    </main>
  );
}
