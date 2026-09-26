import { ATTRIBUTE_INFO, AttributeKey, Attributes } from './attributes';
import { Character, alterarVidaPercentual, getEffectiveAttributes } from './character';
import { attributeCheck } from './dice';
import { addItem, addPedrasEspirituais } from './inventory';
import { shiftAlignment } from './alignment';
import { PROFISSAO_INFO, ProfissaoId, ganharXpProfissao, tituloProfissao } from './professions';
import { REINOS } from './cultivation';
import { REGIOES } from './world';
import { chance } from './rng';

/** Piloto do docs/ocupacoes.md: seis categorias, com termos adaptados ao gênero. */
export type CategoriaOcupacaoId =
  | 'mundano'
  | 'guilda-alquimia'
  | 'pavilhao-inscricao'
  | 'arena'
  | 'guarda'
  | 'submundo'
  | 'artes'
  | 'divinacao';

export interface RequisitosCargo {
  rank?: number;
  atributos?: Partial<Attributes>;
  profissao?: { id: ProfissaoId; nivel: number };
  reputacao?: number;
  alinhamentoMin?: number;
  alinhamentoMax?: number;
  discipuloDeSeita?: boolean;
}

export interface RiscoCargo {
  /** Chance por estação. */
  chance: number;
  tipo: 'preso' | 'acidente';
}

export interface Cargo {
  nome: string;
  /** Pedras espirituais por estação, antes do fator da região e do desempenho. */
  salario: number;
  requisitos: RequisitosCargo;
  /** Sobrescreve o atributo da categoria (empregos mundanos variados). */
  atributo?: AttributeKey;
  risco?: RiscoCargo;
}

export interface CategoriaOcupacao {
  id: CategoriaOcupacaoId;
  nome: string;
  descricao: string;
  atributo: AttributeKey;
  /** true: cargos formam uma carreira com promoção; false: empregos independentes. */
  carreira: boolean;
  cargos: Cargo[];
  xpProfissao?: ProfissaoId;
  alinhamentoPorEstacao?: number;
  risco?: RiscoCargo;
  /** Reputação por estação (GDD 13: fama "de longo alcance" de escribas e poetas). */
  famaPorEstacao?: number;
}

export interface OcupacaoEstado {
  categoria: CategoriaOcupacaoId;
  cargo: number;
  /** 0–100. Chega a 100 → promoção; chega a 0 → demissão. */
  desempenho: number;
  estacoes: number;
}

