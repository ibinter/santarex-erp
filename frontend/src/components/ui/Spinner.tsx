import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white';
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

const colorMap = {
  primary: 'border-primary/20 border-t-primary',
  white: 'border-white/30 border-t-white',
};

export default function Spinner({
  size = 'md',
  className,
  color = 'primary',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Chargement..."
      className={clsx(
        'inline-block rounded-full animate-spin',
        sizeMap[size],
        colorMap[color],
        className
      )}
    />
  );
}
