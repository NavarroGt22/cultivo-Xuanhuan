import { REINOS, poderDoReino } from './cultivation';
import { Combatente } from './combat';
import { getDerivedStats } from './stats';
import { ATTRIBUTE_KEYS, Attributes } from './attributes';
import { estagiosDoRank, faixaBesta } from './npcs';

/** Besta Espiritual ligada por Contrato de Alma (GDD 10). Cultiva sozinha e também junto do domador. */
export interface Companheira {
  nome: string;
  especie: string;
  rank: number;
  estagio: number;
  /** 0–100 até o próximo estágio. */
  progresso: number;
  /** Força base da espécie, na mesma escala dos atributos do jogador. */
  atributoMedio: number;
  /** 0–100. Vínculo alto = cresce mais rápido e luta melhor. */
  vinculo: number;
  /** Idade em anos (desde o contrato ou nascimento). */
  idade: number;
  /** Vínculo de Nascença (família de domadores): teto de sincronia mais alto, permite a Técnica de Fusão. */
  deInfancia: boolean;
  /** GDD 12: conjunta acompanha o seu rank; independente cultiva no próprio ritmo e pode te ultrapassar. */
  modoEvolucao: 'conjunta' | 'independente';
}

export const SINCRONIA_ATAQUE_COMBINADO = 60;
export const SINCRONIA_FUSAO = 100;

export interface ConfigSincronia {
  ganhoPorRodada: number;
  teto: number;
}

/** Só o Vínculo de Nascença (ou um vínculo perfeito) alcança o teto da Técnica de Fusão. */
export function configSincronia(c: Companheira): ConfigSincronia {
  return {
    ganhoPorRodada: 10 + c.vinculo / 10,
    teto: c.deInfancia || c.vinculo >= 95 ? SINCRONIA_FUSAO : 90,
  };
}

const NOMES_BESTA = ['Brasa', 'Névoa', 'Trovão', 'Lua', 'Sombra', 'Jade', 'Garra', 'Vento', 'Presa', 'Aurora'];

export function criarCompanheira(especie: string, rank: number, estagio: number, atributoMedio: number, deInfancia = false): Companheira {
  return {
    nome: NOMES_BESTA[Math.floor(Math.random() * NOMES_BESTA.length)],
    especie,
    rank,
    estagio,
    progresso: 0,
    atributoMedio,
    vinculo: deInfancia ? 60 : 30,
    idade: 0,
    deInfancia,
    modoEvolucao: deInfancia ? 'conjunta' : 'independente',
  };
}

export function descreverCompanheira(c: Companheira): string {
  return `${c.nome}, ${c.especie} — ${faixaBesta(c.rank)} · ${REINOS[c.rank - 1]?.nome ?? '?'} — Estágio ${c.estagio} · Vínculo ${Math.round(c.vinculo)} · Evolução ${c.modoEvolucao}`;
}

export function alternarModoEvolucao(c: Companheira): string {
  c.modoEvolucao = c.modoEvolucao === 'conjunta' ? 'independente' : 'conjunta';
  return c.modoEvolucao === 'conjunta'
    ? `${c.nome} agora evolui junto com você: o reino dela acompanha o seu.`
    : `${c.nome} agora cultiva no próprio ritmo — pode ficar para trás, ou te ultrapassar.`;
}

/** Evolução Conjunta: a besta acompanha o rank e o estágio do domador (nunca passa dele). */
export function acompanharDomador(c: Companheira, rank: number, estagio: number): string[] {
  if (c.rank === rank && c.estagio === estagio) return [];
  const subiuRank = rank > c.rank;
  c.rank = rank;
  c.estagio = estagio;
  c.progresso = 0;
  return subiuRank ? [`${c.nome} rompe de reino junto com você: ${REINOS[rank - 1]?.nome}.`] : [];
}

