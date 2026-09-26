import { Attributes } from './attributes';
import { REGIOES, REGIOES_POR_RARIDADE, RegiaoId, gerarNomeCla, gerarNomeSeita, SOBRENOMES } from './world';
import { chance, escolher, percentilComSorte } from './rng';

export type TipoOrigem =
  | 'orfao'
  | 'familia-comum'
  | 'cla-menor'
  | 'seita-menor'
  | 'cla-medio'
  | 'cla-grande'
  | 'seita-suprema'
  | 'super-cla'
  | 'cla-ancestral';

export type Ramo = 'principal' | 'colateral';

export interface CorpoEspecial {
  id: string;
  nome: string;
  descricao: string;
  /** Sinal visto no nascimento, antes de o corpo ser identificado. */
  sinal: string;
  bonusAtributos: Partial<Attributes>;
  multiplicadorVida: number;
  multiplicadorCultivo: number;
}

/** GDD seção 8 — Corpos Especiais. */
export const CORPOS_ESPECIAIS: CorpoEspecial[] = [
  {
    id: 'fenix',
    nome: 'Corpo Fênix',
    descricao: 'regeneração acelerada; ferimentos que matariam outros apenas te derrubam.',
    sinal: 'uma chama dourada ardeu por três noites na lamparina do quarto, sem óleo nenhum',
    bonusAtributos: { constituicao: 2 },
    multiplicadorVida: 1.2,
    multiplicadorCultivo: 1.1,
  },
  {
    id: 'caos',
    nome: 'Corpo do Caos',
    descricao: 'compatível com todos os elementos ao mesmo tempo.',
    sinal: 'o céu mudou de cor cinco vezes antes do amanhecer',
    bonusAtributos: { espirito: 1, inteligencia: 1 },
    multiplicadorVida: 1,
    multiplicadorCultivo: 1.3,
  },
  {
    id: 'trovao',
    nome: 'Corpo do Trovão Divino',
    descricao: 'absorve e resiste a raios; técnicas de trovão fluem por você.',
    sinal: 'um raio caiu no telhado da casa e ninguém se feriu',
    bonusAtributos: { constituicao: 1, espirito: 2 },
    multiplicadorVida: 1,
    multiplicadorCultivo: 1.15,
  },
  {
    id: 'jade',
    nome: 'Corpo de Jade Puro',
    descricao: 'constituição perfeitamente equilibrada, quase uma fornalha viva — ideal para alquimia.',
    sinal: 'sua pele brilhou como jade polido sob a luz da lua',
    bonusAtributos: { inteligencia: 2, constituicao: 1 },
    multiplicadorVida: 1.1,
    multiplicadorCultivo: 1.1,
  },
  {
    id: 'dragao',
    nome: 'Corpo de Dragão Ancestral',
    descricao: 'sangue de dragão desperto: força e vitalidade monstruosas, e as bestas sentem sua presença.',
    sinal: 'um rugido distante ecoou das montanhas, e as águas do rio ferveram por um instante',
    bonusAtributos: { forca: 2, constituicao: 2 },
    multiplicadorVida: 1.3,
    multiplicadorCultivo: 1.2,
  },
  {
    id: 'amaldicoado',
    nome: 'Corpo Amaldiçoado',
    descricao: 'poder imenso ao custo de dor constante e de uma vida mais curta.',
    sinal: 'todos os animais da região uivaram a noite inteira, e sua mãe chorou sem saber por quê',
    bonusAtributos: { forca: 3, espirito: 2, constituicao: -2 },
    multiplicadorVida: 0.5,
    multiplicadorCultivo: 1.5,
  },
];

export interface Origin {
  regiao: RegiaoId;
  cidade: string;
  tipo: TipoOrigem;
  /** Nome do clã, família ou seita (vazio para órfãos). */
  nomeCasa: string;
  ramo: Ramo | null;
  ortodoxa: boolean;
  corpoEspecial: CorpoEspecial | null;
  pedrasIniciais: number;
  alinhamentoBase: number;
  /** Família de Domadores de Bestas: a criança cresce com uma besta filhote. */
  familiaDomadora: boolean;
  /** Herança selada no berço (pingente com o eco de um ancestral), desperta na adolescência. */
  herancaSelada: boolean;
  /** GDD 14.3 — alma de outra vida (muitas vezes da Era Dourada). */
  reencarnacao?: VidaPassada | null;
}

