import type { Character } from './character';
import type { StoryChoice } from './story';
import type { MundoState } from './worldState';
import type { AttributeKey } from './attributes';
import { addPedrasEspirituais } from './inventory';
import { REGIOES, RegiaoId } from './world';

/**
 * Grandes grupos mercadores: casas comerciais mais antigas que muitas seitas, com filiais em todas as regiões.
 * Você pode comprar cotas (dividendos a cada estação), cumprir contratos e subir de reputação com cada uma —
 * reputação alta dá desconto em todo o Mercado.
 */
export interface GrupoMercador {
  id: string;
  nome: string;
  sede: RegiaoId;
  especialidade: string;
  /** Atributo testado nos contratos do grupo. */
  atributo: AttributeKey;
  riquezaBase: number;
  descricao: string;
}

export const GRUPOS_MERCADORES: GrupoMercador[] = [
  { id: 'mil-riquezas', nome: 'Câmara das Mil Riquezas', sede: 'central', especialidade: 'pílulas e leilões', atributo: 'inteligencia', riquezaBase: 100000, descricao: 'Organiza os maiores leilões do continente. Dizem que nenhum imperador compra sem antes consultá-la.' },
  { id: 'caravana-dourada', nome: 'Caravana da Areia Dourada', sede: 'oeste', especialidade: 'rotas e escoltas', atributo: 'constituicao', riquezaBase: 70000, descricao: 'Mil camelos atravessam o deserto sob a sua bandeira. Os bandidos aprenderam a não tocar neles.' },
  { id: 'pavilhao-jade', nome: 'Pavilhão do Jade Celeste', sede: 'leste', especialidade: 'artefatos e armas', atributo: 'destreza', riquezaBase: 85000, descricao: 'Refinadores de todas as regiões vendem suas melhores peças por meio dele.' },
  { id: 'liga-norte', nome: 'Liga Mercante do Norte Gelado', sede: 'norte', especialidade: 'minérios e núcleos de besta', atributo: 'forca', riquezaBase: 60000, descricao: 'Controla as minas de minério estelar e o comércio de peles e núcleos das bestas do gelo.' },
];

export interface RelacaoMercador {
  reputacao: number;
  cotas: number;
}

export const ENERGIA_CONTRATO = 1;
const PRECO_COTA_BASE = 120;
const DIVIDENDO_POR_COTA = 3;

export function getGrupo(id: string): GrupoMercador | undefined {
  return GRUPOS_MERCADORES.find((g) => g.id === id);
}

function relacao(character: Character, id: string): RelacaoMercador {
  character.mercadores = character.mercadores ?? {};
  return (character.mercadores[id] = character.mercadores[id] ?? { reputacao: 0, cotas: 0 });
}

export function riqueza(mundo: MundoState, grupo: GrupoMercador): number {
  return mundo.riquezaMercadores?.[grupo.id] ?? grupo.riquezaBase;
}

export function tituloReputacao(reputacao: number): string {
  return reputacao >= 100 ? 'Conselheiro' : reputacao >= 50 ? 'Associado' : reputacao >= 20 ? 'Parceiro' : 'Cliente';
}

/** O maior desconto entre os grupos (Parceiro 5%, Associado 10%, Conselheiro 15%). */
export function descontoMercador(character: Character): number {
  const melhor = Math.max(0, ...Object.values(character.mercadores ?? {}).map((r) => r.reputacao));
  return melhor >= 100 ? 0.15 : melhor >= 50 ? 0.1 : melhor >= 20 ? 0.05 : 0;
}

export function precoCota(mundo: MundoState, grupo: GrupoMercador): number {
  return Math.round(PRECO_COTA_BASE * (riqueza(mundo, grupo) / grupo.riquezaBase));
}

export function comprarCota(character: Character, mundo: MundoState, id: string): string[] {
  const grupo = getGrupo(id);
  if (!grupo) return [];
  const preco = precoCota(mundo, grupo);
  if (character.inventario.pedrasEspirituais < preco) return [`Uma cota da ${grupo.nome} custa ${preco} pedras.`];
  addPedrasEspirituais(character.inventario, -preco);
  const r = relacao(character, id);
  r.cotas += 1;
  r.reputacao += 2;
  return [`Você compra uma cota da ${grupo.nome} por ${preco} pedras (agora tem ${r.cotas}). Dividendos a cada estação.`];
}

