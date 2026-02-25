'use client';

import { useEffect, useState } from 'react';
import { ServiceCard } from '@/components/ServiceCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Search } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  serviceArea?: string;
  averageRating: number;
  totalReviews: number;
  images: string[];
  serviceProvider: {
    id: string;
    businessName: string;
    user?: { avatar?: string };
    isVerified: boolean;
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(searchText && { searchText }),
        });

        const response = await fetch(`/api/services?${params}`);
        const data = await response.json();

        if (data.success) {
          setServices((prev) =>
            page === 1 ? data.data.items : [...prev, ...data.data.items]
          );
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [page, searchText]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-text-primary">服务市场</h1>
        <p className="text-text-secondary text-sm mt-1">发现附近的服务</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="搜索服务..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full"
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          <Search size={20} />
        </Button>
      </form>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            {...service}
            provider={{
              id: service.serviceProvider.id,
              businessName: service.serviceProvider.businessName,
              avatar: service.serviceProvider.user?.avatar,
              isVerified: service.serviceProvider.isVerified,
            }}
          />
        ))}
      </div>

      {/* Loading State */}
      {loading && services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">加载中...</p>
        </div>
      )}

      {/* Load More */}
      {!loading && services.length > 0 && (
        <div className="flex justify-center py-4">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            isLoading={loading}
          >
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
}
