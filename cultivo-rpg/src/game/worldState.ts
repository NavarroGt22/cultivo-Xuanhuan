import type { Character } from './character';
import { Npc, envelhecerNpcs, gerarNpcsRegiao } from './npcs';
import { SeitaRoster, envelhecerRoster, gerarRoster } from './sectRoster';
import { ehDiscipulo } from './sect';
import { RegiaoId } from './world';
import type { MissaoQuadro } from './bounties';

/** Tudo do mundo que precisa persistir entre sessões. */
export interface MundoState {
  npcsPorRegiao: Partial<Record<RegiaoId, Npc[]>>;
  seitas: Record<string, SeitaRoster>;
  quadro: MissaoQuadro[];
  /** Turno em que o quadro de missões foi gerado. */
  quadroTurno: number;
  campanhaResgatada: string[];
  /** Maior andar alcançado na Torre de Prova de cada região (GDD 14.1). */
  torres: Partial<Record<RegiaoId, number>>;
  /** Turno em que abre o próximo Torneio Regional (GDD 14.5). */
  proximoTorneio: number;
  titulosTorneio: number;
  proximoTorneioAlquimia?: number;
  titulosAlquimia?: number;
}

export function createMundo(): MundoState {
  return {
    npcsPorRegiao: {},
    seitas: {},
    quadro: [],
    quadroTurno: -999,
    campanhaResgatada: [],
    torres: {},
    proximoTorneio: 0,
    titulosTorneio: 0,
  };
}

/** Os cultivadores de uma região são gerados na primeira vez que ela é consultada. */
export function npcsDaRegiao(mundo: MundoState, regiao: RegiaoId): Npc[] {
  if (!mundo.npcsPorRegiao[regiao]) {
    mundo.npcsPorRegiao[regiao] = gerarNpcsRegiao(regiao);
  }
  return mundo.npcsPorRegiao[regiao] as Npc[];
}

export function rosterDaSeita(mundo: MundoState, character: Character): SeitaRoster | null {
  if (!ehDiscipulo(character)) return null;
  const nome = character.afiliacao.nome;
  if (!mundo.seitas[nome]) {
    mundo.seitas[nome] = gerarRoster(nome, character.afiliacao.tipo === 'seita-suprema', character.local.regiao);
  }
  return mundo.seitas[nome];
}

/** O mundo não para: cultivadores da região atual e da sua seita envelhecem e avançam. */
export function avancarMundo(mundo: MundoState, character: Character, meses: number): void {
  envelhecerNpcs(npcsDaRegiao(mundo, character.local.regiao), meses);
  const roster = rosterDaSeita(mundo, character);
  if (roster) envelhecerRoster(roster, meses);
}
