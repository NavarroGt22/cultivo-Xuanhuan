import { DerivedStats } from './stats';

/** GDD seção 3 — Artes Marciais. */
export type CategoriaTecnica = 'cultivo' | 'corpo' | 'ofensiva' | 'movimento' | 'defensiva' | 'suporte' | 'proibida';
export type NivelDoGrau = 'Baixo' | 'Médio' | 'Alto';

export const NOME_GRAU_TECNICA = ['Amarelo', 'Xuan', 'Terra', 'Céu', 'Divino'];

export const NOME_CATEGORIA_TECNICA: Record<CategoriaTecnica, string> = {
  cultivo: 'Método de Cultivo',
  corpo: 'Técnica de Corpo',
  ofensiva: 'Técnica Ofensiva',
  movimento: 'Técnica de Movimento',
  defensiva: 'Técnica Defensiva',
  suporte: 'Técnica de Suporte',
  proibida: 'Arte Proibida',
};

export interface Tecnica {
  id: string;
  nome: string;
  categoria: CategoriaTecnica;
  /** 1 = Amarelo … 5 = Divino. */
  grau: number;
  nivel: NivelDoGrau;
  descricao: string;
  /** Chakra gasto por uso em combate (técnicas ativas). */
  custoChakra: number;
  // Passivas
  multiplicadorCultivo?: number;
  multiplicadorVida?: number;
  multiplicadorDefesa?: number;
  bonusEsquiva?: number;
  bonusVelocidade?: number;
  // Ativas em combate
  multiplicadorDano?: number;
  escudoPercentual?: number;
  curaPercentual?: number;
  /** Limite de vida (%) abaixo do qual a técnica é ativada. */
  gatilhoVida?: number;
  /** Meses de vida sacrificados a cada uso (artes proibidas). */
  custoVidaMeses?: number;
  /** Só obtida por herança — nunca aparece em pavilhões, lojas ou mercadores. */
  heranca?: boolean;
}