export const CATEGORIAS_OCUPACAO: CategoriaOcupacao[] = [
  {
    id: 'mundano',
    nome: 'Trabalho Mundano',
    descricao: 'Empregos que não exigem cultivo. O sustento de quem nasceu com Raiz Mundana — e de muitos que não admitem.',
    atributo: 'constituicao',
    carreira: false,
    cargos: [
      { nome: 'Faxineiro de Seita', salario: 1, requisitos: {} },
      { nome: 'Cuidador de Estábulo', salario: 1, requisitos: {} },
      { nome: 'Lenhador', salario: 2, requisitos: {}, atributo: 'forca' },
      { nome: 'Pescador', salario: 2, requisitos: {}, atributo: 'destreza' },
      { nome: 'Mensageiro de Vila', salario: 2, requisitos: {}, atributo: 'destreza' },
      { nome: 'Cozinheiro de Estalagem', salario: 2, requisitos: {}, atributo: 'inteligencia' },
      { nome: 'Ferreiro Aprendiz', salario: 3, requisitos: { atributos: { forca: 9 } }, atributo: 'forca' },
      { nome: 'Jardineiro de Ervas Espirituais', salario: 3, requisitos: { atributos: { inteligencia: 9 } }, atributo: 'inteligencia' },
      {
        nome: 'Minerador de Pedras Espirituais',
        salario: 5,
        requisitos: { atributos: { constituicao: 10 } },
        risco: { chance: 0.05, tipo: 'acidente' },
      },
    ],
  },
  {
    id: 'guilda-alquimia',
    nome: 'Guilda de Alquimistas',
    descricao: 'Refinar pílulas por encomenda. Cada estação rende experiência em Alquimia.',
    atributo: 'inteligencia',
    carreira: true,
    xpProfissao: 'alquimia',
    cargos: [
      { nome: 'Aprendiz de Fornalha', salario: 3, requisitos: { profissao: { id: 'alquimia', nivel: 1 } } },
      { nome: 'Assistente de Refinamento', salario: 5, requisitos: { profissao: { id: 'alquimia', nivel: 1 }, atributos: { inteligencia: 10 } } },
      { nome: 'Avaliador de Pílulas', salario: 8, requisitos: { profissao: { id: 'alquimia', nivel: 2 } } },
      { nome: 'Alquimista da Guilda', salario: 14, requisitos: { profissao: { id: 'alquimia', nivel: 3 } } },
      { nome: 'Mestre de Fornalha da Guilda', salario: 25, requisitos: { profissao: { id: 'alquimia', nivel: 4 } } },
      { nome: 'Ancião da Guilda de Alquimistas', salario: 50, requisitos: { profissao: { id: 'alquimia', nivel: 6 }, reputacao: 60 } },
    ],
  },
  {
    id: 'pavilhao-inscricao',
    nome: 'Pavilhão de Inscrições',
    descricao: 'Gravar talismãs e manter formações. Cada estação rende experiência em Inscrição.',
    atributo: 'inteligencia',
    carreira: true,
    xpProfissao: 'inscricao',
    cargos: [
      { nome: 'Gravador de Padrões Fundamentais', salario: 3, requisitos: { profissao: { id: 'inscricao', nivel: 1 } } },
      { nome: 'Criador de Talismãs Portáteis', salario: 5, requisitos: { profissao: { id: 'inscricao', nivel: 1 }, atributos: { inteligencia: 10 } } },
      { nome: 'Mantenedor de Formações de Seita', salario: 8, requisitos: { profissao: { id: 'inscricao', nivel: 2 } } },
      { nome: 'Especialista em Selamentos', salario: 14, requisitos: { profissao: { id: 'inscricao', nivel: 3 } } },
      { nome: 'Arquiteto de Arrays', salario: 30, requisitos: { profissao: { id: 'inscricao', nivel: 5 } } },
      { nome: 'Grão-Mestre do Pavilhão', salario: 55, requisitos: { profissao: { id: 'inscricao', nivel: 6 }, reputacao: 60 } },
    ],
  },
  {
    id: 'arena',
    nome: 'Arena de Combate',
    descricao: 'Lutar por prêmios e fama. As lutas de arena aparecem como eventos.',
    atributo: 'forca',
    carreira: true,
    cargos: [
      { nome: 'Lutador Amador de Arena', salario: 2, requisitos: {} },
      { nome: 'Lutador Profissional de Arena', salario: 5, requisitos: { reputacao: 10 } },
      { nome: 'Reserva da Equipe da Seita', salario: 9, requisitos: { rank: 2, reputacao: 20, discipuloDeSeita: true } },
      { nome: 'Titular da Equipe da Seita', salario: 15, requisitos: { rank: 2, reputacao: 35, discipuloDeSeita: true } },
      { nome: 'Capitão da Equipe da Seita', salario: 25, requisitos: { rank: 3, reputacao: 55, discipuloDeSeita: true } },
      { nome: 'Lenda das Arenas', salario: 50, requisitos: { rank: 4, reputacao: 90 } },
    ],
  },
  {
    id: 'guarda',
    nome: 'Guarda da Cidade',
    descricao: 'Manter a ordem nas ruas. Rende alinhamento ortodoxo; o crime não é bem-vindo.',
    atributo: 'constituicao',
    carreira: true,
    alinhamentoPorEstacao: 1,
    cargos: [
      { nome: 'Guarda de Vila', salario: 2, requisitos: { alinhamentoMin: -20 } },
      { nome: 'Guarda da Cidade', salario: 3, requisitos: { alinhamentoMin: -20, atributos: { constituicao: 9 } } },
      { nome: 'Investigador da Guarda', salario: 5, requisitos: { alinhamentoMin: -10, atributos: { inteligencia: 10 } } },
      { nome: 'Inspetor da Guarda', salario: 8, requisitos: { alinhamentoMin: 0, rank: 2 } },
      { nome: 'Capitão da Guarda', salario: 12, requisitos: { alinhamentoMin: 10, rank: 2, reputacao: 25 } },
      { nome: 'Comandante da Guarda da Cidade', salario: 20, requisitos: { alinhamentoMin: 20, rank: 3, reputacao: 45 } },
    ],
  },
  {
    id: 'artes',
    nome: 'Letras e Crônicas',
    descricao: 'Escribas, poetas e cronistas. Pouco poder, mas fama de longo alcance: uma boa obra é recontada por gerações.',
    atributo: 'inteligencia',
    carreira: true,
    famaPorEstacao: 1,
    cargos: [
      { nome: 'Copista de Pergaminhos', salario: 1, requisitos: {} },
      { nome: 'Escriba de Crônicas', salario: 3, requisitos: { atributos: { inteligencia: 9 } } },
      { nome: 'Poeta de Casa de Chá', salario: 4, requisitos: { reputacao: 10 } },
      { nome: 'Cronista da Seita', salario: 7, requisitos: { reputacao: 25, atributos: { inteligencia: 11 } } },
      { nome: 'Poeta de Renome Regional', salario: 12, requisitos: { reputacao: 50 } },
      { nome: 'Lenda das Letras', salario: 20, requisitos: { reputacao: 90, atributos: { inteligencia: 14 } } },
    ],
  },
  {
    id: 'divinacao',
    nome: 'Divinação',
    descricao: 'Ler estrelas, ossos de tartaruga e sonhos. Clientes pagam bem para saber o futuro — mesmo quando o futuro erra.',
    atributo: 'espirito',
    carreira: true,
    xpProfissao: 'adivinhacao',
    famaPorEstacao: 1,
    cargos: [
      { nome: 'Leitor de Ossos de Tartaruga', salario: 2, requisitos: { profissao: { id: 'adivinhacao', nivel: 1 } } },
      { nome: 'Adivinho de Praça', salario: 4, requisitos: { profissao: { id: 'adivinhacao', nivel: 1 }, atributos: { espirito: 10 } } },
      { nome: 'Vidente da Seita', salario: 9, requisitos: { profissao: { id: 'adivinhacao', nivel: 2 }, reputacao: 20 } },
      { nome: 'Oráculo Regional', salario: 20, requisitos: { profissao: { id: 'adivinhacao', nivel: 3 }, reputacao: 50 } },
    ],
  },
  {
    id: 'submundo',
    nome: 'Submundo',
    descricao: 'Dinheiro rápido e perigoso. Puxa o alinhamento para o caminho não-ortodoxo, e a guarda está sempre de olho.',
    atributo: 'destreza',
    carreira: true,
    alinhamentoPorEstacao: -2,
    risco: { chance: 0.06, tipo: 'preso' },
    cargos: [
      { nome: 'Batedor de Carteira', salario: 3, requisitos: { alinhamentoMax: 30 } },
      { nome: 'Falsificador de Talismãs', salario: 5, requisitos: { alinhamentoMax: 20, atributos: { inteligencia: 9 } } },
      { nome: 'Contrabandista de Pílulas Proibidas', salario: 8, requisitos: { alinhamentoMax: 10 } },
      { nome: 'Salteador de Caravanas', salario: 12, requisitos: { alinhamentoMax: 0, rank: 2 } },
      { nome: 'Líder de Bando', salario: 18, requisitos: { alinhamentoMax: -20, rank: 2, reputacao: 20 } },
      { nome: 'Patriarca do Submundo', salario: 35, requisitos: { alinhamentoMax: -40, rank: 3, reputacao: 45 } },
    ],
  },
];

