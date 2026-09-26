import type { Character } from './character';
import { ORIGEM_INFO, isCla } from './origin';
import { tipoOrigemDaFaccao } from './faction';

export interface Influencia {
  /** 0 = nenhuma … 6 = continental. */
  nivel: number;
  nome: string;
  alcance: string;
}

/** GDD seção 2 — território de cada tipo de família/clã/seita. */
const INFLUENCIA_ORIGEM: Record<string, Influencia> = {
  orfao: { nivel: 0, nome: 'Nenhuma', alcance: 'Ninguém responde pelo seu nome.' },
  'familia-comum': { nivel: 1, nome: 'Rua', alcance: 'Conhecida na vizinhança e na feira.' },
  'cla-menor': { nivel: 2, nome: 'Distrito', alcance: 'Controla alguns quarteirões ou uma vila.' },
  'seita-menor': { nivel: 3, nome: 'Cidade', alcance: 'Respeitada em toda a cidade e arredores.' },
  'cla-medio': { nivel: 3, nome: 'Cidade', alcance: 'Domina uma cidade inteira.' },
  'cla-grande': { nivel: 4, nome: 'Região', alcance: 'Sua palavra pesa em toda a região.' },
  'seita-suprema': { nivel: 5, nome: 'Região (acima de imperadores)', alcance: 'Protege e tributa uma região inteira.' },
  'super-cla': { nivel: 5, nome: 'Reino', alcance: 'Imperadores tratam seus anciões com cautela.' },
  'cla-ancestral': { nivel: 6, nome: 'Continental', alcance: 'Um nome que atravessa eras.' },
};

const NOME_POR_NIVEL = ['Nenhuma', 'Rua', 'Distrito', 'Cidade', 'Região', 'Reino', 'Continental'];

/** Pontos de fama pessoal necessários para elevar a família um patamar. */
const FAMA_POR_PATAMAR = 80;

/**
 * GDD 13 — Prestígio Familiar: base da categoria + a fama de quem está vivo.
 * Um gênio vindo de uma família fraca eleva o nome da família inteira.
 */
export function influenciaFamilia(character: Character): Influencia {
  const daOrigem = INFLUENCIA_ORIGEM[character.origem.tipo] ?? INFLUENCIA_ORIGEM.orfao;
  const daFaccao = character.faccao ? INFLUENCIA_ORIGEM[tipoOrigemDaFaccao(character.faccao)] : undefined;
  const base =
    daFaccao && daFaccao.nivel >= daOrigem.nivel
      ? { ...daFaccao, alcance: `${character.faccao?.nome}, fundado(a) por você: ${daFaccao.alcance.charAt(0).toLowerCase()}${daFaccao.alcance.slice(1)}` }
      : daOrigem;
  const famaHerdada = Number(character.flags.famaFamiliar ?? 0);
  const bonus = Math.floor((pontosInfluenciaPessoal(character) + famaHerdada) / FAMA_POR_PATAMAR);
  const nivel = Math.min(6, base.nivel + bonus);

  let alcance = base.alcance;
  if (famaHerdada >= FAMA_POR_PATAMAR / 2) {
    alcance += ` O nome da sua linhagem ainda ecoa (${Math.round(famaHerdada)} de fama herdada, murchando com o tempo).`;
  }
  if (bonus > 0 && nivel > base.nivel) {
    alcance = character.origem.tipo === 'orfao'
      ? 'Sem família de sangue — mas seu nome já é uma casa por si só.'
      : `${base.alcance} Elevada pela sua fama: ${bonus} patamar(es) acima da origem.`;
  }
  if (isCla(character.origem.tipo) && character.afiliacao.tipo !== 'cla' && character.afiliacao.nome !== character.origem.nomeCasa) {
    alcance += ' Mas você não está mais sob a proteção dela.';
  }
  return { nivel, nome: NOME_POR_NIVEL[nivel], alcance };
}

/** Pontos de influência pessoal: reputação + peso do reino de cultivo. */
export function pontosInfluenciaPessoal(character: Character): number {
  return Math.max(0, character.reputacao + (character.cultivo.rank - 1) * 25 + ORIGEM_INFO[character.origem.tipo].prestigio * 3);
}

const FAIXAS_PESSOAIS: { minimo: number; influencia: Influencia }[] = [
  { minimo: 250, influencia: { nivel: 6, nome: 'Mito continental', alcance: 'Cultivadores de todas as regiões conhecem seu nome.' } },
  { minimo: 120, influencia: { nivel: 5, nome: 'Lenda do reino', alcance: 'Canções sobre você correm por reinos inteiros.' } },
  { minimo: 60, influencia: { nivel: 4, nome: 'Renomado na região', alcance: 'Clãs da região inteira sabem quem você é.' } },
  { minimo: 30, influencia: { nivel: 3, nome: 'Famoso na cidade', alcance: 'Sussurram seu nome nas casas de chá.' } },
  { minimo: 10, influencia: { nivel: 2, nome: 'Conhecido na vizinhança', alcance: 'Alguns vizinhos já ouviram falar de você.' } },
  { minimo: 0, influencia: { nivel: 1, nome: 'Desconhecido', alcance: 'Só mais um rosto na multidão.' } },
];

export function influenciaPessoal(character: Character): Influencia {
  const pontos = pontosInfluenciaPessoal(character);
  return (FAIXAS_PESSOAIS.find((faixa) => pontos >= faixa.minimo) ?? FAIXAS_PESSOAIS[FAIXAS_PESSOAIS.length - 1]).influencia;
}