/** Uma técnica de cada categoria, em graus variados. */
export const TECNICAS: Tecnica[] = [
  {
    id: 'respiracao-nove-nuvens',
    nome: 'Arte de Respiração das Nove Nuvens',
    categoria: 'cultivo',
    grau: 1,
    nivel: 'Alto',
    descricao: 'Método de cultivo principal: a respiração segue o ritmo das nuvens. Velocidade de cultivo ×1,25.',
    custoChakra: 0,
    multiplicadorCultivo: 1.25,
  },
  {
    id: 'corpo-bronze',
    nome: 'Técnica do Corpo de Bronze',
    categoria: 'corpo',
    grau: 1,
    nivel: 'Médio',
    descricao: 'Tempera pele e ossos com qi. Vida ×1,15 e defesa ×1,2.',
    custoChakra: 0,
    multiplicadorVida: 1.15,
    multiplicadorDefesa: 1.2,
  },
  {
    id: 'palma-trovao',
    nome: 'Palma do Trovão Ascendente',
    categoria: 'ofensiva',
    grau: 2,
    nivel: 'Baixo',
    descricao: 'Concentra qi de raio na palma. Golpe de dano ×2,2 que ignora metade da defesa. Custa 15 de Chakra.',
    custoChakra: 15,
    multiplicadorDano: 2.2,
  },
  {
    id: 'passos-nuvem',
    nome: 'Passos da Nuvem Errante',
    categoria: 'movimento',
    grau: 2,
    nivel: 'Médio',
    descricao: 'Os pés mal tocam o chão. Esquiva +8% e velocidade +3.',
    custoChakra: 0,
    bonusEsquiva: 8,
    bonusVelocidade: 3,
  },
  {
    id: 'lotus-regeneracao',
    nome: 'Regeneração do Lótus Verde',
    categoria: 'suporte',
    grau: 2,
    nivel: 'Alto',
    descricao: 'Abaixo de 35% de vida, cura 30% da vida máxima. Uma vez por luta; custa 25 de Chakra.',
    custoChakra: 25,
    curaPercentual: 30,
    gatilhoVida: 35,
  },
  {
    id: 'escudo-qi-dourado',
    nome: 'Escudo de Qi Dourado',
    categoria: 'defensiva',
    grau: 3,
    nivel: 'Baixo',
    descricao: 'No início da luta, ergue um escudo que absorve 25% da vida máxima em dano. Custa 20 de Chakra.',
    custoChakra: 20,
    escudoPercentual: 25,
  },
  {
    id: 'sangue-fervente',
    nome: 'Arte Proibida do Sangue Fervente',
    categoria: 'proibida',
    grau: 4,
    nivel: 'Baixo',
    descricao: 'Abaixo de 30% de vida, o sangue ferve: dano ×1,8 até o fim da luta. Cada uso consome 2 anos de vida.',
    custoChakra: 0,
    multiplicadorDano: 1.8,
    gatilhoVida: 30,
    custoVidaMeses: 24,
  },
  {
    id: 'sutra-imperador-estelar',
    nome: 'Sutra do Imperador Estelar',
    categoria: 'cultivo',
    grau: 5,
    nivel: 'Médio',
    descricao: 'Método de cultivo de um Martial Emperor: absorve a luz das estrelas. Velocidade de cultivo ×1,8.',
    custoChakra: 0,
    multiplicadorCultivo: 1.8,
    heranca: true,
  },
  {
    id: 'punho-imperador-estelar',
    nome: 'Punho do Imperador Estelar',
    categoria: 'ofensiva',
    grau: 5,
    nivel: 'Baixo',
    descricao: 'Um punho que carrega o peso de uma estrela. Golpe ×3,2 que ignora metade da defesa. Custa 30 de Chakra.',
    custoChakra: 30,
    multiplicadorDano: 3.2,
    heranca: true,
  },
  {
    id: 'chama-renascente',
    nome: 'Chama Renascente da Fênix',
    categoria: 'suporte',
    grau: 4,
    nivel: 'Alto',
    descricao: 'Abaixo de 30% de vida, renasce das chamas curando 60% da vida. Uma vez por luta; custa 30 de Chakra.',
    custoChakra: 30,
    curaPercentual: 60,
    gatilhoVida: 30,
    heranca: true,
  },

  // --- Técnicas comuns adicionais (pavilhões, mercadores, torres, achados) ---
  {
    id: 'punho-montanha',
    nome: 'Punho que Racha Montanhas',
    categoria: 'ofensiva',
    grau: 1,
    nivel: 'Alto',
    descricao: 'Soco simples, mas com todo o peso do corpo e do qi. Golpe ×1,7. Custa 8 de Chakra.',
    custoChakra: 8,
    multiplicadorDano: 1.7,
  },
  {
    id: 'lamina-vento',
    nome: 'Lâmina do Vento Cortante',
    categoria: 'ofensiva',
    grau: 2,
    nivel: 'Alto',
    descricao: 'Uma lâmina de ar comprimido que corta a distância. Golpe ×2,5. Custa 18 de Chakra.',
    custoChakra: 18,
    multiplicadorDano: 2.5,
  },
  {
    id: 'lotus-carmesim',
    nome: 'Chama do Lótus Carmesim',
    categoria: 'ofensiva',
    grau: 3,
    nivel: 'Médio',
    descricao: 'Pétalas de fogo espiritual que explodem ao tocar o alvo. Golpe ×2,8. Custa 22 de Chakra.',
    custoChakra: 22,
    multiplicadorDano: 2.8,
  },
  {
    id: 'pele-de-ferro',
    nome: 'Pele de Ferro Negro',
    categoria: 'defensiva',
    grau: 2,
    nivel: 'Médio',
    descricao: 'A pele endurece como metal no início da luta: escudo de 18% da vida. Custa 12 de Chakra.',
    custoChakra: 12,
    escudoPercentual: 18,
  },
  {
    id: 'orvalho-celestial',
    nome: 'Orvalho Celestial',
    categoria: 'suporte',
    grau: 3,
    nivel: 'Médio',
    descricao: 'Abaixo de 40% de vida, gotas de energia pura curam 40%. Uma vez por luta; custa 28 de Chakra.',
    custoChakra: 28,
    curaPercentual: 40,
    gatilhoVida: 40,
  },
  {
    id: 'passo-relampago',
    nome: 'Passo do Relâmpago',
    categoria: 'movimento',
    grau: 3,
    nivel: 'Alto',
    descricao: 'Você se move como um raio. Esquiva +12% e velocidade +5.',
    custoChakra: 0,
    bonusEsquiva: 12,
    bonusVelocidade: 5,
  },
  {
    id: 'ossos-de-jade',
    nome: 'Refinamento dos Ossos de Jade',
    categoria: 'corpo',
    grau: 2,
    nivel: 'Alto',
    descricao: 'Ossos temperados como jade. Vida ×1,22 e defesa ×1,25.',
    custoChakra: 0,
    multiplicadorVida: 1.22,
    multiplicadorDefesa: 1.25,
  },
  {
    id: 'sutra-lotus-azul',
    nome: 'Sutra do Lótus Azul',
    categoria: 'cultivo',
    grau: 2,
    nivel: 'Médio',
    descricao: 'Método de cultivo sereno, ensinado em seitas ortodoxas. Velocidade de cultivo ×1,4.',
    custoChakra: 0,
    multiplicadorCultivo: 1.4,
  },

  // --- Técnicas de herança adicionais ---
  {
    id: 'espada-mil-ventos',
    nome: 'Espada dos Mil Ventos',
    categoria: 'ofensiva',
    grau: 4,
    nivel: 'Alto',
    descricao: 'O golpe final do Sábio da Espada: mil cortes num só instante. Golpe ×3,0. Custa 26 de Chakra.',
    custoChakra: 26,
    multiplicadorDano: 3.0,
    heranca: true,
  },
  {
    id: 'medula-dragao',
    nome: 'Medula do Dragão Ancestral',
    categoria: 'corpo',
    grau: 4,
    nivel: 'Médio',
    descricao: 'Sangue e ossos reforçados com essência de dragão. Vida ×1,35 e defesa ×1,4.',
    custoChakra: 0,
    multiplicadorVida: 1.35,
    multiplicadorDefesa: 1.4,
    heranca: true,
  },
  {
    id: 'metodo-nove-sois',
    nome: 'Método dos Nove Sóis',
    categoria: 'cultivo',
    grau: 4,
    nivel: 'Alto',
    descricao: 'Absorve o calor de nove sóis imaginários. Velocidade de cultivo ×1,6.',
    custoChakra: 0,
    multiplicadorCultivo: 1.6,
    heranca: true,
  },
  {
    id: 'devorar-almas',
    nome: 'Arte Proibida de Devorar Almas',
    categoria: 'proibida',
    grau: 4,
    nivel: 'Alto',
    descricao: 'Abaixo de 25% de vida, você devora a alma do inimigo: dano ×2,3 até o fim da luta. Cada uso consome 3 anos de vida.',
    custoChakra: 0,
    multiplicadorDano: 2.3,
    gatilhoVida: 25,
    custoVidaMeses: 36,
    heranca: true,
  },
];

