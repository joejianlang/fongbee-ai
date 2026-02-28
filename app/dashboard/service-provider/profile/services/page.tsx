'use client';

import { useState } from 'react';
import { Plus, Toggle, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Service {
  id: string;
  name: string;
  price: number;
  unit: string;
  enabled: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: '家庭清洁', price: 80, unit: '/次', enabled: true },
    { id: '2', name: '水管维修', price: 120, unit: '/小时', enabled: true },
    { id: '3', name: '电气安装', price: 150, unit: '/小时', enabled: false },
  ]);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <div>
      <PageHeader
        title="标准服务管理"
        rightElement={
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#10b981] text-white">
            <Plus size={18} />
          </button>
        }
      />

      <div className="px-4">
        <p className="text-gray-400 text-xs mb-4">
          管理您提供的服务项目，开启/关闭可控制客户是否能看到该服务
        </p>

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
              <Plus size={32} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">还没有添加服务</p>
            <button className="mt-4 px-6 py-2.5 bg-[#10b981] text-white rounded-xl text-sm font-medium">
              添加第一个服务
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center bg-[#1a2332] rounded-2xl px-5 py-4"
              >
                <div className="flex-1">
                  <p className="text-gray-200 text-sm font-medium">{service.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    ${service.price}{service.unit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleService(service.id)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      service.enabled ? 'bg-[#10b981]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        service.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <ChevronRight size={16} className="text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
