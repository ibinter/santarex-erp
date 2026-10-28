import axios from 'axios';
import { TauxChangeService, XOF_PAR_EUR } from '../taux-change.service';

jest.mock('axios');
const get = axios.get as jest.Mock;

function creer(env: Record<string, unknown> = {}) {
  return new TauxChangeService({ get: (k: string) => env[k] } as any);
}

describe('TauxChangeService', () => {
  beforeEach(() => get.mockReset());

  it('l’euro suit toujours la parité fixe 655,957', async () => {
    get.mockResolvedValue({ data: { rates: { XOF: 570 } } });
    const t = await creer().taux();
    expect(t.xofParEur).toBe(XOF_PAR_EUR);
  });

  it('le dollar vient de l’API quand elle répond', async () => {
    get.mockResolvedValue({ data: { rates: { XOF: 571.42 } } });
    const t = await creer().taux();
    expect(t.xofParUsd).toBe(571.42);
    expect(t.source).toBe('open.er-api.com');
  });

  it('en cas d’échec de l’API, la valeur de secours est utilisée', async () => {
    get.mockRejectedValue(new Error('réseau'));
    const t = await creer({ TAUX_USD_XOF: '600' }).taux();
    expect(t.xofParUsd).toBe(600);
    expect(t.source).toBe('valeur de secours');
  });

  it('un taux absurde renvoyé par l’API est ignoré', async () => {
    get.mockResolvedValue({ data: { rates: { XOF: 3 } } });
    const t = await creer().taux();
    expect(t.xofParUsd).toBe(590); // secours par défaut
  });

  it('le taux est gardé en mémoire : un seul appel à l’API', async () => {
    get.mockResolvedValue({ data: { rates: { XOF: 580 } } });
    const s = creer();
    await s.taux();
    await s.taux();
    expect(get).toHaveBeenCalledTimes(1);
  });
});
