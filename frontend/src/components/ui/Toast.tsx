'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'warning' | 'danger' | 'info';

interface ToastProps {
  type?: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const config: Record<ToastType, { icon: React.ReactNode; classes: string }> = {
  success: {
    icon: <CheckCircle size={18} />,
    classes: 'bg-green-50 text-success border-green-200',
  },
  warning: {
    icon: <AlertCircle size={18} />,
    classes: 'bg-amber-50 text-warning border-amber-200',
  },
  danger: {
    icon: <XCircle size={18} />,
    classes: 'bg-red-50 text-danger border-red-200',
  },
  info: {
    icon: <Info size={18} />,
    classes: 'bg-blue-50 text-primary border-blue-200',
  },
};

export default function Toast({
  type = 'info',
  message,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const { icon, classes } = config[type];

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-card border shadow-card max-w-sm animate-fade-in',
        classes
      )}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
