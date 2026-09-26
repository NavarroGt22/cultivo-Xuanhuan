import { VALOR_INICIAL_ATRIBUTO } from './attributes';
import { percentilComSorte } from './rng';

export type Elemento =
  | 'fogo'
  | 'terra'
  | 'metal'
  | 'agua'
  | 'madeira'
  | 'raio'
  | 'vento'
  | 'luz'
  | 'trevas'
  | 'espaco'
  | 'tempo';

export type TipoRaiz = 'unico' | 'multiplo' | 'caotica' | 'vazio';

export interface SpiritualRoot {
  /** 1 (Mundana) a 9 (Celestial), ver GDD seção 2. */
  grau: number;
  tipo: TipoRaiz;
  elementos: Elemento[];
}

export const ELEMENTOS_BASE: Elemento[] = ['fogo', 'terra', 'metal', 'agua', 'madeira'];
export const ELEMENTOS_SUPERIORES: Elemento[] = ['raio', 'vento', 'luz', 'trevas', 'espaco', 'tempo'];

export const NOME_ELEMENTO: Record<Elemento, string> = {
  fogo: 'Fogo',
  terra: 'Terra',
  metal: 'Metal',
  agua: 'Água',
  madeira: 'Madeira',
  raio: 'Raio',
  vento: 'Vento',
  luz: 'Luz',
  trevas: 'Trevas',
  espaco: 'Espaço',
  tempo: 'Tempo',
};

export interface TipoRaizInfo {
  nome: string;
  descricao: string;
  multiplicadorCultivo: number;
}

export const TIPO_RAIZ_INFO: Record<TipoRaiz, TipoRaizInfo> = {
  unico: {
    nome: 'Atributo Único',
    descricao: 'Cultivo rápido e estável; técnicas do próprio elemento saem quase nativas.',
    multiplicadorCultivo: 1.2,
  },
  multiplo: {
    nome: 'Atributos Múltiplos',
    descricao: 'Grande versatilidade tática, mas o cultivo é mais lento para harmonizar as energias.',
    multiplicadorCultivo: 0.9,
  },
  caotica: {
    nome: 'Raiz Mista Caótica',
    descricao: 'Muitos elementos fracos e desorganizados. Cultiva devagar em tudo e bem em nada... por enquanto.',
    multiplicadorCultivo: 0.6,
  },
  vazio: {
    nome: 'Sem Atributo (Caos/Vazio)',
    descricao: 'Raríssima. Parece raiz de lixo no início, mas dominada é compatível com qualquer técnica.',
    multiplicadorCultivo: 0.5,
  },
};

export interface GrauRaizInfo {
  nome: string;
  observacao: string;
}

export function grauRaizInfo(grau: number): GrauRaizInfo {
  if (grau <= 1) {
    return { nome: 'Raiz Mundana', observacao: 'Não cultiva de forma competitiva. Só um milagre mudaria isso.' };
  }
  if (grau <= 3) {
    return { nome: 'Raiz Comum', observacao: 'Cultiva, mas tende a estagnar cedo sem uma grande oportunidade.' };
  }
  if (grau <= 5) {
    return { nome: 'Raiz Superior', observacao: 'Material de discípulo interno de clã médio ou grande.' };
  }
  if (grau <= 7) {
    return { nome: 'Raiz de Elite', observacao: 'Herdeiro provável, disputado entre seitas.' };
  }
  if (grau === 8) {
    return { nome: 'Raiz Ímpar', observacao: 'Gênio de uma geração. Atrairá atenção — boa e má.' };
  }
  return { nome: 'Raiz Celestial', observacao: 'Lendária. Forças muito além de qualquer clã vão notar você.' };
}

function sortearGrau(sorte: number): number {
  const r = percentilComSorte(sorte);
  if (r < 70) return 1;
  if (r < 95) return r < 82.5 ? 2 : 3;
  if (r < 99) return r < 97 ? 4 : 5;
  if (r < 99.9) return r < 99.45 ? 6 : 7;
  if (r < 99.99) return 8;
  return Math.random() < 0.01 ? 9 : 8;
}

function sortearTipo(): TipoRaiz {
  const r = Math.random() * 100;
  if (r < 35) return 'unico';
  if (r < 75) return 'multiplo';
  if (r < 97) return 'caotica';
  return 'vazio';
}

function sortearDistintos<T>(lista: T[], quantidade: number): T[] {
  const copia = [...lista];
  const resultado: T[] = [];
  while (resultado.length < quantidade && copia.length > 0) {
    const indice = Math.floor(Math.random() * copia.length);
    resultado.push(copia.splice(indice, 1)[0]);
  }
  return resultado;
}

/** Sorte 5 é neutra; valores maiores deslocam as chances para graus mais altos. */
export function rollSpiritualRoot(sorte = VALOR_INICIAL_ATRIBUTO): SpiritualRoot {
  const grau = sortearGrau(sorte);
  const tipo = sortearTipo();

  let elementos: Elemento[] = [];
  switch (tipo) {
    case 'unico':
      elementos = Math.random() < 0.1 ? sortearDistintos(ELEMENTOS_SUPERIORES, 1) : sortearDistintos(ELEMENTOS_BASE, 1);
      break;
    case 'multiplo':
      elementos = sortearDistintos(ELEMENTOS_BASE, Math.random() < 0.6 ? 2 : 3);
      break;
    case 'caotica':
      elementos = sortearDistintos(ELEMENTOS_BASE, Math.random() < 0.5 ? 4 : 5);
      break;
    case 'vazio':
      elementos = [];
      break;
  }

  return { grau, tipo, elementos };
}

/** Multiplicador de velocidade de cultivo vindo só da raiz (grau × tipo). */
export function multiplicadorRaiz(raiz: SpiritualRoot): number {
  const fatorGrau = 0.2 + (raiz.grau - 1) * 0.35;
  return fatorGrau * TIPO_RAIZ_INFO[raiz.tipo].multiplicadorCultivo;
}

export function descreverElementos(raiz: SpiritualRoot): string {
  if (raiz.elementos.length === 0) return 'Nenhum elemento';
  return raiz.elementos.map((elemento) => NOME_ELEMENTO[elemento]).join(' · ');
}
