import { RegiaoId, gerarNomeCla, gerarNomePessoa, gerarNomeSeita } from './world';
import { REINOS, poderDoReino } from './cultivation';
import { ArquetipoInimigo, InimigoDef, gerarInimigo } from './combat';
import { chance, escolher, inteiro } from './rng';

/** Cultivador do mundo, persistente no save e envelhecendo junto com o jogador. */
export interface Npc {
  id: string;
  nome: string;
  /** Anos (fracionário). */
  idade: number;
  rank: number;
  estagio: number;
  raizGrau: number;
  /** Nível de alquimia (0 = não é alquimista). */
  alquimia: number;
  afiliacao: string;
  /** Nível médio dos atributos (mesma escala do jogador). */
  atributoMedio: number;
  arquetipo: ArquetipoInimigo;
}

/** Rank mais alto que costuma aparecer em cada região (a Planície Central é a mais forte). */
const RANK_MAX_REGIAO: Record<RegiaoId, number> = { central: 8, norte: 7, sul: 6, leste: 5, oeste: 5 };

function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function estagiosDoRank(rank: number): number {
  return REINOS[rank - 1]?.estagios ?? 9;
}

export interface OpcoesNpc {
  rankMin?: number;
  rankMax?: number;
  afiliacao?: string;
}

export function gerarNpc(regiao: RegiaoId, opcoes: OpcoesNpc = {}): Npc {
  const rankMin = opcoes.rankMin ?? 1;
  const rankMax = opcoes.rankMax ?? RANK_MAX_REGIAO[regiao];
  const rank = Math.min(REINOS.length, rankMin + Math.floor(Math.pow(Math.random(), 1.8) * (rankMax - rankMin + 1)));
  const estagio = inteiro(1, estagiosDoRank(rank));
  const idadeMinima = 12 + (rank - 1) * rank * 5;

  let afiliacao = opcoes.afiliacao;
  if (!afiliacao) {
    const r = Math.random();
    afiliacao = r < 0.5 ? gerarNomeSeita(chance(0.75)) : r < 0.8 ? gerarNomeCla() : 'Cultivador errante';
  }

  return {
    id: novoId(),
    nome: gerarNomePessoa(),
    idade: idadeMinima + Math.random() * 25 * rank,
    rank,
    estagio,
    raizGrau: Math.max(1, Math.min(9, Math.round(2 + rank * 0.6 + Math.random() * 3))),
    alquimia: chance(0.3) ? inteiro(1, Math.min(11, rank + 1)) : 0,
    afiliacao,
    atributoMedio: 7 + rank * 1.2 + Math.random() * 4,
    arquetipo: escolher<ArquetipoInimigo>(['guerreiro', 'agil', 'mistico', 'guerreiro']),
  };
}

export function gerarNpcsRegiao(regiao: RegiaoId, quantidade = 40): Npc[] {
  return Array.from({ length: quantidade }, () => gerarNpc(regiao));
}

export function poderNpc(npc: Pick<Npc, 'rank' | 'estagio' | 'atributoMedio'>): number {
  return poderDoReino({ rank: npc.rank, estagio: npc.estagio, progresso: 0, toxina: 0 }) * npc.atributoMedio;
}

export function descreverCultivo(rank: number, estagio: number): string {
  return `${REINOS[rank - 1]?.nome ?? '?'} — Estágio ${estagio}`;
}

export function inimigoDoNpc(npc: Npc): InimigoDef {
  return gerarInimigo(npc.nome, npc.arquetipo, npc.atributoMedio, npc.rank, npc.estagio);
}

/** Faixa de besta do GDD (seção 10) a partir do rank equivalente. */
export function faixaBesta(rank: number): string {
  if (rank <= 3) return 'Besta Espiritual';
  if (rank <= 6) return 'Besta Demoníaca';
  if (rank <= 9) return 'Besta Divina';
  return 'Besta Ancestral';
}

/** Avança idade e cultivo; raízes melhores sobem mais rápido. */
export function envelhecerNpcs(npcs: Npc[], meses: number): void {
  const estacoes = Math.max(1, Math.round(meses / 3));
  for (const npc of npcs) {
    npc.idade += meses / 12;
    for (let i = 0; i < estacoes; i++) {
      const chanceAvanco = (0.025 * (0.5 + npc.raizGrau / 4)) / Math.sqrt(npc.rank);
      if (Math.random() >= chanceAvanco) continue;
      npc.estagio += 1;
      if (npc.estagio > estagiosDoRank(npc.rank)) {
        if (npc.rank < REINOS.length - 1 && chance(0.5)) {
          npc.rank += 1;
          npc.estagio = 1;
          npc.atributoMedio += 1.2;
        } else {
          npc.estagio = estagiosDoRank(npc.rank);
        }
      }
    }
    if (npc.alquimia > 0 && Math.random() < 0.01 * estacoes && npc.alquimia <= npc.rank) npc.alquimia += 1;
  }
}