export interface VidaPassada {
  nomeAntigo: string;
  titulo: string;
  comoMorreu: string;
}

const TITULOS_VIDA_PASSADA = ['Martial Emperor', 'Martial Supreme', 'Grão-Mestre Alquimista', 'Mestre de Arrays', 'Mestre das Mil Bestas'];
const MORTES_VIDA_PASSADA = [
  'traído pelo próprio discípulo no auge do poder',
  'engolido pelo Grande Cataclismo',
  'derrotado na tribulação para o Nine Heaven Realm',
  'selado por três Seitas Supremas unidas',
];

export type TipoAfiliacao = 'nenhuma' | 'familia' | 'cla' | 'seita' | 'seita-suprema';

export interface Afiliacao {
  tipo: TipoAfiliacao;
  nome: string;
  ortodoxa: boolean;
  posto: string;
  /** Pedras espirituais recebidas a cada estação (a partir dos 12 anos). */
  estipendio: number;
}

interface OrigemInfo {
  nome: string;
  peso: number;
  pedras: number;
  estipendio: number;
  /** 0 = sem prestígio, 5 = topo do mundo. */
  prestigio: number;
}

/** GDD seção 2. Ordenado do mais comum/fraco para o mais raro/forte. */
export const ORIGEM_INFO: Record<TipoOrigem, OrigemInfo> = {
  orfao: { nome: 'Órfão', peso: 12, pedras: 0, estipendio: 0, prestigio: 0 },
  'familia-comum': { nome: 'Família comum', peso: 38, pedras: 3, estipendio: 0, prestigio: 0 },
  'cla-menor': { nome: 'Clã menor', peso: 22, pedras: 10, estipendio: 1, prestigio: 1 },
  'seita-menor': { nome: 'Seita local', peso: 10, pedras: 12, estipendio: 1, prestigio: 1 },
  'cla-medio': { nome: 'Clã médio', peso: 10, pedras: 25, estipendio: 2, prestigio: 2 },
  'cla-grande': { nome: 'Clã grande', peso: 5, pedras: 50, estipendio: 4, prestigio: 3 },
  'seita-suprema': { nome: 'Seita Suprema', peso: 2, pedras: 70, estipendio: 3, prestigio: 4 },
  'super-cla': { nome: 'Super clã', peso: 0.9, pedras: 120, estipendio: 7, prestigio: 4 },
  'cla-ancestral': { nome: 'Clã ancestral', peso: 0.1, pedras: 250, estipendio: 12, prestigio: 5 },
};

const ORDEM_ORIGENS = Object.keys(ORIGEM_INFO) as TipoOrigem[];

function sortearPorPercentil<T>(itens: { valor: T; peso: number }[], percentil: number): T {
  const total = itens.reduce((soma, item) => soma + item.peso, 0);
  let acumulado = 0;
  for (const item of itens) {
    acumulado += (item.peso / total) * 100;
    if (percentil < acumulado) return item.valor;
  }
  return itens[itens.length - 1].valor;
}

export function isCla(tipo: TipoOrigem): boolean {
  return tipo === 'cla-menor' || tipo === 'cla-medio' || tipo === 'cla-grande' || tipo === 'super-cla' || tipo === 'cla-ancestral';
}

