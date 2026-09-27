import type { Character } from './character';
import { ATTRIBUTE_INFO, Attributes, AttributeKey } from './attributes';
import { shiftAlignment } from './alignment';
import { chance, escolher } from './rng';

/**
 * Traços da vida: o que você faz molda quem você é. Contamos os feitos (mortes, boas ações,
 * crueldades, batalhas...) e, ao passar de um limite, o personagem ganha um traço — com vantagens
 * e desvantagens. Outros traços surgem ao acaso com os anos.
 */
export type Feito = 'mortes' | 'bestasAbatidas' | 'bondades' | 'crueldades' | 'vitorias' | 'derrotas' | 'quaseMortes' | 'pilulas';

export const NOME_FEITO: Record<Feito, string> = {
  mortes: 'pessoas mortas',
  bestasAbatidas: 'bestas abatidas',
  bondades: 'boas ações',
  crueldades: 'crueldades',
  vitorias: 'lutas vencidas',
  derrotas: 'derrotas',
  quaseMortes: 'vezes à beira da morte',
  pilulas: 'pílulas refinadas',
};

export interface TracoVida {
  id: string;
  nome: string;
  descricao: string;
  /** Vantagens e desvantagens, em texto, para a ficha. */
  vantagem: string;
  desvantagem: string;
  /** Mudança permanente nos atributos base quando o traço surge. */
  atributos?: Partial<Attributes>;
  /** Multiplica o quanto as pessoas gostam de você nas interações (Relações). */
  relacoes?: number;
  /** Somado ao cultivo passivo. */
  cultivo?: number;
  /** Multiplica a chance de emboscadas na estrada. */
  emboscada?: number;
  /** Multiplica a chance de vingadores de rixas de sangue. */
  vinganca?: number;
  /** Somado à dificuldade de domar bestas. */
  domar?: number;
  /** Alinhamento que muda sozinho a cada estação. */
  derivaAlinhamento?: number;
  reputacaoAoGanhar?: number;
  /** Surge pelos feitos. Sem condição = traço aleatório da vida. */
  condicao?: (f: Record<Feito, number>) => boolean;
}

