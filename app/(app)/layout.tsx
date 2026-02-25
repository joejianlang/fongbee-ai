import Navbar from '@/components/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-20 md:pb-0">
        {children}
      </div>
      <Navbar />
    </div>
  );
}
