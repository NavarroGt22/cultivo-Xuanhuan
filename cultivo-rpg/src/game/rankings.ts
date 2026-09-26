import { ATTRIBUTE_KEYS } from './attributes';
import { Character, getEffectiveAttributes, idadeAnos } from './character';
import { Npc, descreverCultivo, poderNpc } from './npcs';
import { PROFISSAO_INFO, tituloProfissao } from './professions';
import { MundoState, npcsDaRegiao } from './worldState';

export type TipoRanking = 'forca' | 'talento' | 'alquimia';

export interface EntradaRanking {
  nome: string;
  detalhe: string;
  afiliacao: string;
  valor: number;
  jogador: boolean;
  npc?: Npc;
}

export const TITULO_RANKING: Record<TipoRanking, string> = {
  forca: 'Cultivadores mais fortes',
  talento: 'Maiores talentos (até 40 anos)',
  alquimia: 'Melhores alquimistas',
};

function mediaAtributos(character: Character): number {
  const atributos = getEffectiveAttributes(character);
  return ATTRIBUTE_KEYS.reduce((soma, chave) => soma + atributos[chave], 0) / ATTRIBUTE_KEYS.length;
}

/** Talento = cultivo alcançado em relação à idade + grau da raiz. */
function pontuacaoTalento(rank: number, estagio: number, raizGrau: number, idade: number): number {
  return (((rank - 1) * 9 + estagio) * 10) / Math.max(12, idade) + raizGrau;
}

function entradaJogador(character: Character, tipo: TipoRanking): EntradaRanking | null {
  const { rank, estagio } = character.cultivo;
  const idade = idadeAnos(character);
  const afiliacao = character.afiliacao.nome;

  if (tipo === 'forca') {
    const valor = poderNpc({ rank, estagio, atributoMedio: mediaAtributos(character) });
    return { nome: `${character.nome} (você)`, detalhe: descreverCultivo(rank, estagio), afiliacao, valor, jogador: true };
  }
  if (tipo === 'talento') {
    if (idade > 40 || !character.flags.raizRevelada) return null;
    const valor = pontuacaoTalento(rank, estagio, character.raizEspiritual.grau, idade);
    return { nome: `${character.nome} (você)`, detalhe: `${descreverCultivo(rank, estagio)} aos ${idade} anos`, afiliacao, valor, jogador: true };
  }
  const estado = character.profissoes.alquimia;
  if (estado.nivel === 0) return null;
  return {
    nome: `${character.nome} (você)`,
    detalhe: tituloProfissao('alquimia', estado) ?? '',
    afiliacao,
    valor: estado.nivel * 100 + estado.xp / 10,
    jogador: true,
  };
}

function entradaNpc(npc: Npc, tipo: TipoRanking): EntradaRanking | null {
  if (tipo === 'forca') {
    return { nome: npc.nome, detalhe: descreverCultivo(npc.rank, npc.estagio), afiliacao: npc.afiliacao, valor: poderNpc(npc), jogador: false, npc };
  }
  if (tipo === 'talento') {
    if (npc.idade > 40) return null;
    return {
      nome: npc.nome,
      detalhe: `${descreverCultivo(npc.rank, npc.estagio)} aos ${Math.floor(npc.idade)} anos`,
      afiliacao: npc.afiliacao,
      valor: pontuacaoTalento(npc.rank, npc.estagio, npc.raizGrau, npc.idade),
      jogador: false,
      npc,
    };
  }
  if (npc.alquimia === 0) return null;
  return {
    nome: npc.nome,
    detalhe: PROFISSAO_INFO.alquimia.titulos[npc.alquimia - 1],
    afiliacao: npc.afiliacao,
    valor: npc.alquimia * 100,
    jogador: false,
    npc,
  };
}

export function ranking(mundo: MundoState, character: Character, tipo: TipoRanking): EntradaRanking[] {
  const entradas = npcsDaRegiao(mundo, character.local.regiao)
    .map((npc) => entradaNpc(npc, tipo))
    .filter((e): e is EntradaRanking => e !== null);
  const jogador = entradaJogador(character, tipo);
  if (jogador) entradas.push(jogador);
  return entradas.sort((a, b) => b.valor - a.valor);
}

/** 1 = primeiro lugar; 0 = fora do ranking. */
export function posicaoJogador(mundo: MundoState, character: Character, tipo: TipoRanking): number {
  return ranking(mundo, character, tipo).findIndex((e) => e.jogador) + 1;
}
