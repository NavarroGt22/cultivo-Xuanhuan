import type { Character } from './character';
import { Attributes } from './attributes';
import { DerivedStats } from './stats';
import { addPedrasEspirituais, quantidadeItem, removerItem } from './inventory';
import { chance, escolher } from './rng';

/**
 * GDD 14.2 — Cicatrizes e Sequelas Permanentes.
 * Lutas quase fatais podem deixar marcas: um pequeno malefício + uma característica única.
 */
export interface Cicatriz {
  id: string;
  nome: string;
  descricao: string;
  malus: Partial<Attributes>;
  bonusCritico?: number;
  multiplicadorDefesa?: number;
  multiplicadorTecnica?: number;
  multiplicadorChakra?: number;
}

export const CICATRIZES: Cicatriz[] = [
  {
    id: 'rosto-marcado',
    nome: 'Cicatriz no Rosto',
    descricao: 'Um corte atravessa seu rosto. Estranhos evitam seu olhar — e adversários hesitam. (−1 SOR, +3% Crítico)',
    malus: { sorte: -1 },
    bonusCritico: 3,
  },
  {
    id: 'braco-remendado',
    nome: 'Braço Remendado',
    descricao: 'Os ossos do braço foram colados com qi. Mais fraco, porém mais duro. (−1 FOR, Defesa ×1,1)',
    malus: { forca: -1 },
    multiplicadorDefesa: 1.1,
  },
  {
    id: 'olho-cego',
    nome: 'Olho Cego',
    descricao: 'Um dos olhos não vê mais nada — mas você passou a sentir o qi ao redor. (−1 DES, Técnica ×1,08)',
    malus: { destreza: -1 },
    multiplicadorTecnica: 1.08,
  },
  {
    id: 'queimadura-espiritual',
    nome: 'Queimadura Espiritual',
    descricao: 'A pele marcada por fogo espiritual nunca esfria por completo. (−1 CON, Chakra ×1,1)',
    malus: { constituicao: -1 },
    multiplicadorChakra: 1.1,
  },
];

export const MAX_CICATRIZES = 3;
/** Uma luta termina "quase fatal" abaixo desta fração da vida máxima. */
const LIMITE_QUASE_FATAL = 0.12;

export function getCicatriz(id: string): Cicatriz | undefined {
  return CICATRIZES.find((c) => c.id === id);
}

export function aplicarModificadoresCicatrizes(stats: DerivedStats, character: Character): DerivedStats {
  const resultado = { ...stats };
  for (const id of character.cicatrizes) {
    const cicatriz = getCicatriz(id);
    if (!cicatriz) continue;
    if (cicatriz.bonusCritico) resultado.critico = Math.min(50, resultado.critico + cicatriz.bonusCritico);
    if (cicatriz.multiplicadorDefesa) resultado.defesa = Math.round(resultado.defesa * cicatriz.multiplicadorDefesa);
    if (cicatriz.multiplicadorTecnica) resultado.tecnica = Math.round(resultado.tecnica * cicatriz.multiplicadorTecnica);
    if (cicatriz.multiplicadorChakra) resultado.chakra = Math.round(resultado.chakra * cicatriz.multiplicadorChakra);
  }
  if (character.flags.nucleoRachado) resultado.velocidadeCultivo *= 0.6;
  if (character.flags.sequelaSemTratamento) resultado.velocidadeCultivo *= 0.8;
  return resultado;
}

/** Chamado depois de toda luta. Núcleo Rachado vem de sobreviver a quem tentou destruir seu núcleo. */
export function ferimentosDeCombate(character: Character, vidaFinal: number, vidaMax: number, nomeInimigo: string): string[] {
  const mensagens: string[] = [];
  const quaseFatal = vidaFinal / Math.max(1, vidaMax) <= LIMITE_QUASE_FATAL;
  if (!quaseFatal) return mensagens;

  character.flags.quaseMorte = true;

  if (nomeInimigo.startsWith('Vingador') && !character.flags.nucleoRachado && chance(0.35)) {
    character.flags.nucleoRachado = true;
    mensagens.push('O vingador tentou destruir seu núcleo. Você sobreviveu — mas o núcleo RACHOU. Seu cultivo ficou muito mais lento (−40%) até encontrar algo raro que o conserte.');
    return mensagens;
  }

  const disponiveis = CICATRIZES.filter((c) => !character.cicatrizes.includes(c.id));
  if (disponiveis.length && character.cicatrizes.length < MAX_CICATRIZES && chance(0.35)) {
    const cicatriz = escolher(disponiveis);
    character.cicatrizes.push(cicatriz.id);
    for (const [chave, delta] of Object.entries(cicatriz.malus) as [keyof Attributes, number][]) {
      character.atributosBase[chave] = Math.max(1, character.atributosBase[chave] + delta);
    }
    mensagens.push(`A luta deixou uma marca permanente: ${cicatriz.nome}. ${cicatriz.descricao}`);
  } else if (!character.flags.sequela && chance(0.15)) {
    character.flags.sequela = 'Meridianos Danificados';
    mensagens.push('Sequela: Meridianos Danificados. Você vai precisar de 1 Pílula de Cura (ou 3 pedras com um curandeiro) a cada estação para não piorar.');
  }
  return mensagens;
}

/** Sequelas cobram manutenção toda estação. */
export function processarSequelas(character: Character, estacoes: number): string[] {
  if (!character.flags.sequela) return [];
  let tratou = true;
  for (let i = 0; i < estacoes; i++) {
    if (removerItem(character.inventario, 'pilula-cura', 1)) continue;
    if (character.inventario.pedrasEspirituais >= 3) {
      addPedrasEspirituais(character.inventario, -3);
      continue;
    }
    tratou = false;
  }
  character.flags.sequelaSemTratamento = !tratou;
  return tratou
    ? [`Tratamento da sequela (${character.flags.sequela}) feito nesta estação.`]
    : [`Sem remédio para a sequela (${character.flags.sequela}): seu cultivo sofre (−20%) até você se tratar.`];
}

/** Tratamento definitivo: Pílula da Medula Celestial conserta um Núcleo Rachado ou cura a sequela. */
export function podeCurarComMedula(character: Character): boolean {
  return quantidadeItem(character.inventario, 'pilula-medula-celestial') > 0 && Boolean(character.flags.nucleoRachado || character.flags.sequela);
}
