'use client';

import { Star } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
}

// TODO: Fetch from API
const mockReviews: Review[] = [
  {
    id: '1',
    customerName: '李**',
    rating: 5,
    comment: '服务非常专业，准时到达，工作效率高，会再次预约！',
    service: '家庭清洁',
    date: '2024-01-15',
  },
  {
    id: '2',
    customerName: '张**',
    rating: 4,
    comment: '整体不错，价格合理，下次还会找您。',
    service: '水管维修',
    date: '2024-01-10',
  },
  {
    id: '3',
    customerName: '王**',
    rating: 5,
    comment: '很满意，问题解决得很彻底，态度也好。',
    service: '电气安装',
    date: '2024-01-05',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const avgRating =
    mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;

  return (
    <div>
      <PageHeader title="收到的评论" />

      <div className="px-4">
        {/* Summary Card */}
        <div className="bg-[#1a2332] rounded-2xl p-5 mb-6 flex items-center gap-6">
          <div className="text-center">
            <p className="text-[#10b981] text-4xl font-bold">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} />
            <p className="text-gray-400 text-xs mt-1">{mockReviews.length} 条评价</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = mockReviews.filter((r) => r.rating === star).length;
              const pct = (count / mockReviews.length) * 100;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-4">{star}</span>
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                    <div
                      className="h-1.5 bg-yellow-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-3">
          {mockReviews.map((review) => (
            <div key={review.id} className="bg-[#1a2332] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{review.customerName}</p>
                  <p className="text-gray-500 text-xs">{review.service}</p>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} />
                  <p className="text-gray-500 text-xs mt-1">{review.date}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