export function getTecnica(id: string): Tecnica | undefined {
  return TECNICAS.find((tecnica) => tecnica.id === id);
}

export function nomeGrau(tecnica: Tecnica): string {
  return `${NOME_GRAU_TECNICA[tecnica.grau - 1]} ${tecnica.nivel}`;
}

/** Dificuldade do teste de Compreensão para aprender. "Grau é o teto, não o resultado garantido." */
export function dificuldadeAprendizado(tecnica: Tecnica): number {
  const nivel = tecnica.nivel === 'Baixo' ? 0 : tecnica.nivel === 'Médio' ? 1 : 2;
  return 8 + tecnica.grau * 4 + nivel * 2;
}

/** Manuais de herança vêm com o eco do dono guiando o estudo. */
const BONUS_HERANCA = 10;
/** Cada tentativa fracassada deixa um pouco de compreensão para a próxima. */
const BONUS_POR_TENTATIVA = 2;
const DIFICULDADE_MINIMA = 5;

export function chaveEstudo(tecnicaId: string): string {
  return `estudo:${tecnicaId}`;
}

export function dificuldadeEstudo(tecnica: Tecnica, tentativasAnteriores: number): number {
  const base = dificuldadeAprendizado(tecnica) - (tecnica.heranca ? BONUS_HERANCA : 0);
  return Math.max(DIFICULDADE_MINIMA, base - tentativasAnteriores * BONUS_POR_TENTATIVA);
}

