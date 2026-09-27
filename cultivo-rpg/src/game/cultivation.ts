export interface Realm {
  rank: number;
  nome: string;
  titulo: string;
  estagios: number;
  recurso: 'Chakra' | 'Star' | '—';
  expectativaAnos: number;
}

/** GDD seção 1 — Sistema de Reinos de Cultivo. */
export const REINOS: Realm[] = [
  { rank: 1, nome: 'Martial Apprentice', titulo: 'Aprendiz Marcial', estagios: 7, recurso: 'Chakra', expectativaAnos: 100 },
  { rank: 2, nome: 'First Origin Realm', titulo: 'Martial Warrior', estagios: 9, recurso: 'Star', expectativaAnos: 150 },
  { rank: 3, nome: 'Two Force Realm', titulo: 'Martial Master', estagios: 9, recurso: 'Star', expectativaAnos: 250 },
  { rank: 4, nome: 'Three Power Realm', titulo: 'Great Martial Master', estagios: 9, recurso: 'Star', expectativaAnos: 500 },
  { rank: 5, nome: 'Four Guardians Realm', titulo: 'Martial Lord', estagios: 9, recurso: 'Star', expectativaAnos: 1000 },
  { rank: 6, nome: 'Five Elements Realm', titulo: 'Martial King', estagios: 9, recurso: 'Star', expectativaAnos: 5000 },
  { rank: 7, nome: 'Six Zodiac Realm', titulo: 'Martial Grand Master', estagios: 9, recurso: 'Star', expectativaAnos: 30000 },
  { rank: 8, nome: 'Seven Constellations Realm', titulo: 'Martial Emperor', estagios: 9, recurso: 'Star', expectativaAnos: 100000 },
  { rank: 9, nome: 'Eight Desolation Realm', titulo: 'Martial Supreme', estagios: 9, recurso: 'Star', expectativaAnos: 300000 },
  { rank: 10, nome: 'Nine Heaven Realm', titulo: 'Martial Sovereign', estagios: 9, recurso: 'Star', expectativaAnos: 1000000 },
  { rank: 11, nome: 'Ten Direction Divine Realm', titulo: '—', estagios: 9, recurso: 'Star', expectativaAnos: 30000000 },
  { rank: 12, nome: 'Lord of a Thousand Worlds Realm', titulo: '—', estagios: 1, recurso: '—', expectativaAnos: Infinity },
  { rank: 13, nome: 'Eternal Supreme', titulo: '—', estagios: 1, recurso: '—', expectativaAnos: Infinity },
];

export interface CultivationState {
  rank: number;
  estagio: number;
  /** 0–100 até o próximo estágio. */
  progresso: number;
  /** Toxina de pílula acumulada, 0–100 (GDD seção 4). */
  toxina: number;
}

export function createCultivation(): CultivationState {
  return { rank: 1, estagio: 1, progresso: 0, toxina: 0 };
}

export function getRealm(state: CultivationState): Realm {
  return REINOS.find((reino) => reino.rank === state.rank) ?? REINOS[0];
}

export function realmLabel(state: CultivationState): string {
  const reino = getRealm(state);
  return `${reino.nome} — Estágio ${state.estagio}`;
}

/** Multiplicador de poder de combate: cada rank dobra a base, cada estágio soma 12%. */
export function poderDoReino(state: CultivationState): number {
  return 1 + (state.rank - 1) + (state.estagio - 1) * 0.12;
}

export function ganhoCultivo(velocidade: number, meses: number, multiplicador = 1): number {
  return Math.round(velocidade * meses * 5 * multiplicador * 10) / 10;
}

export function precisaTribulacao(state: CultivationState): boolean {
  const reino = getRealm(state);
  return state.rank < REINOS.length && state.estagio >= reino.estagios && state.progresso >= 100;
}

/** Ganhos positivos são divididos por 1,7 a cada rank: reinos altos levam séculos, como no GDD. */
export const DIVISOR_POR_RANK = 1.7;

export function progressoEfetivo(state: CultivationState, pontos: number): number {
  if (pontos <= 0) return pontos;
  return Math.round((pontos / Math.pow(DIVISOR_POR_RANK, state.rank - 1)) * 10) / 10;
}

/** Soma progresso e sobe de estágio; no último estágio do rank, trava em 100% até a Tribulação. */
export function aplicarProgresso(state: CultivationState, pontos: number): string[] {
  const mensagens: string[] = [];
  const reino = getRealm(state);
  const jaNoApice = precisaTribulacao(state);

  state.progresso = Math.max(0, state.progresso + progressoEfetivo(state, pontos));

  while (state.progresso >= 100) {
    if (state.estagio >= reino.estagios) {
      state.progresso = 100;
      if (!jaNoApice) {
        mensagens.push(`Você atingiu o ápice do ${reino.nome}. Só uma Tribulação Celestial separa você do próximo reino.`);
      }
      break;
    }
    state.progresso -= 100;
    state.estagio += 1;
    mensagens.push(`Avanço! ${reino.nome} — Estágio ${state.estagio}.`);
  }

  return mensagens;
}

export function avancarRank(state: CultivationState): Realm {
  if (state.rank < REINOS.length) {
    state.rank += 1;
    state.estagio = 1;
    state.progresso = 0;
  }
  return getRealm(state);
}

export function dificuldadeTribulacao(state: CultivationState): number {
  return Math.round(13 + state.rank * 1.5);
}
