import type { Character, Genero } from './character';
import { getEffectiveAttributes } from './character';
import { ATTRIBUTE_KEYS } from './attributes';
import { REINOS } from './cultivation';
import { Npc, descreverCultivo, estagiosDoRank, poderNpc } from './npcs';
import { ORIGEM_INFO, Origin } from './origin';
import { REGIOES, gerarNomeCla, gerarNomePessoa } from './world';
import { chance, escolher, inteiro } from './rng';

/**
 * Noivado arranjado (costume das grandes seitas e clãs): os anciões prometem a criança a alguém
 * de outra família poderosa. Se você crescer fraco, quem foi prometido pode romper o noivado em
 * público — ou mandar matá-lo para apagar a vergonha. Se crescer forte, o casamento sela uma aliança.
 */
export type StatusNoivado =
  | 'prometidos'
  /** "Hoje você rompe comigo; daqui a três anos, eu rompo com você": duelo marcado. */
  | 'desafio'
  | 'casados'
  | 'rompido-por-ela'
  | 'rompido-por-voce';

export interface Noivado extends Npc {
  genero: Genero;
  status: StatusNoivado;
  /** 0–100: quanto mais orgulho, mais cedo e mais cruel ela (ou ele) rompe. */
  orgulho: number;
  /** A família dela é do caminho demoníaco (mais propensa a mandar um assassino). */
  demoniaca: boolean;
  /** Idade (meses) do personagem em que acontece o duelo marcado. */
  duelo?: number;
  /** Já mandaram um assassino (só uma vez por noivado). */
  assassinoEnviado?: boolean;
}

/** Abaixo disto (seu poder ÷ o dela), a família dela te considera indigno e pode romper o noivado. */
export const LIMIAR_INDIGNO = 0.7;
/** A partir disto, aos 18 anos, o casamento acontece. */
export const LIMIAR_DIGNO = 0.8;

/** Tratamento no texto: "a noiva" / "o noivo". */
export function tratamento(n: Pick<Noivado, 'genero'>): { artigo: string; titulo: string; ela: string; dela: string } {
  return n.genero === 'feminino'
    ? { artigo: 'a', titulo: 'noiva', ela: 'ela', dela: 'dela' }
    : { artigo: 'o', titulo: 'noivo', ela: 'ele', dela: 'dele' };
}

/** Famílias com prestígio arranjam noivados no berço: quanto mais alto o clã, mais provável. */
export function arranjarNoivado(origem: Origin, genero: Genero): Noivado | null {
  const prestigio = ORIGEM_INFO[origem.tipo].prestigio;
  if (prestigio === 0 || !chance(0.3 + prestigio * 0.12)) return null;
  const seitaSuprema = prestigio >= 3 && chance(0.4);
  const regiao = REGIOES[origem.regiao];
  const afiliacao = seitaSuprema ? escolher(regiao.seitasSupremas).nome : gerarNomeCla();
  const demoniaca = seitaSuprema ? !regiao.seitasSupremas.find((s) => s.nome === afiliacao)?.ortodoxa : chance(0.15);
  return {
    id: Math.random().toString(36).slice(2, 10),
    nome: gerarNomePessoa(),
    genero: genero === 'masculino' ? 'feminino' : 'masculino',
    idade: 0,
    rank: 1,
    estagio: 1,
    raizGrau: inteiro(4, 8),
    alquimia: 0,
    afiliacao,
    atributoMedio: 6 + prestigio * 0.3,
    arquetipo: escolher(['guerreiro', 'agil', 'mistico'] as const),
    status: 'prometidos',
    orgulho: inteiro(30, 90),
    demoniaca,
  };
}

/** Quem foi prometido é um talento: cultiva mais rápido que um cultivador comum. */
export function crescerNoivado(n: Noivado, meses: number): void {
  n.idade += meses / 12;
  if (n.idade < 6) return;
  const estacoes = Math.max(1, Math.round(meses / 3));
  for (let i = 0; i < estacoes; i++) {
    if (Math.random() >= (0.11 * (n.raizGrau / 6)) / Math.sqrt(n.rank)) continue;
    n.estagio += 1;
    if (n.estagio > estagiosDoRank(n.rank)) {
      if (n.rank < REINOS.length - 2) {
        n.rank += 1;
        n.estagio = 1;
        n.atributoMedio += 1.3;
      } else n.estagio = estagiosDoRank(n.rank);
    }
  }
}

function mediaAtributos(character: Character): number {
  const a = getEffectiveAttributes(character);
  return ATTRIBUTE_KEYS.reduce((s, k) => s + a[k], 0) / ATTRIBUTE_KEYS.length;
}

export function poderJogador(character: Character): number {
  return poderNpc({ rank: character.cultivo.rank, estagio: character.cultivo.estagio, atributoMedio: mediaAtributos(character) });
}

/** Seu poder ÷ poder de quem foi prometido (ver LIMIAR_INDIGNO e LIMIAR_DIGNO). */
export function forcaRelativa(character: Character): number {
  const n = character.noivado;
  if (!n) return 1;
  return poderJogador(character) / Math.max(1, poderNpc(n));
}

export function descreverNoivado(character: Character): string {
  const n = character.noivado;
  if (!n) return '';
  const t = tratamento(n);
  const razao = forcaRelativa(character);
  const comparacao =
    razao >= 1.3 ? `você já ${t.ela === 'ela' ? 'a' : 'o'} supera` : razao >= 0.8 ? 'vocês estão no mesmo patamar' : razao >= 0.5 ? `${t.ela} está acima de você` : `${t.ela} está muito acima de você`;
  return `${n.nome}, do ${n.afiliacao} · ${Math.floor(n.idade)} anos · ${descreverCultivo(n.rank, n.estagio)} · raiz grau ${n.raizGrau} — ${comparacao}`;
}

export const TEXTO_STATUS: Record<StatusNoivado, string> = {
  prometidos: 'Prometidos desde a infância',
  desafio: 'Duelo marcado',
  casados: 'Casados',
  'rompido-por-ela': 'Noivado rompido — você foi humilhado',
  'rompido-por-voce': 'Noivado rompido por você',
};
