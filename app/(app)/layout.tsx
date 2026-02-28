import { cookies } from 'next/headers';
import TopHeader from '@/components/TopHeader';
import Navbar from '@/components/Navbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const enableEnglish = cookies().get('enableEnglish')?.value !== 'false';

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部 Header（固定，高度 56px = h-14） */}
      <TopHeader enableEnglish={enableEnglish} />

      {/* 主内容区：撑开 Header 高度，PC 端居中 960px，H5 端底部留 Navbar 空间 */}
      <main
        id="main-content"
        className="pt-14 pb-20 md:pb-6 md:max-w-[960px] md:mx-auto"
      >
        {children}
      </main>

      {/* 底部 Tab Bar（仅 H5） */}
      <Navbar />
    </div>
  );
}
