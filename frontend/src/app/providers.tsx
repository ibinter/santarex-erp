'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';

export default function Providers({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Africa/Abidjan"
      // Conversion progressive : ne jamais crasher si une clé manque —
      // on affiche un repli lisible (dernier segment de la clé).
      onError={() => {}}
      getMessageFallback={({ key }) => key.split('.').pop() ?? key}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}
