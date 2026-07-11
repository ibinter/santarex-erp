import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-success border-green-200',
  warning: 'bg-amber-100 text-warning border-amber-200',
  danger: 'bg-red-100 text-danger border-red-200',
  info: 'bg-blue-100 text-primary border-blue-200',
  neutral: 'bg-gray-100 text-text-secondary border-gray-200',
};

const dotColorMap: Record<BadgeVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-primary',
  neutral: 'bg-text-secondary',
};

export default function Badge({
  variant = 'neutral',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantMap[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColorMap[variant])}
        />
      )}
      {children}
    </span>
  );
}
