import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { FORMULES } from '../formules';

/**
 * La page de vente (frontend/src/lib/formules.ts) doit annoncer EXACTEMENT ce que
 * le serveur livre (src/licences/formules.ts). Ce test échoue dès qu'elles divergent.
 */
function chargerFormulesFront(): Record<string, string[]> {
  const fichier = path.resolve(__dirname, '../../../../frontend/src/lib/formules.ts');
  const src = fs.readFileSync(fichier, 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod: { exports: any } = { exports: {} };
  new Function('exports', 'module', js)(mod.exports, mod);
  return mod.exports.FORMULES_MODULES;
}

describe('Page de vente = formules du serveur', () => {
  const front = chargerFormulesFront();

  it('les cinq formules ont exactement les mêmes modules, dans le même ordre', () => {
    for (const code of Object.keys(FORMULES)) {
      expect(front[code]).toEqual(FORMULES[code]);
    }
  });

  it('aucune formule en plus ou en moins', () => {
    expect(Object.keys(front).sort()).toEqual(Object.keys(FORMULES).sort());
  });
});
