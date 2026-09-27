import type { Character } from './character';
import type { MundoState } from './worldState';
import { Elemento, NOME_ELEMENTO } from './spiritualRoot';
import { chance } from './rng';

/**
 * GDD 15.2 — Estações e clima espiritual. O calendário é do mundo (continua com o herdeiro).
 * Cada estação adensa o qi de um elemento do ciclo Wu Xing; a Terra é a transição entre elas.
 * A cada nova estação o céu sorteia um clima espiritual.
 */
export type EstacaoId = 'primavera' | 'verao' | 'outono' | 'inverno';

export interface Estacao {
  id: EstacaoId;
  nome: string;
  elemento: Elemento;
  descricao: string;
}

export const ESTACOES: Estacao[] = [
  { id: 'primavera', nome: 'Primavera', elemento: 'madeira', descricao: 'brotos espirituais rompem a terra e o qi de Madeira transborda' },
  { id: 'verao', nome: 'Verão', elemento: 'fogo', descricao: 'o sol queima forte e o qi de Fogo arde no ar' },
  { id: 'outono', nome: 'Outono', elemento: 'metal', descricao: 'o vento corta como lâmina e o qi de Metal se afia' },
  { id: 'inverno', nome: 'Inverno', elemento: 'agua', descricao: 'lagos congelam e o qi de Água se torna denso e frio' },
];

export type ClimaId = 'normal' | 'mare' | 'seca';

export interface Clima {
  id: ClimaId;
  nome: string;
  /** Soma ao fator de cultivo passivo. */
  cultivo: number;
  descricao: string;
}

export const CLIMAS: Record<ClimaId, Clima> = {
  normal: { id: 'normal', nome: 'Céu calmo', cultivo: 0, descricao: 'o qi do mundo segue o ritmo de sempre' },
  mare: { id: 'mare', nome: 'Maré de Qi', cultivo: 0.2, descricao: 'o qi do céu e da terra transborda; cultivar rende muito mais' },
  seca: { id: 'seca', nome: 'Seca Espiritual', cultivo: -0.15, descricao: 'o qi rareia; até os anciões meditam com dificuldade' },
};

/** Bônus de cultivo passivo quando o elemento da estação está na sua raiz. */
export const BONUS_ELEMENTO_ESTACAO = 0.15;
/** A Terra, elemento de transição, rende um pouco em todas as estações. */
export const BONUS_TERRA = 0.05;

export function mesDoAno(mundo?: MundoState): number {
  return mundo?.mesDoAno ?? 0;
}

export function estacaoAtual(mundo?: MundoState): Estacao {
  return ESTACOES[Math.floor(mesDoAno(mundo) / 3) % 4];
}

export function climaAtual(mundo?: MundoState): Clima {
  return CLIMAS[mundo?.clima ?? 'normal'];
}

/** O mês do meio da estação: o "pico" (selos que enfraquecem, flores que abrem). */
export function picoDaEstacao(mundo?: MundoState): boolean {
  return mesDoAno(mundo) % 3 === 1;
}

export function bonusCultivoEstacao(character: Character, mundo?: MundoState): number {
  const elementos = character.raizEspiritual.elementos;
  const estacao = estacaoAtual(mundo);
  const elemental = elementos.includes(estacao.elemento) ? BONUS_ELEMENTO_ESTACAO : elementos.includes('terra') ? BONUS_TERRA : 0;
  return elemental + climaAtual(mundo).cultivo;
}

export function descreverEstacao(character: Character, mundo?: MundoState): string {
  const estacao = estacaoAtual(mundo);
  const clima = climaAtual(mundo);
  const favorece = character.raizEspiritual.elementos.includes(estacao.elemento);
  return `${estacao.nome} · qi de ${NOME_ELEMENTO[estacao.elemento]}${favorece ? ' (favorece sua raiz)' : ''}${clima.id === 'normal' ? '' : ` · ${clima.nome}`}`;
}

/** Avança o calendário do mundo; ao virar a estação, sorteia o clima. Avisa só climas incomuns. */
export function avancarCalendario(mundo: MundoState, meses: number): string[] {
  const antes = Math.floor(mesDoAno(mundo) / 3);
  const total = mesDoAno(mundo) + meses;
  mundo.mesDoAno = total % 12;
  if (Math.floor(total / 3) === antes) return [];
  mundo.clima = chance(0.2) ? 'mare' : chance(0.25) ? 'seca' : 'normal';
  const estacao = estacaoAtual(mundo);
  const clima = climaAtual(mundo);
  return clima.id === 'normal' ? [] : [`${estacao.nome}: ${clima.nome} — ${clima.descricao}.`];
}
