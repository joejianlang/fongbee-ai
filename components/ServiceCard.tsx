import { Star, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  provider: {
    id: string;
    businessName: string;
    avatar?: string;
    isVerified: boolean;
  };
  serviceArea?: string;
  averageRating: number;
  totalReviews: number;
  images: string[];
}

export function ServiceCard({
  id,
  title,
  description,
  basePrice,
  priceUnit,
  provider,
  serviceArea,
  averageRating,
  totalReviews,
  images,
}: ServiceCardProps) {
  const priceUnitDisplay = {
    hour: '小时',
    day: '天',
    project: '次',
    item: '个',
  }[priceUnit] || priceUnit;

  return (
    <Link href={`/app/services/${id}`}>
      <div className="bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        {/* Image */}
        <div className="w-full h-40 bg-gray-200 overflow-hidden">
          <img
            src={images[0] || '/placeholder.jpg'}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-base font-bold text-text-primary mb-1 line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {description}
          </p>

          {/* Provider */}
          <div className="flex items-center gap-2 mb-3">
            {provider.avatar && (
              <img
                src={provider.avatar}
                alt={provider.businessName}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {provider.businessName}
              </p>
              {provider.isVerified && (
                <p className="text-xs text-text-accent">已认证</p>
              )}
            </div>
          </div>

          {/* Location */}
          {serviceArea && (
            <div className="flex items-center gap-1 mb-3 text-xs text-text-muted">
              <MapPin size={14} />
              {serviceArea}
            </div>
          )}

          {/* Rating & Price */}
          <div className="flex items-center justify-between pt-3 border-t border-card-border">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.floor(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">
                {averageRating.toFixed(1)} ({totalReviews})
              </span>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-sm font-bold text-text-accent">
                ${basePrice.toFixed(2)}
              </p>
              <p className="text-xs text-text-muted">/{priceUnitDisplay}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
