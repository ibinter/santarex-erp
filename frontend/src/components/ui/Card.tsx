import clsx from 'clsx';

type CardVariant = 'flat' | 'elevated' | 'interactive';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantMap: Record<CardVariant, string> = {
  flat: 'bg-white rounded-card border border-border',
  elevated: 'bg-white rounded-card shadow-card',
  interactive:
    'bg-white rounded-card shadow-card cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  variant = 'elevated',
  children,
  className,
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(variantMap[variant], paddingMap[padding], className)}
    >
      {children}
    </div>
  );
}
