'use client';

import { useState } from 'react';
import PageHeader from '../../components/PageHeader';

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const defaultSchedule: DaySchedule[] = [
  { enabled: true, start: '09:00', end: '18:00' },
  { enabled: true, start: '09:00', end: '18:00' },
  { enabled: true, start: '09:00', end: '18:00' },
  { enabled: true, start: '09:00', end: '18:00' },
  { enabled: true, start: '09:00', end: '18:00' },
  { enabled: false, start: '10:00', end: '16:00' },
  { enabled: false, start: '10:00', end: '16:00' },
];

export default function ServiceHoursPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [saving, setSaving] = useState(false);

  const toggleDay = (index: number) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const updateTime = (index: number, field: 'start' | 'end', value: string) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
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
      <PageHeader title="服务时间管理" />

      <div className="px-4 space-y-3">
        <p className="text-gray-400 text-xs mb-2">设置您每天的可服务时段，关闭表示当天不接单</p>

        {schedule.map((day, index) => (
          <div key={index} className="bg-[#1a2332] rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-200 text-sm font-medium">{dayLabels[index]}</span>
              {/* Toggle */}
              <button
                onClick={() => toggleDay(index)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  day.enabled ? 'bg-[#10b981]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    day.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {day.enabled && (
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={day.start}
                  onChange={(e) => updateTime(index, 'start', e.target.value)}
                  className="flex-1 bg-[#253344] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm outline-none focus:border-[#10b981]"
                />
                <span className="text-gray-500 text-sm">至</span>
                <input
                  type="time"
                  value={day.end}
                  onChange={(e) => updateTime(index, 'end', e.target.value)}
                  className="flex-1 bg-[#253344] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm outline-none focus:border-[#10b981]"
                />
              </div>
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#10b981] text-white font-semibold rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-50 mt-4"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
