import type { Character } from './character';
import { feitosDe } from './lifeTraits';

/**
 * GDD 15.4 — Causalidade Celestial. O Céu registra o peso dos atos, separado do alinhamento:
 * um Ortodoxo que comete atrocidades acumula karma do mesmo jeito. Vem dos feitos da vida
 * (lifeTraits.ts); positivo = pesado. Karma pesado torna a Tribulação Celestial mais violenta.
 */
export interface NivelKarma {
  nome: string;
  /** Soma à dificuldade da Tribulação Celestial. */
  tribulacao: number;
  descricao: string;
}

const NIVEIS: { ate: number; nivel: NivelKarma }[] = [
  { ate: -60, nivel: { nome: 'Abençoado pelo Céu', tribulacao: -3, descricao: 'tantas vidas salvas que até os raios hesitam' } },
  { ate: -15, nivel: { nome: 'Leve', tribulacao: -1, descricao: 'o Céu vê mais bem do que mal nos seus atos' } },
  { ate: 40, nivel: { nome: 'Equilibrado', tribulacao: 0, descricao: 'nem santo, nem monstro' } },
  { ate: 100, nivel: { nome: 'Pesado', tribulacao: 3, descricao: 'o sangue que você derramou não foi esquecido' } },
  { ate: 200, nivel: { nome: 'Muito pesado', tribulacao: 6, descricao: 'as nuvens de tribulação escurecem só de sentir você' } },
  { ate: Infinity, nivel: { nome: 'Amaldiçoado pelo Céu', tribulacao: 10, descricao: 'o Céu quer você morto' } },
];

export function karmaDe(character: Character): number {
  const f = feitosDe(character);
  return Math.round(f.crueldades * 3 + f.mortes * 0.5 - f.bondades * 1.5);
}

export function nivelKarma(character: Character): NivelKarma {
  const karma = karmaDe(character);
  return NIVEIS.find((n) => karma <= n.ate)!.nivel;
}

export function modificadorTribulacaoKarma(character: Character): number {
  return nivelKarma(character).tribulacao;
}
