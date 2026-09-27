import { REINOS, poderDoReino } from './cultivation';
import { Combatente } from './combat';
import { getDerivedStats } from './stats';
import { ATTRIBUTE_KEYS, Attributes } from './attributes';
import { estagiosDoRank } from './npcs';
import {
  EspecieBesta,
  FATOR_FASE,
  FaseBesta,
  LINHAGENS,
  Linhagem,
  especieDoNome,
  faseDaIdade,
  getEspecie,
  rankMaximoDaFase,
  rankNascimento,
  rankSelvagem,
} from './bestiary';

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
  /** Id em ESPECIES (bestiary.ts). Saves antigos são identificados pelo nome da espécie. */
  especieId?: string;
}

export function especieDaCompanheira(c: Companheira): EspecieBesta | undefined {
  return getEspecie(c.especieId) ?? especieDoNome(c.especie);
}

export function faseDaCompanheira(c: Companheira): FaseBesta {
  return faseDaIdade(especieDaCompanheira(c), c.idade);
}

export function tetoDeReino(c: Companheira): number {
  return rankMaximoDaFase(especieDaCompanheira(c), faseDaCompanheira(c));
}

export function linhagemDaCompanheira(c: Companheira): Linhagem {
  return especieDaCompanheira(c)?.linhagem ?? 'Espiritual';
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

export function criarCompanheira(
  especie: string,
  rank: number,
  estagio: number,
  atributoMedio: number,
  deInfancia = false,
  extra: { especieId?: string; idade?: number } = {},
): Companheira {
  return {
    nome: NOMES_BESTA[Math.floor(Math.random() * NOMES_BESTA.length)],
    especie,
    rank,
    estagio,
    progresso: 0,
    atributoMedio,
    vinculo: deInfancia ? 60 : 30,
    idade: extra.idade ?? 0,
    deInfancia,
    modoEvolucao: deInfancia ? 'conjunta' : 'independente',
    especieId: extra.especieId,
  };
}

/** Uma besta recém-nascida (ou saída do ovo): o reino vem da linhagem, não do domador. */
export function filhoteDaEspecie(especie: EspecieBesta, atributoMedio: number, deInfancia: boolean): Companheira {
  return criarCompanheira(especie.nome, rankNascimento(especie), 1, atributoMedio, deInfancia, { especieId: especie.id, idade: 0 });
}

/** Uma besta selvagem adulta domada: o reino fica dentro da faixa da espécie. */
export function adultaDaEspecie(especie: EspecieBesta, rankDesejado: number, estagio: number, atributoMedio: number): Companheira {
  const rank = rankSelvagem(especie, rankDesejado);
  return criarCompanheira(especie.nome, rank, rank === rankDesejado ? estagio : 1, atributoMedio, false, {
    especieId: especie.id,
    idade: especie.maturidade * (1 + Math.random()),
  });
}

export function descreverCompanheira(c: Companheira): string {
  return `${c.nome}, ${c.especie} — Linhagem ${linhagemDaCompanheira(c)} · ${faseDaCompanheira(c)} · ${REINOS[c.rank - 1]?.nome ?? '?'} — Estágio ${c.estagio} · Vínculo ${Math.round(c.vinculo)} · Evolução ${c.modoEvolucao}`;
}

export function alternarModoEvolucao(c: Companheira): string {
  c.modoEvolucao = c.modoEvolucao === 'conjunta' ? 'independente' : 'conjunta';
  return c.modoEvolucao === 'conjunta'
    ? `${c.nome} agora evolui junto com você: sobe de reino quando você sobe, até o limite da idade dela.`
    : `${c.nome} agora cultiva no próprio ritmo — pode ficar para trás, ou te ultrapassar.`;
}

/**
 * Evolução Conjunta: quando você rompe um reino, a besta sobe junto — até o teto da fase de vida dela.
 * Uma besta de linhagem superior à sua não é puxada para baixo.
 */
export function acompanharDomador(c: Companheira, rank: number, estagio: number): string[] {
  const alvo = Math.min(rank, tetoDeReino(c));
  if (alvo < c.rank || (alvo === c.rank && (rank > alvo || c.estagio >= estagio))) return [];
  const subiuRank = alvo > c.rank;
  c.rank = alvo;
  c.estagio = alvo === rank ? estagio : 1;
  c.progresso = 0;
  return subiuRank ? [`${c.nome} rompe de reino junto com você: ${REINOS[alvo - 1]?.nome}.`] : [];
}

/** Cultivo da besta: a linhagem dita o ritmo e a fase de vida dita o teto. */
export function aplicarProgressoCompanheira(c: Companheira, pontos: number): string[] {
  const mensagens: string[] = [];
  const teto = tetoDeReino(c);
  c.progresso += (pontos * LINHAGENS[linhagemDaCompanheira(c)].ritmo) / Math.pow(1.8, c.rank - 1);

  while (c.progresso >= 100) {
    const ultimoEstagio = c.estagio >= estagiosDoRank(c.rank);
    if (ultimoEstagio && c.rank >= teto) {
      c.progresso = 99;
      break;
    }
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
  return mensagens;
}

const TEXTO_FASE: Record<FaseBesta, string> = {
  Filhote: '',
  Jovem: 'deixou de ser filhote: agora é uma besta jovem, e já consegue romper reinos.',
  Adulta: 'chegou à idade adulta! A força da linhagem desperta por inteiro.',
  Anciã: 'tornou-se uma besta anciã. Poucas da espécie vivem tanto — e ela ainda pode ir além do limite da espécie.',
};

/**
 * Crescimento por estação: separado (sozinha) + um bônus do nível de Domador.
 * O vínculo multiplica tudo — domadores fracos podem ter bestas fortíssimas se o vínculo for genuíno.
 */
export function crescimentoPassivo(c: Companheira, nivelDomador: number, meses: number, rankDomador: number, estagioDomador: number): string[] {
  const faseAntes = faseDaCompanheira(c);
  c.idade += meses / 12;
  c.vinculo = Math.max(0, c.vinculo - 0.5 * (meses / 3));
  const mensagens: string[] = [];
  const faseDepois = faseDaCompanheira(c);
  if (faseDepois !== faseAntes) {
    c.atributoMedio += 1;
    mensagens.push(`${c.nome} ${TEXTO_FASE[faseDepois]}`);
  }
  if (c.modoEvolucao === 'conjunta') return [...mensagens, ...acompanharDomador(c, rankDomador, estagioDomador)];

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
  const fase = FATOR_FASE[faseDaCompanheira(c)];
  return {
    nome: c.nome,
    vida: Math.round(stats.vida * 0.7 * fase),
    vidaMax: Math.round(stats.vida * 0.7 * fase),
    ataque: Math.round(stats.ataque * vontade * fase),
    tecnica: 0,
    defesa: Math.round(stats.defesa * fase),
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
  return poderDoReino({ rank: c.rank, estagio: c.estagio, progresso: 0, toxina: 0 }) * c.atributoMedio * FATOR_FASE[faseDaCompanheira(c)];
}