export function rollOrigin(sorte: number): Origin {
  const regiaoId = sortearPorPercentil(
    REGIOES_POR_RARIDADE.map((r) => ({ valor: r.id, peso: r.peso })),
    percentilComSorte(sorte),
  );
  const regiao = REGIOES[regiaoId];
  const tipo = sortearPorPercentil(
    ORDEM_ORIGENS.map((t) => ({ valor: t, peso: ORIGEM_INFO[t].peso })),
    percentilComSorte(sorte),
  );

  let nomeCasa = '';
  let ortodoxa = true;
  let ramo: Ramo | null = null;

  if (tipo === 'familia-comum') {
    nomeCasa = `Família ${escolher(SOBRENOMES)}`;
  } else if (isCla(tipo)) {
    nomeCasa = gerarNomeCla();
    ramo = percentilComSorte(sorte) > 75 ? 'principal' : 'colateral';
  } else if (tipo === 'seita-menor') {
    ortodoxa = chance(0.7);
    nomeCasa = gerarNomeSeita(ortodoxa);
  } else if (tipo === 'seita-suprema') {
    const seita = escolher(regiao.seitasSupremas);
    nomeCasa = seita.nome;
    ortodoxa = seita.ortodoxa;
  }

  const chanceCorpo = 0.006 + Math.max(0, sorte - 5) * 0.001;
  const corpoEspecial = chance(chanceCorpo) ? escolher(CORPOS_ESPECIAIS) : null;

  const info = ORIGEM_INFO[tipo];
  const pedrasIniciais = Math.round(info.pedras * (ramo === 'colateral' ? 0.4 : 1));

  let alinhamentoBase = 0;
  if (tipo === 'seita-menor' || tipo === 'seita-suprema') {
    const intensidade = tipo === 'seita-suprema' ? 25 : 15;
    alinhamentoBase = ortodoxa ? intensidade : -intensidade;
  }

  const podeSerDomadora = tipo === 'familia-comum' || tipo === 'cla-menor' || tipo === 'cla-medio' || tipo === 'cla-grande';
  const familiaDomadora = podeSerDomadora && chance(0.15);
  if (familiaDomadora && tipo === 'familia-comum') nomeCasa = `${nomeCasa} (Domadores de Bestas)`;

  const herancaSelada = chance(0.01 + Math.max(0, sorte - 5) * 0.004);
  const reencarnacao: VidaPassada | null = chance(0.012 + Math.max(0, sorte - 5) * 0.003)
    ? { nomeAntigo: `${escolher(SOBRENOMES)} ${escolher(['Tian', 'Wuji', 'Xuan', 'Yao', 'Long', 'Mingyue'])}`, titulo: escolher(TITULOS_VIDA_PASSADA), comoMorreu: escolher(MORTES_VIDA_PASSADA) }
    : null;

  return {
    regiao: regiaoId,
    cidade: escolher(regiao.cidades),
    tipo,
    nomeCasa,
    ramo,
    ortodoxa,
    corpoEspecial,
    pedrasIniciais,
    alinhamentoBase,
    familiaDomadora,
    herancaSelada,
    reencarnacao,
  };
}

export function afiliacaoInicial(origem: Origin): Afiliacao {
  const info = ORIGEM_INFO[origem.tipo];
  const estipendio = origem.ramo === 'colateral' ? Math.floor(info.estipendio / 2) : info.estipendio;

  switch (origem.tipo) {
    case 'orfao':
      return { tipo: 'nenhuma', nome: 'Sem vínculo', ortodoxa: true, posto: 'Órfão', estipendio: 0 };
    case 'familia-comum':
      return { tipo: 'familia', nome: origem.nomeCasa, ortodoxa: true, posto: 'Filho da casa', estipendio: 0 };
    case 'seita-menor':
    case 'seita-suprema':
      return {
        tipo: origem.tipo === 'seita-suprema' ? 'seita-suprema' : 'seita',
        nome: origem.nomeCasa,
        ortodoxa: origem.ortodoxa,
        posto: 'Discípulo Externo',
        estipendio,
      };
    default:
      return {
        tipo: 'cla',
        nome: origem.nomeCasa,
        ortodoxa: true,
        posto: origem.ramo === 'principal' ? 'Ramo Principal' : 'Ramo Colateral',
        estipendio,
      };
  }
}

export function descreverOrigem(origem: Origin): string {
  const regiao = REGIOES[origem.regiao];
  const info = ORIGEM_INFO[origem.tipo];
  let descricao: string;

  if (origem.tipo === 'orfao') {
    descricao = `Órfão criado num templo de ${origem.cidade}`;
  } else if (origem.tipo === 'familia-comum') {
    descricao = `${origem.nomeCasa}, de ${origem.cidade}`;
  } else if (isCla(origem.tipo)) {
    descricao = `Ramo ${origem.ramo} do ${origem.nomeCasa} (${info.nome.toLowerCase()})`;
  } else {
    descricao = `${origem.nomeCasa} (${info.nome.toLowerCase()}, ${origem.ortodoxa ? 'ortodoxa' : 'não-ortodoxa'})`;
  }

  return `${descricao} — ${regiao.nome}`;
}