export function getCategoria(id: CategoriaOcupacaoId): CategoriaOcupacao {
  return CATEGORIAS_OCUPACAO.find((categoria) => categoria.id === id) ?? CATEGORIAS_OCUPACAO[0];
}

export function getCargo(estado: OcupacaoEstado): Cargo {
  const categoria = getCategoria(estado.categoria);
  return categoria.cargos[estado.cargo] ?? categoria.cargos[0];
}

export function atributoDoCargo(estado: OcupacaoEstado): AttributeKey {
  return getCargo(estado).atributo ?? getCategoria(estado.categoria).atributo;
}

/** Primeiro requisito não cumprido, ou null. */
export function motivoRequisitos(character: Character, requisitos: RequisitosCargo): string | null {
  const atributos = getEffectiveAttributes(character);

  if (requisitos.rank && character.cultivo.rank < requisitos.rank) {
    return `Requer ${REINOS[requisitos.rank - 1].nome}`;
  }
  for (const chave of Object.keys(requisitos.atributos ?? {}) as AttributeKey[]) {
    const minimo = requisitos.atributos?.[chave] ?? 0;
    if (atributos[chave] < minimo) return `Requer ${ATTRIBUTE_INFO[chave].nome} ${minimo}`;
  }
  if (requisitos.profissao && character.profissoes[requisitos.profissao.id].nivel < requisitos.profissao.nivel) {
    const titulo = tituloProfissao(requisitos.profissao.id, { nivel: requisitos.profissao.nivel, xp: 0 });
    return `Requer ${PROFISSAO_INFO[requisitos.profissao.id].nome}: ${titulo}`;
  }
  if (requisitos.reputacao && character.reputacao < requisitos.reputacao) {
    return `Requer reputação ${requisitos.reputacao}`;
  }
  if (requisitos.alinhamentoMin !== undefined && character.alinhamento.valor < requisitos.alinhamentoMin) {
    return `Requer alinhamento ≥ ${requisitos.alinhamentoMin}`;
  }
  if (requisitos.alinhamentoMax !== undefined && character.alinhamento.valor > requisitos.alinhamentoMax) {
    return `Requer alinhamento ≤ ${requisitos.alinhamentoMax}`;
  }
  if (requisitos.discipuloDeSeita && character.afiliacao.tipo !== 'seita' && character.afiliacao.tipo !== 'seita-suprema') {
    return 'Requer ser discípulo de uma seita';
  }
  if (character.idadeMeses < 12 * 12) {
    return 'Requer 12 anos';
  }
  return null;
}

