import { readFileSync } from 'fs';
import { join } from 'path';
import { ModePaiement } from '../entities/paiement.entity';

/**
 * Le frontend envoie `modePaiement` tel quel : une valeur qui n'est pas dans
 * l'énumération du serveur est refusée (400) et le paiement échoue. Ce test
 * garde le type du frontend aligné sur l'énumération du serveur.
 */
describe('Modes de paiement : frontend = serveur', () => {
  const source = readFileSync(join(__dirname, '../../../../frontend/src/types/index.ts'), 'utf8');
  const bloc = /export type ModePaiement =([^;]+);/.exec(source);

  it('le type ModePaiement du frontend existe', () => {
    expect(bloc).not.toBeNull();
  });

  it('contient exactement les valeurs de l’énumération du serveur', () => {
    const front = Array.from((bloc as RegExpExecArray)[1].matchAll(/'([a-z_]+)'/g)).map((m) => m[1]).sort();
    expect(front).toEqual(Object.values(ModePaiement).sort());
  });
});