/** Cultivo da besta; em cada nova faixa (rank 4, 7, 10) ela evolui de forma. */
export function aplicarProgressoCompanheira(c: Companheira, pontos: number): string[] {
  const mensagens: string[] = [];
  const faixaAntes = faixaBesta(c.rank);
  c.progresso += pontos / Math.pow(1.8, c.rank - 1);

  while (c.progresso >= 100) {
    c.progresso -= 100;
    c.estagio += 1;
    if (c.estagio > estagiosDoRank(c.rank)) {
      c.rank += 1;
      c.estagio = 1;
      c.atributoMedio += 1;
      mensagens.push(`${c.nome} rompeu para o ${REINOS[c.rank - 1]?.nome ?? 'próximo reino'}!`);
    } else {
      mensagens.push(`${c.nome} avançou para o Estágio ${c.estagio}.`);
    }
  }

  const faixaDepois = faixaBesta(c.rank);
  if (faixaDepois !== faixaAntes) {
    mensagens.push(`${c.nome} evoluiu: agora é uma ${faixaDepois}!${faixaDepois === 'Besta Demoníaca' ? ' Às vezes, ela assume uma forma quase humana.' : ''}`);
  }
  return mensagens;
}

/**
 * Crescimento por estação: separado (sozinha) + um bônus do nível de Domador.
 * O vínculo multiplica tudo — domadores fracos podem ter bestas fortíssimas se o vínculo for genuíno.
 */
export function crescimentoPassivo(c: Companheira, nivelDomador: number, meses: number, rankDomador: number, estagioDomador: number): string[] {
  c.idade += meses / 12;
  c.vinculo = Math.max(0, c.vinculo - 0.5 * (meses / 3));
  if (c.modoEvolucao === 'conjunta') return acompanharDomador(c, rankDomador, estagioDomador);

  const mensagens: string[] = [];
  const estacoes = Math.max(1, Math.round(meses / 3));
  if (Math.random() < 1 - Math.pow(0.996, estacoes)) {
    c.atributoMedio += 2;
    mensagens.push(`${c.nome} voltou de uma caçada solitária com o focinho brilhando: comeu um fruto espiritual raro e ficou mais forte!`);
  }
  const pontos = meses * 1.5 * (0.5 + c.vinculo / 100) * (1 + nivelDomador * 0.25);
  return [...mensagens, ...aplicarProgressoCompanheira(c, pontos)];
}

function atributosDaBesta(c: Companheira): Attributes {
  const pesos: Record<keyof Attributes, number> = {
    forca: 1.25,
    destreza: 1.0,
    inteligencia: 0.5,
    constituicao: 1.25,
    espirito: 0.8,
    sorte: 0.7,
  };
  const atributos = {} as Attributes;
  for (const chave of ATTRIBUTE_KEYS) atributos[chave] = Math.max(1, Math.round(c.atributoMedio * pesos[chave]));
  return atributos;
}

/** Vínculo alto faz a besta lutar com mais vontade (de 40% a 85% do dano cheio). */
export function combatenteDaCompanheira(c: Companheira): Combatente {
  const atributos = atributosDaBesta(c);
  const stats = getDerivedStats(atributos, null, { rank: c.rank, estagio: c.estagio, progresso: 0, toxina: 0 });
  const vontade = 0.4 + (c.vinculo / 100) * 0.45;
  return {
    nome: c.nome,
    vida: Math.round(stats.vida * 0.7),
    vidaMax: Math.round(stats.vida * 0.7),
    ataque: Math.round(stats.ataque * vontade),
    tecnica: 0,
    defesa: stats.defesa,
    esquiva: stats.esquiva,
    critico: stats.critico,
    precisao: atributos.inteligencia,
    velocidade: atributos.destreza,
    chakra: 0,
    escudo: 0,
    furia: 1,
  };
}

export function poderCompanheira(c: Companheira): number {
  return poderDoReino({ rank: c.rank, estagio: c.estagio, progresso: 0, toxina: 0 }) * c.atributoMedio;
}
