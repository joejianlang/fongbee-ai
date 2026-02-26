import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登录 - 优服佳',
  description: '优服佳登录及注册页面',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
