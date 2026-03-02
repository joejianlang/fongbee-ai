'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, ChevronRight, CheckCircle } from 'lucide-react';
import { MOCK_SERVICES } from '@/lib/mockServices';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const service = MOCK_SERVICES.find((s) => s.id === id) ?? MOCK_SERVICES[0];

  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const DATES = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState(formatDate(DATES[0]));
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPkg,  setSelectedPkg]  = useState(0);
  const [address,      setAddress]      = useState('');
  const [note,         setNote]         = useState('');
  const [submitted,    setSubmitted]    = useState(false);

  const PACKAGES = [
    { name: '基础套餐', desc: '1–2居室，约3小时', price: service.basePrice },
    { name: '标准套餐', desc: '3居室，约5小时',   price: Math.round(service.basePrice * 1.6) },
    { name: '豪华套餐', desc: '4居室以上',         price: Math.round(service.basePrice * 2.4) },
  ];

  const weekDay = (d: Date) => ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  const canSubmit = selectedDate && selectedTime && address.trim();

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#0d9488]/10 flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-[#0d9488]" />
        </div>
        <h1 className="text-xl font-bold text-text-primary dark:text-white mb-2">预约成功！</h1>
        <p className="text-text-muted text-sm mb-1">订单号：#ORD-{Math.floor(Math.random() * 90000) + 10000}</p>
        <p className="text-text-secondary text-sm mb-6">
          {service.providerName} 将在 2 小时内与您确认预约时间
        </p>
        <div className="bg-gray-50 dark:bg-[#2d2d30] rounded-xl p-4 w-full max-w-sm text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">服务</span>
            <span className="text-text-primary dark:text-white font-medium">{service.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">套餐</span>
            <span className="text-text-primary dark:text-white font-medium">{PACKAGES[selectedPkg].name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">日期</span>
            <span className="text-text-primary dark:text-white font-medium">{selectedDate} {selectedTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">金额</span>
            <span className="text-[#0d9488] font-bold">${PACKAGES[selectedPkg].price}</span>
          </div>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <Link href="/orders" className="flex-1 py-3 border border-[#0d9488] text-[#0d9488] rounded-xl text-sm font-medium text-center hover:bg-[#0d9488]/5 transition-colors">
            查看订单
          </Link>
          <Link href="/services" className="flex-1 py-3 bg-[#0d9488] text-white rounded-xl text-sm font-medium text-center hover:bg-[#0a7c71] transition-colors">
            继续浏览
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-10">
      {/* 顶部导航 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href={`/services/${id}`} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />
          返回
        </Link>
        <span className="text-text-primary dark:text-white font-semibold text-sm">预约下单</span>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-5">
        {/* 服务简介 */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <img src={service.imageUrl} alt={service.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          <div>
            <p className="font-semibold text-text-primary dark:text-white text-sm">{service.title}</p>
            <p className="text-xs text-[#0d9488] mt-0.5">{service.providerName}</p>
          </div>
        </div>

        {/* 套餐 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3 text-sm">选择套餐</h2>
          <div className="space-y-2">
            {PACKAGES.map((pkg, i) => (
              <button
                key={pkg.name}
                onClick={() => setSelectedPkg(i)}
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  selectedPkg === i ? 'border-[#0d9488] bg-[#0d9488]/5' : 'border-border-primary hover:border-[#0d9488]'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary dark:text-white">{pkg.name}</p>
                  <p className="text-xs text-text-muted">{pkg.desc}</p>
                </div>
                <span className="text-[#0d9488] font-bold text-sm">${pkg.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 日期选择 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-[#0d9488]" />选择日期
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DATES.map((d) => {
              const key = formatDate(d);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border transition-colors ${
                    selectedDate === key ? 'border-[#0d9488] bg-[#0d9488] text-white' : 'border-border-primary text-text-secondary hover:border-[#0d9488]'
                  }`}
                >
                  <span className="text-xs">{`周${weekDay(d)}`}</span>
                  <span className="font-bold text-base">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 时间选择 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3 text-sm flex items-center gap-2">
            <Clock size={16} className="text-[#0d9488]" />选择时间
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  selectedTime === t ? 'border-[#0d9488] bg-[#0d9488] text-white' : 'border-border-primary text-text-secondary hover:border-[#0d9488]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 上门地址 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3 text-sm flex items-center gap-2">
            <MapPin size={16} className="text-[#0d9488]" />上门地址
          </h2>
          <AddressAutocomplete
            value={address}
            onChange={(val) => setAddress(val)}
            placeholder="请输入完整地址，如：123 Gordon St, Guelph, ON N1G 1Y1"
            className="w-full px-3 py-2.5 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
          />
        </div>

        {/* 备注 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3 text-sm">备注（选填）</h2>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="如有特殊要求，请在此说明..."
            className="w-full px-3 py-2.5 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40 resize-none"
          />
        </div>
      </div>

      {/* 底部确认栏 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 z-40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">实付金额</span>
          <span className="text-[#0d9488] font-bold text-lg">${PACKAGES[selectedPkg].price}</span>
        </div>
        <button
          onClick={() => canSubmit && setSubmitted(true)}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
            canSubmit
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canSubmit ? '确认预约' : '请填写日期、时间和地址'}
        </button>
      </div>
    </div>
  );
}
