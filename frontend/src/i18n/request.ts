import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

/**
 * Messages = fichier de base `messages/{locale}.json` (clés marketing legacy)
 * FUSIONNÉ avec tous les namespaces `messages/{locale}/*.json` (un fichier par
 * domaine : common, dashboard, patients, facturation…). Cette séparation permet
 * de convertir les pages module par module sans conflit d'édition sur un gros
 * fichier unique. Le nom de fichier = nom du namespace de premier niveau.
 */
export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : defaultLocale;

  const base = (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>;
  const messages: Record<string, unknown> = { ...base };

  // Fusion des namespaces (messages/{locale}/*.json).
  const nsDir = path.join(process.cwd(), 'messages', locale);
  try {
    if (fs.existsSync(nsDir)) {
      for (const file of fs.readdirSync(nsDir)) {
        if (!file.endsWith('.json')) continue;
        const ns = file.slice(0, -5);
        try {
          const content = JSON.parse(fs.readFileSync(path.join(nsDir, file), 'utf8'));
          // Un fichier peut définir soit {ns: {...}}, soit directement le contenu.
          messages[ns] = (content as Record<string, unknown>)[ns] ?? content;
        } catch {
          /* fichier de namespace illisible → ignoré (conversion progressive). */
        }
      }
    }
  } catch {
    /* dossier de namespaces absent → seules les clés de base sont chargées. */
  }

  return { locale, messages };
});