export function venderCota(character: Character, mundo: MundoState, id: string): string[] {
  const grupo = getGrupo(id);
  const r = character.mercadores?.[id];
  if (!grupo || !r || r.cotas <= 0) return [];
  const valor = Math.round(precoCota(mundo, grupo) * 0.85);
  r.cotas -= 1;
  addPedrasEspirituais(character.inventario, valor);
  return [`Você vende uma cota da ${grupo.nome} por ${valor} pedras.`];
}

/** Um contrato do grupo: entrega, escolta ou negociação, testando o atributo que ele mais valoriza. */
export function escolhaContrato(character: Character, id: string): StoryChoice {
  const grupo = getGrupo(id) as GrupoMercador;
  const fator = REGIOES[character.local.regiao].fatorPoder;
  const pagamento = Math.round((12 + character.cultivo.rank * 6) * fator);
  const dificuldade = 12 + character.cultivo.rank * 2 + (grupo.sede === character.local.regiao ? 0 : 2);
  return {
    texto: `Contrato da ${grupo.nome} (${grupo.especialidade})`,
    teste: { atributo: grupo.atributo, dificuldade },
    resultado: { texto: `O contrato é cumprido sem um arranhão. A ${grupo.nome} paga o combinado e anota seu nome.`, efeitos: { pedras: pagamento, flags: { mercadorReputacao: id } } },
    falha: { texto: 'O contrato dá errado: a carga se perde no caminho e o intermediário fica furioso.', efeitos: { danoPercentual: 10, flags: { mercadorFalha: id } } },
  };
}

/** Aplica a reputação que um contrato deixou nas flags. */
export function registrarContrato(character: Character): string[] {
  const sucesso = character.flags.mercadorReputacao;
  const falha = character.flags.mercadorFalha;
  delete character.flags.mercadorReputacao;
  delete character.flags.mercadorFalha;
  const id = typeof sucesso === 'string' ? sucesso : typeof falha === 'string' ? falha : null;
  const grupo = id ? getGrupo(id) : undefined;
  if (!id || !grupo) return [];
  const r = relacao(character, id);
  const antes = tituloReputacao(r.reputacao);
  r.reputacao = Math.max(0, r.reputacao + (sucesso ? 6 : -3));
  const depois = tituloReputacao(r.reputacao);
  return [
    `Reputação com a ${grupo.nome}: ${r.reputacao} (${depois}).`,
    ...(depois !== antes && sucesso ? [`Você agora é ${depois} da ${grupo.nome}: desconto de ${Math.round(descontoMercador(character) * 100)}% no Mercado.`] : []),
  ];
}

/** Dividendos das cotas a cada estação. */
export function processarMercadores(mundo: MundoState, character: Character, estacoes: number): string[] {
  const mensagens: string[] = [];
  for (const [id, r] of Object.entries(character.mercadores ?? {})) {
    const grupo = getGrupo(id);
    if (!grupo || r.cotas <= 0) continue;
    const bonus = r.reputacao >= 100 ? 1.5 : 1;
    const valor = Math.round(r.cotas * DIVIDENDO_POR_COTA * (riqueza(mundo, grupo) / grupo.riquezaBase) * bonus * estacoes);
    addPedrasEspirituais(character.inventario, valor);
    mensagens.push(`Dividendos da ${grupo.nome}: +${valor} pedras (${r.cotas} cota(s)).`);
  }
  return mensagens;
}

/** A riqueza dos grupos oscila (e volta devagar ao normal). */
export function avancarMercadores(mundo: MundoState, meses: number): void {
  mundo.riquezaMercadores = mundo.riquezaMercadores ?? {};
  const estacoes = Math.max(1, Math.round(meses / 3));
  for (const grupo of GRUPOS_MERCADORES) {
    let valor = riqueza(mundo, grupo);
    for (let i = 0; i < estacoes; i++) {
      valor *= 1 + (Math.random() - 0.5) * 0.08 + (grupo.riquezaBase - valor) / grupo.riquezaBase * 0.05;
    }
    mundo.riquezaMercadores[grupo.id] = Math.round(Math.max(grupo.riquezaBase * 0.4, valor));
  }
}

export function rankingMercadores(mundo: MundoState): { grupo: GrupoMercador; riqueza: number }[] {
  return GRUPOS_MERCADORES.map((grupo) => ({ grupo, riqueza: riqueza(mundo, grupo) })).sort((a, b) => b.riqueza - a.riqueza);
}
