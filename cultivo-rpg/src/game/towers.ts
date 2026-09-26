import type { Character } from './character';
import type { StoryChoice } from './story';
import type { Efeitos } from './effects';
import { ArquetipoInimigo, gerarInimigo } from './combat';
import { estagiosDoRank, descreverCultivo } from './npcs';
import { REGIOES, RegiaoId } from './world';
import { TECNICAS, idManual } from './techniques';
import { MundoState } from './worldState';
import { escolher } from './rng';

/** GDD 14.1 — Torres de Prova: cada andar testa algo diferente e fica mais difícil. */
export interface Torre {
  regiao: RegiaoId;
  nome: string;
  andares: number;
  /** Rank equivalente do último andar. */
  rankTopo: number;
  /** A Torre das Mil Provas: andares altos viram notícia continental. */
  prestigiosa: boolean;
}

export const TORRES: Record<RegiaoId, Torre> = {
  central: { regiao: 'central', nome: 'Torre das Mil Provas', andares: 60, rankTopo: 7, prestigiosa: true },
  norte: { regiao: 'norte', nome: 'Torre da Geleira Silenciosa', andares: 30, rankTopo: 5, prestigiosa: false },
  sul: { regiao: 'sul', nome: 'Pagode das Chamas Adormecidas', andares: 25, rankTopo: 4, prestigiosa: false },
  leste: { regiao: 'leste', nome: 'Torre do Mar de Névoa', andares: 20, rankTopo: 4, prestigiosa: false },
  oeste: { regiao: 'oeste', nome: 'Pagode da Areia Eterna', andares: 20, rankTopo: 3, prestigiosa: false },
};

export const ENERGIA_ANDAR = 1;

export type TipoAndar = 'combate' | 'compreensao' | 'alma' | 'guardiao';

export const NOME_TIPO_ANDAR: Record<TipoAndar, string> = {
  combate: 'Prova de Combate',
  compreensao: 'Prova de Compreensão (inscrições)',
  alma: 'Prova da Alma',
  guardiao: 'Guardião do Andar',
};

export function tipoDoAndar(andar: number): TipoAndar {
  if (andar % 10 === 0) return 'guardiao';
  if (andar % 3 === 0) return 'compreensao';
  if (andar % 3 === 2) return 'alma';
  return 'combate';
}

export function cultivoDoAndar(torre: Torre, andar: number): { rank: number; estagio: number } {
  const fracao = (andar - 1) / Math.max(1, torre.andares - 1);
  const total = fracao * (torre.rankTopo - 1) * 9;
  const rank = 1 + Math.floor(total / 9);
  const estagio = Math.min(estagiosDoRank(rank), 1 + Math.floor(total % 9));
  return { rank, estagio };
}

export function andarAtual(mundo: MundoState, regiao: RegiaoId): number {
  return mundo.torres[regiao] ?? 0;
}

function recompensaDoAndar(character: Character, torre: Torre, andar: number): { efeitos: Efeitos; texto: string } {
  const fator = REGIOES[torre.regiao].fatorPoder;
  const efeitos: Efeitos = { pedras: Math.round((2 + andar * 1.5) * fator) };
  const partes = [`${efeitos.pedras} pedras`];

  if (andar % 5 === 0) {
    efeitos.itens = [andar >= 20 ? { id: 'pilula-dourada', quantidade: 1 } : { id: 'pilula-chakra', quantidade: 2 }];
    partes.push(andar >= 20 ? 'Pílula Dourada' : '2 Pílulas de Chakra');
  }
  if (andar % 10 === 0) {
    const grauMax = Math.min(4, Math.ceil(andar / 10));
    const manuais = TECNICAS.filter((t) => t.grau <= grauMax && !t.heranca && t.categoria !== 'proibida' && !character.tecnicas.includes(t.id));
    if (manuais.length) {
      const manual = escolher(manuais);
      efeitos.itens = [...(efeitos.itens ?? []), { id: idManual(manual.id), quantidade: 1 }];
      partes.push(`manual ${manual.nome}`);
    }
    efeitos.reputacao = torre.prestigiosa ? andar : 3;
    partes.push(torre.prestigiosa ? `+${andar} de reputação (notícia continental!)` : '+3 de reputação');
  }
  return { efeitos, texto: partes.join(', ') };
}

/** Uma tentativa de subir um andar. A recompensa só vem na primeira vez que o andar é superado. */
export function escolhaDoAndar(character: Character, torre: Torre, andar: number): StoryChoice {
  const tipo = tipoDoAndar(andar);
  const { rank, estagio } = cultivoDoAndar(torre, andar);
  const recompensa = recompensaDoAndar(character, torre, andar);
  const fracao = andar / torre.andares;
  const vitoria = { texto: `Você supera o ${andar}º andar! Recompensa: ${recompensa.texto}.`, efeitos: recompensa.efeitos };

  if (tipo === 'combate' || tipo === 'guardiao') {
    const arquetipo = escolher<ArquetipoInimigo>(['guerreiro', 'agil', 'mistico', 'besta']);
    const media = (7 + rank * 1.2 + fracao * 3) * (tipo === 'guardiao' ? 1.2 : 1);
    return {
      texto: `${NOME_TIPO_ANDAR[tipo]} — ${descreverCultivo(rank, estagio)}`,
      combate: gerarInimigo(tipo === 'guardiao' ? `Guardião do ${andar}º Andar` : `Eco de Prova do ${andar}º Andar`, arquetipo, media, rank, estagio),
      resultado: vitoria,
      falha: { texto: 'A torre te expulsa do andar. Você pode tentar de novo quando estiver pronto.' },
    };
  }

  const dificuldade = 11 + Math.round(fracao * 16) + (rank - 1);
  return {
    texto: `${NOME_TIPO_ANDAR[tipo]} — dificuldade ${dificuldade}`,
    teste: { atributo: tipo === 'compreensao' ? 'inteligencia' : 'espirito', dificuldade },
    resultado: vitoria,
    falha: {
      texto: tipo === 'compreensao' ? 'As inscrições do andar se reorganizam e te lançam para fora.' : 'A pressão de alma do andar esmaga sua consciência por um instante.',
      efeitos: { danoPercentual: 20 },
    },
  };
}