export const TRACOS_VIDA: TracoVida[] = [
  // --- Pelos feitos ---
  {
    id: 'maos-de-sangue',
    nome: 'Mãos Manchadas de Sangue',
    descricao: 'Você já matou gente demais para contar. O cheiro não sai mais.',
    vantagem: '+1 Força; bandidos pensam duas vezes antes de parar você (emboscadas −40%)',
    desvantagem: 'as pessoas se aproximam com medo (relações −20%)',
    atributos: { forca: 1 },
    emboscada: 0.6,
    relacoes: 0.8,
    condicao: (f) => f.mortes >= 30,
  },
  {
    id: 'psicopata',
    nome: 'Psicopata',
    descricao: 'Cem mortes, e nenhuma pesa na sua consciência. Matar ficou fácil — fácil demais.',
    vantagem: '+1 Força, +1 Espírito: nada abala sua mente em combate',
    desvantagem: 'relações −50%, vingadores surgem 50% mais, e o alinhamento escorre para o demoníaco a cada estação',
    atributos: { forca: 1, espirito: 1 },
    relacoes: 0.5,
    vinganca: 1.5,
    derivaAlinhamento: -1,
    condicao: (f) => f.mortes >= 100 && f.crueldades >= f.bondades,
  },
  {
    id: 'coracao-de-pedra',
    nome: 'Coração de Pedra',
    descricao: 'A crueldade virou hábito. Súplicas não chegam mais até você.',
    vantagem: '+1 Constituição, +1 Espírito',
    desvantagem: 'relações −30%',
    atributos: { constituicao: 1, espirito: 1 },
    relacoes: 0.7,
    condicao: (f) => f.crueldades >= 25 && f.crueldades > f.bondades * 2,
  },
  {
    id: 'coracao-bondoso',
    nome: 'Coração Bondoso',
    descricao: 'Você ajudou tanta gente que o seu nome é dito com carinho nas vilas.',
    vantagem: '+1 Sorte (o karma volta); as pessoas gostam mais de você (relações +30%)',
    desvantagem: 'parece um alvo fácil: emboscadas +20%',
    atributos: { sorte: 1 },
    relacoes: 1.3,
    emboscada: 1.2,
    condicao: (f) => f.bondades >= 25 && f.bondades > f.crueldades * 2,
  },
  {
    id: 'santo-vivo',
    nome: 'Santo Vivo',
    descricao: 'Oitenta boas ações e quase nenhuma mancha. Há quem acenda incenso para você.',
    vantagem: '+2 Espírito, cultivo passivo +10% (o coração em paz cultiva melhor), reputação +20',
    desvantagem: '−1 Força: você hesita antes de ferir alguém',
    atributos: { espirito: 2, forca: -1 },
    cultivo: 0.1,
    reputacaoAoGanhar: 20,
    condicao: (f) => f.bondades >= 80 && f.crueldades <= 10,
  },
  {
    id: 'cacador-de-feras',
    nome: 'Caçador de Feras',
    descricao: 'Sessenta bestas caíram diante de você. Você conhece cada movimento delas.',
    vantagem: '+1 Destreza, +1 Força',
    desvantagem: 'as bestas sentem o sangue delas em você: domar fica mais difícil (+4)',
    atributos: { destreza: 1, forca: 1 },
    domar: 4,
    condicao: (f) => f.bestasAbatidas >= 60,
  },
  {
    id: 'veterano',
    nome: 'Veterano de Mil Batalhas',
    descricao: 'Cento e cinquenta vitórias. O corpo aprendeu sozinho o que nenhum manual ensina.',
    vantagem: '+1 Força, +1 Constituição, +1 Destreza',
    desvantagem: 'tanto tempo lutando cobra do cultivo (−5%)',
    atributos: { forca: 1, constituicao: 1, destreza: 1 },
    cultivo: -0.05,
    condicao: (f) => f.vitorias >= 150,
  },
  {
    id: 'sobrevivente',
    nome: 'Sobrevivente',
    descricao: 'Você já esteve à beira da morte dez vezes — e voltou todas elas.',
    vantagem: '+2 Constituição',
    desvantagem: 'pesadelos atrapalham a meditação (cultivo −5%)',
    atributos: { constituicao: 2 },
    cultivo: -0.05,
    condicao: (f) => f.quaseMortes >= 10,
  },
  {
    id: 'espirito-quebrado',
    nome: 'Espírito Quebrado',
    descricao: 'Derrota atrás de derrota. Algo dentro de você rachou.',
    vantagem: '+1 Inteligência: você aprendeu a pensar antes de lutar',
    desvantagem: '−1 Espírito',
    atributos: { espirito: -1, inteligencia: 1 },
    condicao: (f) => f.derrotas >= 25 && f.derrotas > f.vitorias,
  },
  {
    id: 'nariz-de-alquimista',
    nome: 'Nariz de Alquimista',
    descricao: 'Sessenta pílulas refinadas. Você sabe o grau de uma erva só pelo cheiro.',
    vantagem: '+1 Inteligência',
    desvantagem: 'anos respirando fumaça de fornalha: −1 Constituição',
    atributos: { inteligencia: 1, constituicao: -1 },
    condicao: (f) => f.pilulas >= 60,
  },

  // --- Ao acaso, com os anos ---
  { id: 'insonia', nome: 'Insônia', descricao: 'Você quase não dorme mais.', vantagem: 'mais horas de meditação: cultivo +8%', desvantagem: '−1 Constituição', atributos: { constituicao: -1 }, cultivo: 0.08 },
  { id: 'olhar-de-aguia', nome: 'Olhar de Águia', descricao: 'Sua visão ficou anormalmente aguçada.', vantagem: '+2 Destreza', desvantagem: '−1 Espírito: você confia mais nos olhos que no qi', atributos: { destreza: 2, espirito: -1 } },
  { id: 'tocado-pela-sorte', nome: 'Tocado pela Sorte', descricao: 'Coisas boas começaram a acontecer à sua volta.', vantagem: '+2 Sorte', desvantagem: 'atrai invejosos: emboscadas +10%', atributos: { sorte: 2 }, emboscada: 1.1 },
  { id: 'azarado', nome: 'Azarado', descricao: 'Parece que o céu decidiu testar você.', vantagem: '+1 Espírito: a adversidade forja a vontade', desvantagem: '−2 Sorte', atributos: { sorte: -2, espirito: 1 } },
  { id: 'memoria-fotografica', nome: 'Memória Fotográfica', descricao: 'Você lembra de cada página que já leu.', vantagem: '+2 Inteligência', desvantagem: 'também lembra de tudo o que queria esquecer: −1 Espírito', atributos: { inteligencia: 2, espirito: -1 } },
  { id: 'carismatico', nome: 'Carismático', descricao: 'As pessoas simplesmente gostam de você.', vantagem: 'relações +30%', desvantagem: '−1 Constituição: noites demais em banquetes', atributos: { constituicao: -1 }, relacoes: 1.3 },
  { id: 'temperamento-explosivo', nome: 'Temperamento Explosivo', descricao: 'Qualquer provocação vira briga.', vantagem: '+2 Força', desvantagem: 'relações −20%', atributos: { forca: 2 }, relacoes: 0.8 },
  { id: 'saude-fragil', nome: 'Saúde Frágil', descricao: 'Uma doença na juventude deixou marcas.', vantagem: '+1 Inteligência: horas de cama viraram horas de leitura', desvantagem: '−2 Constituição', atributos: { constituicao: -2, inteligencia: 1 } },
  { id: 'intuicao-espiritual', nome: 'Intuição Espiritual', descricao: 'Você sente o fluxo do qi antes de vê-lo.', vantagem: '+2 Espírito', desvantagem: '−1 Força', atributos: { espirito: 2, forca: -1 } },
];

