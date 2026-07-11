import clsx from 'clsx';

interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
}

interface StatsBarProps {
  stats: StatItem[];
  className?: string;
}

const colorMap = {
  primary: 'text-primary bg-blue-50',
  success: 'text-success bg-green-50',
  warning: 'text-warning bg-amber-50',
  danger: 'text-danger bg-red-50',
  secondary: 'text-secondary bg-teal-50',
};

export default function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div
      className={clsx(
        'grid gap-4',
        stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        className
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white rounded-card shadow-card px-5 py-4 flex items-center gap-4"
        >
          {stat.icon && (
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                colorMap[stat.color || 'primary']
              )}
            >
              {stat.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className={clsx(
                'text-2xl font-bold leading-tight',
                `text-${stat.color || 'primary'}`
              )}
              style={{
                color:
                  stat.color === 'primary'
                    ? '#0D47A1'
                    : stat.color === 'success'
                    ? '#2E7D32'
                    : stat.color === 'warning'
                    ? '#F57F17'
                    : stat.color === 'danger'
                    ? '#C62828'
                    : stat.color === 'secondary'
                    ? '#00838F'
                    : '#0D47A1',
              }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-text-secondary mt-0.5 leading-tight">{stat.label}</p>
            {stat.trendValue && (
              <p
                className={clsx(
                  'text-[11px] font-medium mt-1',
                  stat.trend === 'up'
                    ? 'text-success'
                    : stat.trend === 'down'
                    ? 'text-danger'
                    : 'text-text-secondary'
                )}
              >
                {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}{' '}
                {stat.trendValue}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