export interface Vaga {
  categoria: CategoriaOcupacao;
  indice: number;
  cargo: Cargo;
  bloqueio: string | null;
}

/** Carreiras: só o cargo de entrada. Mundano: qualquer emprego. */
export function listarVagas(character: Character): Vaga[] {
  return CATEGORIAS_OCUPACAO.flatMap((categoria) => {
    const indices = categoria.carreira ? [0] : categoria.cargos.map((_, i) => i);
    return indices.map((indice) => ({
      categoria,
      indice,
      cargo: categoria.cargos[indice],
      bloqueio: motivoRequisitos(character, categoria.cargos[indice].requisitos),
    }));
  });
}

export function salarioAtual(character: Character): number {
  if (!character.ocupacao) return 0;
  const base = getCargo(character.ocupacao).salario * REGIOES[character.local.regiao].fatorPoder;
  return Math.max(1, Math.round(base * (0.75 + character.ocupacao.desempenho / 200)));
}

export function contratar(character: Character, categoria: CategoriaOcupacaoId, indice: number): string[] {
  const cargo = getCategoria(categoria).cargos[indice];
  if (!cargo || motivoRequisitos(character, cargo.requisitos)) return [];
  character.ocupacao = { categoria, cargo: indice, desempenho: 40, estacoes: 0 };
  return [`Você começa a trabalhar como ${cargo.nome}.`];
}

