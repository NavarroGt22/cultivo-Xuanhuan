import type { Character } from './character';
import type { Efeitos } from './effects';
import { REINOS } from './cultivation';
import { TECNICAS, grauMaximoPorAcesso, idManual, nomeGrau } from './techniques';
import { ORIGEM_INFO } from './origin';
import { bonusCultivoMoradia } from './market';
import { bonusCultivoTracos } from './lifeTraits';
import { metodoDeCultivo } from './cultivationMethod';

/**
 * Discípulos de seita não precisam de emprego: recebem estipêndio e ganham
 * Pontos de Contribuição cumprindo os deveres da seita.
 */
export interface PostoSeita {
  nome: string;
  multiplicadorEstipendio: number;
  /** Bônus de cultivo passivo por viver na seita (densidade espiritual e recursos). */
  bonusCultivo: number;
  requisitos: { contribuicao: number; rank: number; reputacao: number };
}

export const POSTOS_SEITA: PostoSeita[] = [
  { nome: 'Discípulo Externo', multiplicadorEstipendio: 1, bonusCultivo: 0.1, requisitos: { contribuicao: 0, rank: 1, reputacao: 0 } },
  { nome: 'Discípulo Interno', multiplicadorEstipendio: 2, bonusCultivo: 0.2, requisitos: { contribuicao: 100, rank: 1, reputacao: 15 } },
  { nome: 'Discípulo Núcleo', multiplicadorEstipendio: 4, bonusCultivo: 0.3, requisitos: { contribuicao: 400, rank: 2, reputacao: 40 } },
  { nome: 'Ancião Aprendiz', multiplicadorEstipendio: 7, bonusCultivo: 0.4, requisitos: { contribuicao: 1200, rank: 3, reputacao: 80 } },
];

const ESTIPENDIO_BASE = { seita: 2, 'seita-suprema': 5 } as const;

/** Contribuição por estação cumprindo deveres (sem emprego fora da seita). */
export const CONTRIBUICAO_POR_ESTACAO = 5;

/** O fundador da própria seita não é discípulo de ninguém. */
export function ehDiscipulo(character: Character): boolean {
  if (character.faccao && character.afiliacao.nome === character.faccao.nome) return false;
  return character.afiliacao.tipo === 'seita' || character.afiliacao.tipo === 'seita-suprema';
}

export function indicePosto(character: Character): number {
  return Math.max(0, POSTOS_SEITA.findIndex((posto) => posto.nome === character.afiliacao.posto));
}

export function postoAtual(character: Character): PostoSeita {
  return POSTOS_SEITA[indicePosto(character)];
}

export function proximoPosto(character: Character): PostoSeita | null {
  return POSTOS_SEITA[indicePosto(character) + 1] ?? null;
}

export function estipendioDoPosto(tipo: 'seita' | 'seita-suprema', posto: PostoSeita): number {
  return ESTIPENDIO_BASE[tipo] * posto.multiplicadorEstipendio;
}

export function motivoPromocao(character: Character): string | null {
  if (!ehDiscipulo(character)) return 'Você não é discípulo de uma seita';
  const proximo = proximoPosto(character);
  if (!proximo) return 'Você já está no posto mais alto que um discípulo pode alcançar';
  const { contribuicao, rank, reputacao } = proximo.requisitos;
  if (character.contribuicao < contribuicao) return `Requer ${contribuicao} de contribuição (você tem ${character.contribuicao})`;
  if (character.cultivo.rank < rank) return `Requer ${REINOS[rank - 1].nome}`;
  if (character.reputacao < reputacao) return `Requer reputação ${reputacao}`;
  return null;
}

/** A promoção não gasta contribuição: os pontos acumulados provam seu valor. */
export function promoverNaSeita(character: Character): string[] {
  const proximo = proximoPosto(character);
  if (!proximo || motivoPromocao(character) || !ehDiscipulo(character)) return [];
  const tipo = character.afiliacao.tipo as 'seita' | 'seita-suprema';
  character.afiliacao = { ...character.afiliacao, posto: proximo.nome, estipendio: estipendioDoPosto(tipo, proximo) };
  character.reputacao += 5;
  return [`Promoção na ${character.afiliacao.nome}: você agora é ${proximo.nome}!`, `Novo estipêndio: ${character.afiliacao.estipendio} pedras por estação.`];
}