/** Até quantos traços aleatórios uma vida pode ganhar. */
const MAX_ALEATORIOS = 3;
/** Chance por estação de surgir um traço aleatório (a partir dos 12 anos). */
const CHANCE_ALEATORIO = 0.012;

export function getTracoVida(id: string): TracoVida | undefined {
  return TRACOS_VIDA.find((t) => t.id === id);
}

export function feitosDe(character: Character): Record<Feito, number> {
  const f = character.feitos ?? {};
  return {
    mortes: f.mortes ?? 0,
    bestasAbatidas: f.bestasAbatidas ?? 0,
    bondades: f.bondades ?? 0,
    crueldades: f.crueldades ?? 0,
    vitorias: f.vitorias ?? 0,
    derrotas: f.derrotas ?? 0,
    quaseMortes: f.quaseMortes ?? 0,
    pilulas: f.pilulas ?? 0,
  };
}

export function registrarFeito(character: Character, feito: Feito, quantidade = 1): void {
  character.feitos = character.feitos ?? {};
  character.feitos[feito] = (character.feitos[feito] ?? 0) + quantidade;
}

export function tracosDaVida(character: Character): TracoVida[] {
  return (character.tracosVida ?? []).map(getTracoVida).filter((t): t is TracoVida => Boolean(t));
}

function descreverAtributos(atributos: Partial<Attributes> | undefined): string {
  return Object.entries(atributos ?? {})
    .map(([k, v]) => `${ATTRIBUTE_INFO[k as AttributeKey].nome} ${(v as number) > 0 ? '+' : ''}${v}`)
    .join(', ');
}

function ganhar(character: Character, traco: TracoVida): string {
  character.tracosVida = [...(character.tracosVida ?? []), traco.id];
  for (const [chave, valor] of Object.entries(traco.atributos ?? {}) as [AttributeKey, number][]) {
    character.atributosBase[chave] = Math.max(1, character.atributosBase[chave] + valor);
  }
  if (traco.reputacaoAoGanhar) character.reputacao += traco.reputacaoAoGanhar;
  const atributos = descreverAtributos(traco.atributos);
  return `Novo traço: ${traco.nome} — ${traco.descricao}${atributos ? ` (${atributos})` : ''}`;
}

/**
 * A cada estação: novos traços pelos feitos, talvez um traço ao acaso, e a deriva de alinhamento
 * de traços como o Psicopata.
 */
export function atualizarTracosVida(character: Character, meses: number): string[] {
  const mensagens: string[] = [];
  const tem = new Set(character.tracosVida ?? []);
  const feitos = feitosDe(character);
  for (const traco of TRACOS_VIDA) {
    if (!tem.has(traco.id) && traco.condicao?.(feitos)) mensagens.push(ganhar(character, traco));
  }

  const estacoes = Math.max(1, Math.round(meses / 3));
  const aleatoriosTidos = tracosDaVida(character).filter((t) => !t.condicao).length;
  if (character.idadeMeses >= 12 * 12 && aleatoriosTidos < MAX_ALEATORIOS && chance(1 - Math.pow(1 - CHANCE_ALEATORIO, estacoes))) {
    const possiveis = TRACOS_VIDA.filter((t) => !t.condicao && !(character.tracosVida ?? []).includes(t.id));
    if (possiveis.length) mensagens.push(ganhar(character, escolher(possiveis)));
  }

  const deriva = tracosDaVida(character).reduce((s, t) => s + (t.derivaAlinhamento ?? 0), 0);
  if (deriva) character.alinhamento = shiftAlignment(character.alinhamento, deriva * estacoes);
  return mensagens;
}

function produto(character: Character, campo: 'relacoes' | 'emboscada' | 'vinganca'): number {
  return tracosDaVida(character).reduce((m, t) => m * (t[campo] ?? 1), 1);
}

export const fatorRelacoesTracos = (c: Character): number => produto(c, 'relacoes');
export const fatorEmboscadaTracos = (c: Character): number => produto(c, 'emboscada');
export const fatorVingancaTracos = (c: Character): number => produto(c, 'vinganca');
export const bonusCultivoTracos = (c: Character): number => tracosDaVida(c).reduce((s, t) => s + (t.cultivo ?? 0), 0);
export const dificuldadeDomarTracos = (c: Character): number => tracosDaVida(c).reduce((s, t) => s + (t.domar ?? 0), 0);
