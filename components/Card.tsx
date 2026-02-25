interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-card border border-card-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
}

export function StatsCard({
  label,
  value,
  trend,
  icon,
  bgColor = '#dbeafe',
  iconColor = '#3b82f6',
}: StatsCardProps) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-text-muted text-sm">{label}</p>
        <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
        {trend && <p className="text-text-accent text-sm mt-1">↑ {trend}</p>}
      </div>
      {icon && (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      )}
    </Card>
  );
}