/** Deveres automáticos de cada estação. Quem tem emprego fora da seita não cumpre deveres. */
export function processarDeveres(character: Character, estacoes: number): string[] {
  if (!ehDiscipulo(character) || character.idadeMeses < 12 * 12) return [];

  if (character.ocupacao?.categoria === 'submundo' && character.afiliacao.ortodoxa) {
    if (Math.random() < 1 - Math.pow(0.85, estacoes)) {
      const seita = character.afiliacao.nome;
      character.afiliacao = { tipo: 'nenhuma', nome: 'Sem vínculo', ortodoxa: true, posto: 'Expulso', estipendio: 0 };
      character.contribuicao = 0;
      character.reputacao -= 15;
      return [`A ${seita} descobriu seus negócios no submundo. Você foi expulso da seita!`];
    }
  }
  if (character.ocupacao) return [];

  const ganho = CONTRIBUICAO_POR_ESTACAO * estacoes;
  character.contribuicao += ganho;
  const mensagens = [`Deveres de discípulo cumpridos: +${ganho} de contribuição (total ${character.contribuicao}).`];
  const proximo = proximoPosto(character);
  if (proximo && !motivoPromocao(character)) {
    mensagens.push(`Você já pode pedir promoção a ${proximo.nome} no painel da seita.`);
  }
  return mensagens;
}

/** Multiplicador do cultivo passivo: emprego rouba tempo; a seita oferece ambiente. */
export function fatorCultivoPassivo(character: Character): number {
  if (!metodoDeCultivo(character)) return 0;
  const salaDaFaccao = (character.faccao?.instalacoes.salaCultivo ?? 0) * 0.08;
  const extra = bonusCultivoMoradia(character) + bonusCultivoTracos(character);
  let base: number;
  if (character.ocupacao) base = 0.15 + salaDaFaccao;
  else if (character.faccao) base = 0.3 + salaDaFaccao;
  else if (ehDiscipulo(character)) base = 0.3 + postoAtual(character).bonusCultivo + (character.afiliacao.tipo === 'seita-suprema' ? 0.1 : 0);
  else base = 0.3;
  return Math.max(0.05, base + extra);
}

export interface OfertaSeita {
  nome: string;
  custo: number;
  efeitos: Efeitos;
  bloqueio: string | null;
}

/** Pavilhão de Contribuição: troca pontos por recursos. */
export function listarOfertasSeita(character: Character): OfertaSeita[] {
  const indice = indicePosto(character);
  const ofertas: Omit<OfertaSeita, 'bloqueio'>[] = [
    { nome: 'Pílula de Reunião de Chakra', custo: 15, efeitos: { itens: [{ id: 'pilula-chakra', quantidade: 1 }] } },
    { nome: 'Pílula de Purificação', custo: 20, efeitos: { itens: [{ id: 'pilula-purificacao', quantidade: 1 }] } },
    { nome: 'Pílula de Cura Menor ×2', custo: 12, efeitos: { itens: [{ id: 'pilula-cura', quantidade: 2 }] } },
    { nome: '20 pedras espirituais', custo: 25, efeitos: { pedras: 20 } },
  ];
  if (indice >= 1) {
    ofertas.push({ nome: 'Pílula Dourada Universal', custo: 90, efeitos: { itens: [{ id: 'pilula-dourada', quantidade: 1 }] } });
  }

  const grauMax = grauMaximoPorAcesso(character.afiliacao.tipo, character.afiliacao.posto, ORIGEM_INFO[character.origem.tipo].prestigio);
  for (const tecnica of TECNICAS) {
    if (tecnica.grau > grauMax || tecnica.categoria === 'proibida' || tecnica.heranca || character.tecnicas.includes(tecnica.id)) continue;
    ofertas.push({
      nome: `Manual: ${tecnica.nome} (${nomeGrau(tecnica)})`,
      custo: 50 * tecnica.grau,
      efeitos: { itens: [{ id: idManual(tecnica.id), quantidade: 1 }] },
    });
  }

  return ofertas.map((oferta) => ({
    ...oferta,
    bloqueio: character.contribuicao < oferta.custo ? `Requer ${oferta.custo} de contribuição` : null,
  }));
}
