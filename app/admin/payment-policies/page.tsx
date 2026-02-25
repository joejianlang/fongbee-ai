'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Edit2, Trash2 } from 'lucide-react';

interface PaymentPolicy {
  id: string;
  serviceType: string;
  autoCaptureHoursBefore: number;
  isAutoCaptureEnabled: boolean;
  cancellationCutoffHours: number;
  forfeiturePercentage: number;
  depositPercentage?: number;
  refundDays: number;
}

export default function PaymentPoliciesPage() {
  const [policies, setPolicies] = useState<PaymentPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    serviceType: 'standard',
    autoCaptureHoursBefore: 48,
    isAutoCaptureEnabled: true,
    cancellationCutoffHours: 48,
    forfeiturePercentage: 20,
    depositPercentage: 30,
    refundDays: 7,
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/payment-policies');
        const data = await response.json();

        if (data.success) {
          setPolicies(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/payment-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingId) {
          setPolicies(policies.map((p) => (p.id === editingId ? data.data : p)));
        } else {
          setPolicies([...policies, data.data]);
        }
        setShowForm(false);
        setEditingId(null);
        setFormData({
          serviceType: 'standard',
          autoCaptureHoursBefore: 48,
          isAutoCaptureEnabled: true,
          cancellationCutoffHours: 48,
          forfeiturePercentage: 20,
          depositPercentage: 30,
          refundDays: 7,
        });
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
    }
  };

  const handleEdit = (policy: PaymentPolicy) => {
    setFormData({
      serviceType: policy.serviceType,
      autoCaptureHoursBefore: policy.autoCaptureHoursBefore,
      isAutoCaptureEnabled: policy.isAutoCaptureEnabled,
      cancellationCutoffHours: policy.cancellationCutoffHours,
      forfeiturePercentage: policy.forfeiturePercentage,
      depositPercentage: policy.depositPercentage ?? 30,
      refundDays: policy.refundDays,
    });
    setEditingId(policy.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">支付政策管理</h1>
          <p className="text-text-secondary mt-1">
            配置不同服务类型的自动划扣时间与违约规则
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            + 新建政策
          </Button>
        )}
      </div>

      {/* Policies Grid */}
      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  {policy.serviceType === 'standard'
                    ? '标准服务'
                    : policy.serviceType === 'simple_custom'
                    ? '简单定制'
                    : '复杂定制'}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(policy)}
                    className="p-2 hover:bg-opacity-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 hover:bg-red-100 rounded-lg text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">自动划扣启用</span>
                  <span className="font-medium">
                    {policy.isAutoCaptureEnabled ? '✓ 是' : '✗ 否'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">提前划扣时间</span>
                  <span className="font-medium">
                    {policy.autoCaptureHoursBefore} 小时
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">取消截止时间</span>
                  <span className="font-medium">
                    {policy.cancellationCutoffHours} 小时前
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">违约金比例</span>
                  <span className="font-medium">{policy.forfeiturePercentage}%</span>
                </div>
                {policy.depositPercentage && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">定金比例</span>
                    <span className="font-medium">{policy.depositPercentage}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">退款周期</span>
                  <span className="font-medium">{policy.refundDays} 天</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <h3 className="text-xl font-bold text-text-primary mb-6">
            {editingId ? '编辑' : '创建'}支付政策
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                服务类型
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) =>
                  setFormData({ ...formData, serviceType: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-card-border bg-card text-text-primary"
              >
                <option value="standard">标准服务</option>
                <option value="simple_custom">简单定制</option>
                <option value="complex_custom">复杂定制</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="提前划扣时间 (小时)"
                type="number"
                value={formData.autoCaptureHoursBefore}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoCaptureHoursBefore: parseInt(e.target.value),
                  })
                }
              />
              <Input
                label="取消截止时间 (小时)"
                type="number"
                value={formData.cancellationCutoffHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cancellationCutoffHours: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="违约金比例 (%)"
                type="number"
                value={formData.forfeiturePercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    forfeiturePercentage: parseInt(e.target.value),
                  })
                }
              />
              <Input
                label="定金比例 (%)"
                type="number"
                value={formData.depositPercentage || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    depositPercentage: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <Input
              label="退款周期 (天)"
              type="number"
              value={formData.refundDays}
              onChange={(e) =>
                setFormData({ ...formData, refundDays: parseInt(e.target.value) })
              }
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" variant="primary" fullWidth>
                💾 保存
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                ❌ 取消
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
