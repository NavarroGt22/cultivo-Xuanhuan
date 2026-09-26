export interface Attributes {
  forca: number;
  destreza: number;
  inteligencia: number;
  constituicao: number;
  espirito: number;
  sorte: number;
}

export type AttributeKey = keyof Attributes;

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  'forca',
  'destreza',
  'inteligencia',
  'constituicao',
  'espirito',
  'sorte',
];

export interface AttributeInfo {
  sigla: string;
  nome: string;
  influencia: string;
}

export const ATTRIBUTE_INFO: Record<AttributeKey, AttributeInfo> = {
  forca: {
    sigla: 'FOR',
    nome: 'Força',
    influencia: 'Dano físico e técnicas de corpo. +2 de Ataque por ponto.',
  },
  destreza: {
    sigla: 'DES',
    nome: 'Destreza',
    influencia: 'Esquiva (+3% por ponto), atacar primeiro e chance de golpes extras em luta.',
  },
  inteligencia: {
    sigla: 'INT',
    nome: 'Inteligência',
    influencia:
      'Compreensão, alquimia e inscrição. Em luta: precisão (reduz a esquiva inimiga), +0,5% de Crítico e parte do dano de técnica.',
  },
  constituicao: {
    sigla: 'CON',
    nome: 'Constituição',
    influencia: 'Vida, defesa e resistência à toxina de pílulas. +10 de Vida e +1 de Defesa por ponto.',
  },
  espirito: {
    sigla: 'ESP',
    nome: 'Espírito',
    influencia:
      'Chakra/Star, velocidade de cultivo (+5% por ponto) e dano de técnica espiritual, que ignora metade da defesa.',
  },
  sorte: {
    sigla: 'SOR',
    nome: 'Sorte',
    influencia:
      'Nascimento (região, família e raiz espiritual), encontros raros e tesouros. +1% de Crítico por ponto.',
  },
};

/** Regras da distribuição de pontos na criação de personagem. */
export const VALOR_INICIAL_ATRIBUTO = 5;
export const MIN_ATRIBUTO_DISTRIBUIDO = 3;
export const MAX_ATRIBUTO_DISTRIBUIDO = 15;
export const PONTOS_DE_CRIACAO = 14;

export function addAttributes(base: Attributes, ...bonus: Partial<Attributes>[]): Attributes {
  const total: Attributes = { ...base };

  for (const parcial of bonus) {
    for (const chave of Object.keys(parcial) as AttributeKey[]) {
      const valor = parcial[chave];
      if (valor !== undefined) {
        total[chave] += valor;
      }
    }
  }

  return total;
}

export function createBaseAttributes(overrides: Partial<Attributes> = {}): Attributes {
  const base: Attributes = {
    forca: VALOR_INICIAL_ATRIBUTO,
    destreza: VALOR_INICIAL_ATRIBUTO,
    inteligencia: VALOR_INICIAL_ATRIBUTO,
    constituicao: VALOR_INICIAL_ATRIBUTO,
    espirito: VALOR_INICIAL_ATRIBUTO,
    sorte: VALOR_INICIAL_ATRIBUTO,
  };

  return addAttributes(base, overrides);
}

/** Pontos já gastos numa distribuição (valores abaixo do inicial devolvem pontos). */
export function pontosGastos(distribuicao: Attributes): number {
  return ATTRIBUTE_KEYS.reduce((soma, chave) => soma + (distribuicao[chave] - VALOR_INICIAL_ATRIBUTO), 0);
}

export function formatarBonus(bonus: Partial<Attributes>): string {
  return (Object.keys(bonus) as AttributeKey[])
    .filter((chave) => bonus[chave])
    .map((chave) => {
      const valor = bonus[chave] as number;
      return `${valor > 0 ? '+' : ''}${valor} ${ATTRIBUTE_INFO[chave].sigla}`;
    })
    .join(', ');
}