export function demitir(character: Character, motivo = 'Você deixa o emprego.'): string[] {
  if (!character.ocupacao) return [];
  character.ocupacao = null;
  return [motivo];
}

/** Soma ao desempenho e trata promoção (em 100) e demissão (em 0). */
export function ajustarDesempenho(character: Character, delta: number): string[] {
  const estado = character.ocupacao;
  if (!estado || delta === 0) return [];

  const mensagens: string[] = [];
  estado.desempenho = Math.max(0, Math.min(100, estado.desempenho + delta));

  if (estado.desempenho <= 0) {
    return demitir(character, `Seu desempenho como ${getCargo(estado).nome} foi péssimo. Você foi demitido.`);
  }

  const categoria = getCategoria(estado.categoria);
  const proximo = categoria.carreira ? categoria.cargos[estado.cargo + 1] : undefined;
  if (estado.desempenho >= 100 && proximo) {
    const bloqueio = motivoRequisitos(character, proximo.requisitos);
    if (bloqueio) {
      if (delta > 0) mensagens.push(`Você merece uma promoção a ${proximo.nome}, mas falta algo (${bloqueio}).`);
    } else {
      estado.cargo += 1;
      estado.desempenho = 40;
      mensagens.push(`Promoção! Agora você é ${proximo.nome}.`);
    }
  }

  return mensagens;
}

/** Salário, avaliação de desempenho, experiência de profissão e riscos de cada estação trabalhada. */
export function processarOcupacao(character: Character, estacoes: number): string[] {
  const estado = character.ocupacao;
  if (!estado) return [];

  const categoria = getCategoria(estado.categoria);
  const mensagens: string[] = [];
  let totalSalario = 0;

  for (let i = 0; i < estacoes && character.ocupacao; i++) {
    const cargo = getCargo(estado);
    estado.estacoes += 1;

    const salario = salarioAtual(character);
    addPedrasEspirituais(character.inventario, salario);
    totalSalario += salario;

    if (categoria.xpProfissao) {
      mensagens.push(...ganharXpProfissao(categoria.xpProfissao, character.profissoes[categoria.xpProfissao], 15, character.cultivo.rank));
    }
    if (categoria.famaPorEstacao) {
      character.reputacao += Math.round(categoria.famaPorEstacao * (1 + estado.cargo * 0.5));
    }
    if (categoria.alinhamentoPorEstacao) {
      character.alinhamento = shiftAlignment(character.alinhamento, categoria.alinhamentoPorEstacao);
    }
    if (cargo.nome === 'Jardineiro de Ervas Espirituais' && chance(0.3)) {
      addItem(character.inventario, 'erva-espiritual', 1);
    }

    const risco = cargo.risco ?? categoria.risco;
    if (risco && chance(risco.chance)) {
      if (risco.tipo === 'preso') {
        const multa = Math.floor(character.inventario.pedrasEspirituais / 2);
        addPedrasEspirituais(character.inventario, -multa);
        character.reputacao -= 10;
        alterarVidaPercentual(character, -40, 1);
        mensagens.push(...demitir(character, `A guarda te pegou em flagrante! Multa de ${multa} pedras, surra e fim da carreira no submundo.`));
        break;
      }
      alterarVidaPercentual(character, -35, 1);
      mensagens.push('Um desabamento na mina te deixa ferido.');
    }

    const valor = getEffectiveAttributes(character)[atributoDoCargo(estado)];
    const avaliacao = attributeCheck(valor, 10 + estado.cargo * 2);
    mensagens.push(...ajustarDesempenho(character, avaliacao.success ? 10 : avaliacao.criticalFailure ? -15 : -6));
  }

  if (totalSalario > 0) {
    mensagens.unshift(`Salário: +${totalSalario} pedras espirituais.`);
  }
  return mensagens;
}
