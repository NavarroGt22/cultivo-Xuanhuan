import { escolher } from './rng';

export type RegiaoId = 'central' | 'norte' | 'sul' | 'leste' | 'oeste';

export interface SeitaSuprema {
  nome: string;
  ortodoxa: boolean;
}

export interface Regiao {
  id: RegiaoId;
  nome: string;
  /** Preposição + artigo: "na Planície Central", "no Norte". */
  preposicao: 'na' | 'no';
  /** 1 = mais forte (GDD seção 9). */
  posicao: number;
  /** Escala dificuldade de inimigos e valor de recompensas. */
  fatorPoder: number;
  descricao: string;
  fauna: string[];
  cidades: string[];
  seitasSupremas: SeitaSuprema[];
}

/**
 * GDD seção 9. Fauna, cidades e nomes das 9 Seitas Supremas são propostas —
 * o GDD ainda não os define.
 */
export const REGIOES: Record<RegiaoId, Regiao> = {
  central: {
    id: 'central',
    nome: 'Planície Central',
    preposicao: 'na',
    posicao: 1,
    fatorPoder: 1.6,
    descricao: 'o coração do mundo, onde as seitas e famílias mais poderosas disputam cada palmo de terra.',
    fauna: ['Qilin de Chifre Dourado', 'Tigre de Nuvem Branca', 'Garça Celestial de Nove Penas'],
    cidades: ['Cidade Imperial de Tianjing', 'Cidade dos Mil Pavilhões', 'Cidade de Jade Branco'],
    seitasSupremas: [
      { nome: 'Palácio Celestial do Dao Supremo', ortodoxa: true },
      { nome: 'Seita da Espada Imortal', ortodoxa: true },
      { nome: 'Culto do Abismo Carmesim', ortodoxa: false },
    ],
  },
  norte: {
    id: 'norte',
    nome: 'Norte',
    preposicao: 'no',
    posicao: 2,
    fatorPoder: 1.4,
    descricao: 'terra de geleiras eternas e montanhas de ferro, onde até os mortais são duros como pedra.',
    fauna: ['Lobo de Presas de Gelo', 'Urso de Armadura Glacial', 'Águia da Tempestade de Neve'],
    cidades: ['Fortaleza do Vento Gelado', 'Cidade de Ferro Negro', 'Porto da Aurora'],
    seitasSupremas: [
      { nome: 'Seita da Geleira Eterna', ortodoxa: true },
      { nome: 'Salão dos Mil Cadáveres', ortodoxa: false },
    ],
  },
  sul: {
    id: 'sul',
    nome: 'Sul',
    preposicao: 'no',
    posicao: 3,
    fatorPoder: 1.2,
    descricao: 'selvas úmidas, pântanos venenosos e vulcões adormecidos.',
    fauna: ['Serpente de Escamas de Jade', 'Sapo de Fogo Venenoso', 'Pantera da Névoa'],
    cidades: ['Cidade das Mil Ervas', 'Cidade da Chama Vermelha', 'Vila do Pântano Esmeralda'],
    seitasSupremas: [
      { nome: 'Vale das Chamas Sagradas', ortodoxa: true },
      { nome: 'Seita da Serpente Venenosa', ortodoxa: false },
    ],
  },
  leste: {
    id: 'leste',
    nome: 'Leste',
    preposicao: 'no',
    posicao: 4,
    fatorPoder: 1.0,
    descricao: 'litorais recortados, arquipélagos e florestas de bambu banhadas pela névoa do mar.',
    fauna: ['Tartaruga de Carapaça de Coral', 'Macaco de Vento Prateado', 'Tubarão de Chifre Espiritual'],
    cidades: ['Cidade do Mar de Nuvens', 'Porto do Salgueiro', 'Vila do Bambu Azul'],
    seitasSupremas: [{ nome: 'Pavilhão do Mar de Nuvens', ortodoxa: true }],
  },
  oeste: {
    id: 'oeste',
    nome: 'Oeste',
    preposicao: 'no',
    posicao: 5,
    fatorPoder: 0.9,
    descricao: 'desertos dourados, cânions vermelhos e oásis que brilham como espelhos sob a lua.',
    fauna: ['Escorpião de Areia Dourada', 'Camelo de Duas Almas', 'Falcão do Sol Poente'],
    cidades: ['Cidade do Oásis Espelhado', 'Cidade da Areia Vermelha', 'Posto do Cânion Uivante'],
    seitasSupremas: [{ nome: 'Templo da Areia Dourada', ortodoxa: true }],
  },
};

/** Do mais fraco para o mais forte — usado com percentilComSorte. */
export const REGIOES_POR_RARIDADE: { id: RegiaoId; peso: number }[] = [
  { id: 'oeste', peso: 26 },
  { id: 'leste', peso: 26 },
  { id: 'sul', peso: 20 },
  { id: 'norte', peso: 17 },
  { id: 'central', peso: 11 },
];

export const SOBRENOMES = ['Lin', 'Xiao', 'Ye', 'Mo', 'Han', 'Su', 'Long', 'Bai', 'Qin', 'Yun', 'Lu', 'Shen', 'Gu', 'Hua', 'Duan'];
export const NOMES = ['Feng', 'Chen', 'Yu', 'Hao', 'Lan', 'Xue', 'Tian', 'Ming', 'Rou', 'Jian', 'Ling', 'Yan', 'Kai', 'Wei', 'Zhu'];

/** "do Clã Mo", "da Família Lin", "do Culto…" — artigo certo para nomes de família/clã/seita. */
export function doFamilia(nome: string): string {
  if (/^(Clã|Culto|Salão|Vale|Pico|Pavilhão|Palácio|Templo)(\s|$)/.test(nome)) return `do ${nome}`;
  if (/^(Família|Seita)(\s|$)/.test(nome)) return `da ${nome}`;
  return `de ${nome}`;
}

export function gerarNomePessoa(): string {
  return `${escolher(SOBRENOMES)} ${escolher(NOMES)}`;
}

export function gerarNomeCla(): string {
  return `Clã ${escolher(SOBRENOMES)}`;
}

export function gerarNomeSeita(ortodoxa: boolean): string {
  if (ortodoxa) {
    return `${escolher(['Seita', 'Pico', 'Vale', 'Pavilhão'])} ${escolher([
      'da Nuvem Azul',
      'da Espada Celeste',
      'da Lua Fria',
      'do Lótus Branco',
      'do Dragão de Jade',
      'do Pinheiro Eterno',
    ])}`;
  }
  return `${escolher(['Seita', 'Culto', 'Salão', 'Vale'])} ${escolher([
    'do Lótus Sangrento',
    'da Névoa Negra',
    'das Mil Almas',
    'do Osso Carmesim',
    'da Lua de Sangue',
  ])}`;
}