export const PREFIXO_MANUAL = 'manual:';

export function idManual(tecnicaId: string): string {
  return `${PREFIXO_MANUAL}${tecnicaId}`;
}

export function tecnicaDoManual(itemId: string): Tecnica | undefined {
  return itemId.startsWith(PREFIXO_MANUAL) ? getTecnica(itemId.slice(PREFIXO_MANUAL.length)) : undefined;
}

function melhorDaCategoria(tecnicasIds: string[], categoria: CategoriaTecnica, valor: (t: Tecnica) => number): Tecnica | undefined {
  return tecnicasIds
    .map(getTecnica)
    .filter((t): t is Tecnica => Boolean(t) && (t as Tecnica).categoria === categoria)
    .sort((a, b) => valor(b) - valor(a))[0];
}

/**
 * Passivas não se empilham: vale o melhor Método de Cultivo, a melhor Técnica de Corpo
 * e a melhor Técnica de Movimento que você domina.
 */
export function aplicarPassivas(stats: DerivedStats, tecnicasIds: string[]): DerivedStats {
  const resultado = { ...stats };

  const metodo = melhorDaCategoria(tecnicasIds, 'cultivo', (t) => t.multiplicadorCultivo ?? 1);
  if (metodo?.multiplicadorCultivo) resultado.velocidadeCultivo *= metodo.multiplicadorCultivo;

  const corpo = melhorDaCategoria(tecnicasIds, 'corpo', (t) => (t.multiplicadorVida ?? 1) * (t.multiplicadorDefesa ?? 1));
  if (corpo?.multiplicadorVida) resultado.vida = Math.round(resultado.vida * corpo.multiplicadorVida);
  if (corpo?.multiplicadorDefesa) resultado.defesa = Math.round(resultado.defesa * corpo.multiplicadorDefesa);

  const movimento = melhorDaCategoria(tecnicasIds, 'movimento', (t) => (t.bonusEsquiva ?? 0) + (t.bonusVelocidade ?? 0));
  if (movimento?.bonusEsquiva) resultado.esquiva = Math.min(70, resultado.esquiva + movimento.bonusEsquiva);

  return resultado;
}

export function bonusVelocidade(tecnicasIds: string[]): number {
  return melhorDaCategoria(tecnicasIds, 'movimento', (t) => (t.bonusEsquiva ?? 0) + (t.bonusVelocidade ?? 0))?.bonusVelocidade ?? 0;
}

/** Grau máximo de técnica que a afiliação dá acesso (GDD 3: quem tem acesso a cada grau). */
export function grauMaximoPorAcesso(tipoAfiliacao: string, posto: string, prestigioOrigem: number): number {
  const nivelPosto = ['Discípulo Externo', 'Discípulo Interno', 'Discípulo Núcleo', 'Ancião Aprendiz'].indexOf(posto);
  const bonusPosto = Math.max(0, nivelPosto);
  if (tipoAfiliacao === 'seita-suprema') return Math.min(5, 2 + bonusPosto);
  if (tipoAfiliacao === 'seita') return Math.min(4, 1 + bonusPosto);
  if (tipoAfiliacao === 'cla') return prestigioOrigem >= 3 ? 3 : prestigioOrigem >= 2 ? 2 : 1;
  return 1;
}
