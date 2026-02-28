'use client';

import { useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const availableCities = ['Guelph', 'Kitchener', 'Waterloo', 'Cambridge', 'Hamilton', 'Brantford'];

export default function ServiceAreasPage() {
  const [selectedCities, setSelectedCities] = useState<string[]>(['Guelph']);
  const [radius, setRadius] = useState(20);
  const [saving, setSaving] = useState(false);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Call API
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="服务区域管理" />

      <div className="px-4 space-y-6">
        {/* Current Location */}
        <div className="bg-[#1a2332] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={20} className="text-[#10b981]" />
            <p className="text-gray-200 text-sm font-medium">当前主要服务城市</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((city) => (
              <span
                key={city}
                className="flex items-center gap-1.5 bg-[#10b981]/20 text-[#10b981] text-sm px-3 py-1.5 rounded-full border border-[#10b981]/40"
              >
                {city}
                <button onClick={() => toggleCity(city)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Service Radius */}
        <div className="bg-[#1a2332] rounded-2xl p-5">
          <p className="text-gray-200 text-sm font-medium mb-3">服务半径</p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={100}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="flex-1 accent-[#10b981]"
            />
            <span className="text-[#10b981] text-sm font-bold w-16 text-right">
              {radius} km
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">超出此半径的订单将不会推送给您</p>
        </div>

        {/* Available Cities */}
        <div>
          <p className="text-gray-400 text-sm mb-3">选择服务城市</p>
          <div className="grid grid-cols-2 gap-3">
            {availableCities.map((city) => (
              <button
                key={city}
                onClick={() => toggleCity(city)}
                className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                  selectedCities.includes(city)
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                    : 'bg-[#1a2332] text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#10b981] text-white font-semibold rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
