import type { Character } from './character';
import { REGIOES, RegiaoId } from './world';

/**
 * GDD 15.1 — Reputação por facção: um eixo com cada uma das 9 Seitas Supremas, separado do
 * alinhamento. Vai de −100 a 100 e afeta recrutamento, preços na região, ataques de discípulos
 * e a entrada na torre e no torneio que a Suprema da região organiza.
 */
export interface SupremaInfo {
  nome: string;
  ortodoxa: boolean;
  regiao: RegiaoId;
}

export const SUPREMAS: SupremaInfo[] = (Object.keys(REGIOES) as RegiaoId[]).flatMap((regiao) =>
  REGIOES[regiao].seitasSupremas.map((s) => ({ ...s, regiao })),
);

export type NivelReputacao = 'Hostil' | 'Desconfiada' | 'Neutra' | 'Favorável' | 'Aliada';

export const HOSTIL = -50;
export const ALIADA = 50;
/** Estações entre dois tributos pagos pela facção que você fundou. */
const ESTACOES_TRIBUTO = 4;

export function nivelReputacao(valor: number): NivelReputacao {
  if (valor <= HOSTIL) return 'Hostil';
  if (valor <= -15) return 'Desconfiada';
  if (valor < 15) return 'Neutra';
  if (valor < ALIADA) return 'Favorável';
  return 'Aliada';
}

export function reputacaoSuprema(character: Character, nome: string): number {
  return character.reputacaoSupremas?.[nome] ?? 0;
}

function sinal(valor: number): string {
  return valor > 0 ? `+${valor}` : `${valor}`;
}

/** Retorna a mensagem da mudança (ou null se `nome` não for uma Seita Suprema). */
export function ajustarReputacaoSuprema(character: Character, nome: string, delta: number): string | null {
  if (!delta || !SUPREMAS.some((s) => s.nome === nome)) return null;
  const valor = Math.max(-100, Math.min(100, Math.round(reputacaoSuprema(character, nome) + delta)));
  character.reputacaoSupremas = { ...(character.reputacaoSupremas ?? {}), [nome]: valor };
  return `Reputação com a ${nome} ${sinal(Math.round(delta))} (${nivelReputacao(valor)}).`;
}

export function supremasDaRegiao(regiao: RegiaoId): SupremaInfo[] {
  return SUPREMAS.filter((s) => s.regiao === regiao);
}

/**
 * As Supremas da região observam o caminho que você segue: atos justos agradam as ortodoxas e
 * irritam a demoníaca, e vice-versa. Só avisa quando o nível muda.
 */
export function repercutirAlinhamento(character: Character, delta: number): string[] {
  const variacao = Math.round(delta * 0.3);
  if (!variacao) return [];
  const mensagens: string[] = [];
  for (const s of supremasDaRegiao(character.local.regiao)) {
    const antes = nivelReputacao(reputacaoSuprema(character, s.nome));
    ajustarReputacaoSuprema(character, s.nome, s.ortodoxa ? variacao : -variacao);
    const depois = nivelReputacao(reputacaoSuprema(character, s.nome));
    if (antes !== depois) mensagens.push(`A ${s.nome} agora vê você como ${depois.toLowerCase()}.`);
  }
  return mensagens;
}

/** A Suprema da região mais hostil a você (≤ −50), se houver. */
export function supremaHostil(character: Character): SupremaInfo | undefined {
  return supremasDaRegiao(character.local.regiao)
    .filter((s) => reputacaoSuprema(character, s.nome) <= HOSTIL)
    .sort((a, b) => reputacaoSuprema(character, a.nome) - reputacaoSuprema(character, b.nome))[0];
}

/** A Suprema que organiza a Torre de Prova e o Torneio Regional (a primeira da região). */
export function supremaAnfitria(regiao: RegiaoId): SupremaInfo | undefined {
  return supremasDaRegiao(regiao)[0];
}

export function bloqueioSupremaAnfitria(character: Character): string | null {
  const anfitria = supremaAnfitria(character.local.regiao);
  if (!anfitria || reputacaoSuprema(character, anfitria.nome) > HOSTIL) return null;
  return `A ${anfitria.nome}, que protege este lugar, proibiu sua entrada (reputação Hostil).`;
}

/** Multiplicador de preços no Mercado, pela média da sua reputação com as Supremas da região. */
export function fatorPrecoSupremas(character: Character): number {
  const supremas = supremasDaRegiao(character.local.regiao);
  if (!supremas.length) return 1;
  const media = supremas.reduce((soma, s) => soma + reputacaoSuprema(character, s.nome), 0) / supremas.length;
  const fator: Record<NivelReputacao, number> = { Hostil: 1.2, Desconfiada: 1.08, Neutra: 1, 'Favorável': 0.97, Aliada: 0.94 };
  return fator[nivelReputacao(media)];
}

/**
 * A cada estação: discípulos de uma Suprema ganham a confiança dela aos poucos, e a facção que você
 * fundou paga tributo às Supremas da região (GDD 9). Sem pedras para o tributo, elas se irritam.
 */
export function processarSupremas(character: Character, estacoes: number): string[] {
  const mensagens: string[] = [];
  const afiliacao = character.afiliacao;
  if (afiliacao.tipo === 'seita-suprema' && reputacaoSuprema(character, afiliacao.nome) < 60) {
    ajustarReputacaoSuprema(character, afiliacao.nome, estacoes);
  }
  if (!character.faccao) return mensagens;
  const acumulado = Number(character.flags.estacoesTributo ?? 0) + estacoes;
  character.flags.estacoesTributo = acumulado % ESTACOES_TRIBUTO;
  if (acumulado < ESTACOES_TRIBUTO) return mensagens;
  const supremas = supremasDaRegiao(character.local.regiao);
  if (!supremas.length) return mensagens;
  const tributo = Math.ceil(character.faccao.membros * 0.5);
  if (character.inventario.pedrasEspirituais >= tributo) {
    character.inventario.pedrasEspirituais -= tributo;
    for (const s of supremas) ajustarReputacaoSuprema(character, s.nome, 3);
    mensagens.push(`Tributo anual às Seitas Supremas da região: −${tributo} pedras. Elas lembram de quem paga em dia.`);
  } else {
    for (const s of supremas) ajustarReputacaoSuprema(character, s.nome, -10);
    mensagens.push(`Sem pedras para o tributo anual (${tributo}), a ${character.faccao.nome} deve às Seitas Supremas. Elas não esquecem.`);
  }
  return mensagens;
}
