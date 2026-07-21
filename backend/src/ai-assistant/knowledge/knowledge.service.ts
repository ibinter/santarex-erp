import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OffreSaas } from '../../offres-saas/entities/offre-saas.entity';
import { KnowledgeEntry, STATIC_KNOWLEDGE } from './knowledge-base';

const CYCLE_LABELS: Record<string, string> = {
  mensuel: 'mois',
  trimestriel: 'trimestre',
  annuel: 'an',
  unique: 'paiement unique',
};

/** Mots vides français/anglais ignorés lors du scoring (bruit). */
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'au', 'aux',
  'en', 'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'que', 'qui', 'quoi', 'dont',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'son', 'sa', 'ses', 'est', 'sont',
  'il', 'elle', 'je', 'tu', 'nous', 'vous', 'ils', 'elles', 'ne', 'pas', 'plus',
  'comment', 'quel', 'quelle', 'quels', 'quelles', 'est-ce', 'the', 'a', 'an', 'of',
  'to', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'how', 'what', 'do', 'i', 'can',
]);

interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

/**
 * RAG léger 100 % local (aucune API externe, aucun embedding).
 *
 * Indexe en mémoire la base statique (FAQ + descriptions de modules) et, à
 * chaque requête, y ajoute les offres commerciales lues en direct depuis la
 * table `offres_saas`. La récupération se fait par un scoring TF simple :
 * pour chaque terme significatif de la question, on additionne sa fréquence
 * (normalisée) dans chaque extrait. Les 3–5 meilleurs extraits sont renvoyés
 * puis injectés dans le prompt système comme CONTEXTE citable.
 */
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectRepository(OffreSaas)
    private readonly offresRepo: Repository<OffreSaas>,
  ) {}

  /** Normalise et tokenise un texte (minuscules, sans accents ni ponctuation). */
  private tokenize(text: string): string[] {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // retire les accents (diacritiques combinants)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  }

  /** Construit les extraits « offres » depuis la base (contenu dynamique). */
  private async loadOffreEntries(): Promise<KnowledgeEntry[]> {
    try {
      const offres = await this.offresRepo.find({
        where: { estActif: true, estVisible: true },
        order: { ordre: 'ASC', prix: 'ASC' },
      });
      return offres.map((o) => {
        const cycle = CYCLE_LABELS[o.cycle] ?? o.cycle;
        let fonctionnalites = '';
        try {
          const arr = o.fonctionnalites ? JSON.parse(o.fonctionnalites) : [];
          if (Array.isArray(arr) && arr.length) fonctionnalites = ` Fonctionnalités clés : ${arr.join(', ')}.`;
        } catch {
          /* champ non-JSON : ignoré */
        }
        const contenu =
          `Offre ${o.nom} (code ${o.code}) : ${o.prix.toLocaleString('fr-FR')} FCFA / ${cycle}` +
          (o.remiseAnnuelle > 0 ? `, remise ${o.remiseAnnuelle}% en paiement annuel` : '') +
          `. Jusqu'à ${o.maxUtilisateurs} utilisateurs.` +
          (o.description ? ` ${o.description}.` : '') +
          fonctionnalites;
        return { source: `Offre SaaS · ${o.nom}`, titre: `Plan ${o.nom}`, contenu };
      });
    } catch (err) {
      this.logger.warn(`Impossible de charger les offres_saas pour le RAG: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Récupère les `topK` extraits les plus pertinents pour une question.
   * Retourne un tableau (possiblement vide) trié par score décroissant.
   */
  async retrieve(query: string, topK = 4): Promise<KnowledgeEntry[]> {
    const queryTerms = this.tokenize(query);
    if (!queryTerms.length) return [];

    const offreEntries = await this.loadOffreEntries();
    const corpus = [...STATIC_KNOWLEDGE, ...offreEntries];

    const scored: ScoredEntry[] = corpus.map((entry) => {
      const docTokens = this.tokenize(`${entry.titre} ${entry.contenu}`);
      if (!docTokens.length) return { entry, score: 0 };
      const freq = new Map<string, number>();
      for (const tok of docTokens) freq.set(tok, (freq.get(tok) ?? 0) + 1);

      let score = 0;
      for (const term of queryTerms) {
        const tf = freq.get(term);
        if (tf) score += tf / docTokens.length; // TF normalisé
      }
      return { entry, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.entry);
  }

  /**
   * Construit le bloc CONTEXTE à injecter dans le prompt système, avec
   * consigne de citer les sources. Retourne une chaîne vide si rien de
   * pertinent n'a été trouvé (le chat fonctionne alors sans contexte).
   */
  async buildContext(query: string, topK = 4): Promise<string> {
    const entries = await this.retrieve(query, topK);
    if (!entries.length) return '';

    const blocs = entries
      .map((e, i) => `[${i + 1}] (${e.source}) ${e.titre} — ${e.contenu}`)
      .join('\n');

    return (
      `\n\n--- CONTEXTE SANTAREX (base de connaissances interne) ---\n` +
      `Utilise en priorité les extraits ci-dessous pour répondre. ` +
      `Cite la source pertinente entre parenthèses (ex. « (FAQ · Facturation) ») quand tu t'appuies dessus. ` +
      `Si les extraits ne suffisent pas, réponds prudemment et invite à contacter le support.\n${blocs}\n` +
      `--- FIN DU CONTEXTE ---`
    );
  }
}
