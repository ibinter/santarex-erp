import clsx from 'clsx';

interface PageWrapperProps {
  children: React.ReactNode;
  hasSidebar?: boolean;
  sidebarCollapsed?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageWrapper({
  children,
  hasSidebar = false,
  sidebarCollapsed = false,
  className,
  title,
  subtitle,
  actions,
}: PageWrapperProps) {
  return (
    <main
      className={clsx(
        'min-h-screen pt-16 transition-all duration-200',
        hasSidebar ? (sidebarCollapsed ? 'pl-16' : 'pl-[260px]') : '',
        className
      )}
    >
      <div className="p-6">
        {(title || actions) && (
          <div className="flex items-start justify-between mb-6">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}
