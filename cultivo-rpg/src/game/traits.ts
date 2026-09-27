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
    descricao: 'Alguém escondeu uma bolsa de pedras espirituais no seu berço. Ninguém sabe quem. Um dia o selo no seu sangue pode se romper e revelar de quem você descende — e a raiz renasce (no mínimo grau 3).',
    bonusAtributos: { sorte: -1 },
    pedrasEspirituaisBonus: 40,
  },
  {
    id: 'olhos-de-falcao',
    nome: 'Olhos de Falcão',
    descricao: 'Enxerga uma folha caindo a cem passos. O corpo, porém, nunca foi dos mais fortes.',
    bonusAtributos: { destreza: 2, constituicao: -1 },
  },
  {
    id: 'alma-antiga',
    nome: 'Alma Antiga',
    descricao: 'Criança de olhar velho. O qi responde a você com respeito, mas a sorte parece desconfiar. Um dia — talvez à beira da morte — quem você foi em outra era pode despertar, e a raiz renasce (no mínimo grau 3).',
    bonusAtributos: { espirito: 2, sorte: -1 },
  },
  {
    id: 'brutamontes',
    nome: 'Brutamontes',
    descricao: 'Aos dez anos já carregava sacos de arroz de dois em dois. Ler é outra história.',
    bonusAtributos: { forca: 3, inteligencia: -2 },
  },
  {
    id: 'genio-fragil',
    nome: 'Gênio de Corpo Frágil',
    descricao: 'Aprendeu a ler sozinho aos três anos — e passa metade do inverno de cama.',
    bonusAtributos: { inteligencia: 3, constituicao: -2 },
  },
  {
    id: 'sangue-de-mercador',
    nome: 'Sangue de Mercador',
    descricao: 'Filho de negociantes: sabe o preço de tudo e nasceu com a bolsa cheia, mas o qi é preguiçoso.',
    bonusAtributos: { sorte: 1, espirito: -1 },
    pedrasEspirituaisBonus: 25,
  },
  {
    id: 'compassivo',
    nome: 'Compassivo',
    descricao: 'Chora pelos animais feridos e divide a comida com mendigos. Começa muito inclinado à Ordem.',
    bonusAtributos: { espirito: 1, sorte: 1, forca: -1 },
    alinhamentoInicial: 40,
  },
  {
    id: 'vingativo',
    nome: 'Vingativo',
    descricao: 'Nunca esquece uma ofensa. A raiva fortalece o corpo e escurece o coração.',
    bonusAtributos: { forca: 1, destreza: 1, sorte: -1 },
    alinhamentoInicial: -35,
  },
  {
    id: 'nascido-na-tempestade',
    nome: 'Nascido na Tempestade',
    descricao: 'Um raio caiu sobre a casa na noite em que você nasceu. Desde então, algo em você nunca fica parado.',
    bonusAtributos: { forca: 1, espirito: 1, destreza: 1, constituicao: -1, sorte: -1 },
  },
];

export function getTrait(id: string): Trait {
  return TRAITS.find((traco) => traco.id === id) ?? TRAITS[0];
}
