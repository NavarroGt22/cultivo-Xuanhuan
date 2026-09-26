import { Attributes } from './attributes';

export interface Trait {
  id: string;
  nome: string;
  descricao: string;
  bonusAtributos: Partial<Attributes>;
  /** Valor inicial no eixo de alinhamento (-100 a 100). */
  alinhamentoInicial?: number;
  /** Somado (ou subtraído) às pedras espirituais iniciais. */
  pedrasEspirituaisBonus?: number;
}

export const TRAITS: Trait[] = [
  {
    id: 'normal',
    nome: 'Normal',
    descricao: 'Sem nenhum efeito. Um começo sem vantagens nem fardos.',
    bonusAtributos: {},
  },
  {
    id: 'corpo-de-ferro',
    nome: 'Corpo de Ferro',
    descricao: 'Cresceu carregando pedra nas minas. Resistente, mas pesado.',
    bonusAtributos: { constituicao: 2, destreza: -1 },
  },
  {
    id: 'mente-agucada',
    nome: 'Mente Aguçada',
    descricao: 'Lê manuais com facilidade anormal, mas nunca treinou o corpo.',
    bonusAtributos: { inteligencia: 2, forca: -1 },
  },
  {
    id: 'sangue-ardente',
    nome: 'Sangue Ardente',
    descricao: 'Impulsivo e forte. Age antes de pensar.',
    bonusAtributos: { forca: 2, inteligencia: -1 },
  },
  {
    id: 'estrela-afortunada',
    nome: 'Nascido Sob Estrela Afortunada',
    descricao: 'Coisas boas parecem cair no seu colo, mas sua ligação com o qi é fraca.',
    bonusAtributos: { sorte: 2, espirito: -1 },
  },
  {
    id: 'coracao-justo',
    nome: 'Coração Justo',
    descricao: 'Nasceu com um senso inabalável de justiça. Começa inclinado à Ordem.',
    bonusAtributos: { espirito: 1 },
    alinhamentoInicial: 25,
  },
  {
    id: 'coracao-frio',
    nome: 'Coração Frio',
    descricao: 'Escrúpulos parecem um luxo para você. Começa inclinado ao caminho não-ortodoxo.',
    bonusAtributos: { destreza: 1 },
    alinhamentoInicial: -25,
  },
  {
    id: 'maos-leves',
    nome: 'Mãos Leves',
    descricao: 'Ágil e sortudo, com o hábito de pegar o que não é seu. O corpo é frágil.',
    bonusAtributos: { destreza: 1, sorte: 1, constituicao: -1 },
    alinhamentoInicial: -10,
  },
  {
    id: 'heranca-escondida',
    nome: 'Herança Escondida',
    descricao: 'Alguém escondeu uma bolsa de pedras espirituais no seu berço. Ninguém sabe quem.',
    bonusAtributos: { sorte: -1 },
    pedrasEspirituaisBonus: 40,
  },
];

export function getTrait(id: string): Trait {
  return TRAITS.find((traco) => traco.id === id) ?? TRAITS[0];
}
