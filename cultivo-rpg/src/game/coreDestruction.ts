import type { Character } from './character';
import { alterarVidaPercentual } from './character';
import { shiftAlignment } from './alignment';
import type { Relacao } from './relationships';

/**
 * GDD 13 — O Duelo Demoníaco: destruir o núcleo do derrotado em vez de matá-lo.
 * A vítima vira mortal para sempre; quem faz fica exposto, cai para o caminho demoníaco
 * e ganha um Inimigo Jurado — normalmente o clã/seita inteiro da vítima.
 */
export function motivoBloqueioDestruirNucleo(character: Character, rankVitima: number, estagioVitima: number): string | null {
  const { rank, estagio } = character.cultivo;
  if (rank < rankVitima || (rank === rankVitima && estagio < estagioVitima)) {
    return 'Exige vantagem de cultivo sobre o oponente';
  }
  return null;
}

/**
 * A família/clã da vítima tem um Patriarca mais forte que ela.
 * Esse é o poder da rixa: é contra ele que você terá de lutar para acabar com ela.
 */
export function rankDoPatriarca(rankVitima: number): number {
  return Math.min(10, Math.max(2, rankVitima + 2));
}

export function destruirNucleo(character: Character, nomeVitima: string, afiliacaoVitima: string, rankVitima = character.cultivo.rank): string[] {
  const mensagens = [`Você crava a palma no dantian de ${nomeVitima} e sente o núcleo dele se estilhaçar. Ele nunca mais vai cultivar.`];

  character.alinhamento = shiftAlignment(character.alinhamento, -25);
  character.reputacao += 3;
  alterarVidaPercentual(character, -15, 1);
  mensagens.push('Alinhamento −25. Você ficou exposto durante o golpe e se feriu.');

  const inimigo: Relacao = {
    id: Math.random().toString(36).slice(2, 10),
    nome: afiliacaoVitima && afiliacaoVitima !== 'Cultivador errante' ? `${afiliacaoVitima} (por ${nomeVitima})` : `Família de ${nomeVitima}`,
    tipo: 'Inimigo Jurado',
    idade: 0,
    rank: rankDoPatriarca(rankVitima),
    estagio: 5,
    aparencia: 0,
    inteligencia: 0,
    compatibilidadeElemental: 0,
    relacao: 0,
  };
  character.relacoes.push(inimigo);
  mensagens.push(`Inimigo Jurado: ${inimigo.nome} jurou vingança.`);

  const afiliacao = character.afiliacao;
  if ((afiliacao.tipo === 'seita' || afiliacao.tipo === 'seita-suprema') && afiliacao.ortodoxa) {
    mensagens.push(`Destruir um núcleo é tabu para a ${afiliacao.nome}. Você foi expulso!`);
    character.afiliacao = { tipo: 'nenhuma', nome: 'Sem vínculo', ortodoxa: true, posto: 'Expulso', estipendio: 0 };
    character.contribuicao = 0;
  }

  return mensagens;
}

export function inimigosJurados(character: Character): Relacao[] {
  return character.relacoes.filter((r) => r.tipo === 'Inimigo Jurado');
}
