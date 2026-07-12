'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

const FLAGS: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧' };
const LABELS: Record<string, string> = { fr: 'FR', en: 'EN' };

interface Props {
  currentLocale: string;
  className?: string;
}

export default function LanguageSwitcher({ currentLocale, className = '' }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    const next = currentLocale === 'fr' ? 'en' : 'fr';
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium border border-white/30 hover:border-white/60 transition-colors ${className}`}
      title={currentLocale === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <span>{FLAGS[currentLocale]}</span>
      <span>{LABELS[currentLocale]}</span>
    </button>
  );
}
