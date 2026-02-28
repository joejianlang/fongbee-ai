'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ title, rightElement }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-4">
      <button
        onClick={() => router.back()}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1a2332] text-gray-300 hover:bg-[#253344] transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className="text-white text-base font-bold">{title}</h1>
      <div className="w-9">{rightElement}</div>
    </div>
  );
}
