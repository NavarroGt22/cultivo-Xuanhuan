import type { Character } from './character';
import { Npc, envelhecerNpcs, gerarNpcsRegiao } from './npcs';
import { SeitaRoster, envelhecerRoster, gerarRoster } from './sectRoster';
import { ehDiscipulo } from './sect';
import { RegiaoId } from './world';
import type { MissaoQuadro } from './bounties';
import { FaccaoMundo, avancarFaccoes, faccoesDaRegiao } from './regionalFactions';
import { avancarMercadores } from './merchantGroups';

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
  /** Seitas e clãs de cada região (regionalFactions.ts), gerados na primeira consulta. */
  faccoesPorRegiao?: Partial<Record<RegiaoId, FaccaoMundo[]>>;
  /** Notícias recentes do mundo das facções (roubos de discípulos, guerras). */
  cronicaFaccoes?: string[];
  /** Riqueza atual de cada grande grupo mercador (merchantGroups.ts). */
  riquezaMercadores?: Record<string, number>;
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

/**
 * O mundo não para: cultivadores de todas as regiões já conhecidas, as seitas e clãs delas
 * e a sua seita envelhecem e avançam.
 */
export function avancarMundo(mundo: MundoState, character: Character, meses: number): void {
  npcsDaRegiao(mundo, character.local.regiao);
  for (const npcs of Object.values(mundo.npcsPorRegiao)) if (npcs) envelhecerNpcs(npcs, meses);
  faccoesDaRegiao(mundo, character.local.regiao);
  for (const regiao of Object.keys(mundo.faccoesPorRegiao ?? {}) as RegiaoId[]) avancarFaccoes(mundo, regiao, meses);
  avancarMercadores(mundo, meses);
  const roster = rosterDaSeita(mundo, character);
  if (roster) envelhecerRoster(roster, meses);
}
