'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface Stat {
  label: string;
  value: string | number;
  alert?: boolean;
}

interface ModuleCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  stats: Stat[];
  color: string;
  bgColor: string;
  href: string;
  isLoading?: boolean;
  description?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden animate-pulse">
      <div className="h-16 bg-gray-200" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ModuleCard({
  id,
  title,
  icon,
  stats,
  color,
  bgColor,
  href,
  isLoading = false,
  description,
}: ModuleCardProps) {
  const router = useRouter();
  const hasAlert = stats.some((s) => s.alert);

  if (isLoading) return <SkeletonCard />;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
      className={clsx(
        'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
        'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/40'
      )}
      aria-label={`Accéder au module ${title}`}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-4 relative"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-text-primary">{title}</p>
          {description && (
            <p className="text-[11px] text-text-secondary truncate">{description}</p>
          )}
        </div>
        {hasAlert && (
          <span className="w-5 h-5 bg-danger rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">!</span>
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.slice(0, 4).map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span
                className={clsx(
                  'text-xl font-bold leading-tight',
                  stat.alert ? 'text-danger' : 'text-primary'
                )}
              >
                {stat.value}
              </span>
              <span className="text-[11px] text-text-secondary mt-0.5 leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
