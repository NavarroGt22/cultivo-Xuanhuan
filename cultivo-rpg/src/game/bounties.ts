import { ATTRIBUTE_KEYS } from './attributes';
import { Character, getEffectiveAttributes } from './character';
import type { StoryChoice } from './story';
import type { Efeitos } from './effects';
import { InimigoDef, gerarInimigo } from './combat';
import { descreverCultivo, estagiosDoRank, faixaBesta, inimigoDoNpc, poderNpc } from './npcs';
import { MundoState, npcsDaRegiao } from './worldState';
import { REGIOES } from './world';
import { escolher, inteiro } from './rng';
import { produtoDaRegiao } from './trade';

/** Custo de energia de uma missão do quadro. */
export const ENERGIA_MISSAO = 2;
const ESTACOES_POR_QUADRO = 4;

export interface MissaoQuadro {
  id: string;
  titulo: string;
  descricao: string;
  /** Reino da besta ou do rival, para mostrar na lista. */
  cultivo: string;
  inimigo: InimigoDef;
  recompensa: Efeitos;
  letal: boolean;
  /** Duelos: NPC do ranking (para o Duelo Demoníaco poder aleijar o cultivo dele). */
  npcId?: string;
  npcAfiliacao?: string;
}

function media(character: Character): number {
  const atributos = getEffectiveAttributes(character);
  return ATTRIBUTE_KEYS.reduce((soma, chave) => soma + atributos[chave], 0) / ATTRIBUTE_KEYS.length;
}

/** Inimigos do quadro acompanham as técnicas que você domina, como os dos eventos. */
function mediaInimigo(character: Character): number {
  return media(character) * (1 + character.tecnicas.length * 0.04) * (character.companheira ? 1.25 : 1);
}

function pedras(character: Character, base: number): number {
  return Math.round(base * REGIOES[character.local.regiao].fatorPoder * (1 + (character.cultivo.rank - 1) * 1.5));
}

function missaoBesta(character: Character, dificuldade: number): MissaoQuadro {
  const { rank, estagio } = character.cultivo;
  const estagioBesta = Math.max(1, Math.min(estagiosDoRank(rank), estagio + dificuldade));
  const nome = escolher(REGIOES[character.local.regiao].fauna);
  const forca = [0.9, 1.05, 1.2][dificuldade] ?? 1;
  return {
    id: Math.random().toString(36).slice(2, 10),
    titulo: `Caçar: ${nome}`,
    descricao: `Uma ${nome} está atacando viajantes perto de ${character.local.cidade}. A guilda de caçadores paga pela cabeça dela.`,
    cultivo: `${faixaBesta(rank)} — equivalente a ${descreverCultivo(rank, estagioBesta)}`,
    inimigo: gerarInimigo(nome, 'besta', mediaInimigo(character) * forca, rank, estagioBesta),
    recompensa: { pedras: pedras(character, 5 + dificuldade * 4), reputacao: 3 + dificuldade * 2, itens: [{ id: 'nucleo-besta', quantidade: 1 + dificuldade }] },
    letal: false,
  };
}

/** Um duelo contra um cultivador da região com poder parecido com o seu. */
function missaoDuelo(character: Character, mundo: MundoState): MissaoQuadro | null {
  const meuPoder = poderNpc({ rank: character.cultivo.rank, estagio: character.cultivo.estagio, atributoMedio: media(character) });
  const candidatos = npcsDaRegiao(mundo, character.local.regiao)
    .filter((npc) => poderNpc(npc) > meuPoder * 1.0 && poderNpc(npc) < meuPoder * 1.6)
    .sort((a, b) => poderNpc(a) - poderNpc(b));
  if (candidatos.length === 0) return null;
  const npc = escolher(candidatos);
  return {
    id: Math.random().toString(36).slice(2, 10),
    titulo: `Duelo: ${npc.nome}`,
    descricao: `${npc.nome}, de ${npc.afiliacao}, desafiou publicamente qualquer cultivador do seu nível. Vencer sobe seu nome no ranking de força.`,
    cultivo: descreverCultivo(npc.rank, npc.estagio),
    inimigo: inimigoDoNpc(npc),
    recompensa: { reputacao: 8, pedras: pedras(character, 6) },
    letal: false,
    npcId: npc.id,
    npcAfiliacao: npc.afiliacao,
  };
}

/** O núcleo destruído transforma o cultivador em mortal comum. */
export function aleijarNpc(npc: { rank: number; estagio: number; atributoMedio: number }): void {
  npc.rank = 1;
  npc.estagio = 1;
  npc.atributoMedio = Math.min(npc.atributoMedio, 5);
}

/** GDD 14.4: escoltar uma caravana de produtos regionais contra saqueadores. */
function missaoEscolta(character: Character): MissaoQuadro {
  const produto = produtoDaRegiao(character.local.regiao);
  const { rank, estagio } = character.cultivo;
  const destinos = Object.values(REGIOES).filter((r) => r.id !== character.local.regiao);
  const destino = escolher(destinos);
  return {
    id: Math.random().toString(36).slice(2, 10),
    titulo: `Escolta: caravana para ${destino.preposicao === 'na' ? 'a' : 'o'} ${destino.nome}`,
    descricao: `Uma caravana de ${produto.nome} parte de ${character.local.cidade}. Salteadores sempre atacam no desfiladeiro. O mercador paga em pedras e em mercadoria.`,
    cultivo: `Líder dos salteadores — ${descreverCultivo(rank, estagio)}`,
    inimigo: gerarInimigo('Líder dos Salteadores', 'guerreiro', mediaInimigo(character) * 1.0, rank, estagio),
    recompensa: { pedras: pedras(character, 6), reputacao: 3, itens: [{ id: produto.id, quantidade: 2 }] },
    letal: false,
  };
}

/** Renova o quadro a cada 4 estações; missões concluídas saem do quadro. */
export function atualizarQuadro(mundo: MundoState, character: Character, turno: number): void {
  if (turno - mundo.quadroTurno < ESTACOES_POR_QUADRO && mundo.quadro.length > 0) return;
  const quadro = [missaoBesta(character, 0), missaoBesta(character, inteiro(1, 2)), missaoEscolta(character)];
  const duelo = missaoDuelo(character, mundo);
  if (duelo) quadro.push(duelo);
  mundo.quadro = quadro;
  mundo.quadroTurno = turno;
}

export function escolhaDaMissao(missao: MissaoQuadro): StoryChoice {
  return {
    texto: missao.titulo,
    combate: { ...missao.inimigo, letal: missao.letal },
    resultado: { texto: 'Missão cumprida. A recompensa é sua.', efeitos: missao.recompensa },
    falha: { texto: 'Você recua ferido. A missão continua no quadro.' },
  };
}
