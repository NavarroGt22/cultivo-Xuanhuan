import { ATTRIBUTE_INFO, AttributeKey, Attributes } from './attributes';

/** Estilos marciais aprendidos ao longo da vida; cada um tem sua própria maestria. */
export type EstiloId = 'punho' | 'espada' | 'sombra' | 'leque' | 'lanca';

export interface EstiloInfo {
  id: EstiloId;
  nome: string;
  descricao: string;
  primario: AttributeKey;
  secundario: AttributeKey;
  /** Arma de treino recebida ao aprender (EQUIPMENT_CATALOG). */
  armaInicial: string;
}

export interface EstiloEstado {
  /** 0 = não aprendido. */
  nivel: number;
  xp: number;
}

export const NIVEIS_MAESTRIA = ['Iniciante', 'Praticante', 'Adepto', 'Mestre', 'Grão-Mestre'];

/** Rank de cultivo mínimo para cada nível de maestria (índice = nível - 1). */
const RANK_MINIMO_MAESTRIA = [1, 1, 1, 2, 3];

export const ESTILOS: Record<EstiloId, EstiloInfo> = {
  punho: {
    id: 'punho',
    nome: 'Punho Marcial',
    descricao: 'Cultiva o corpo acima de tudo. Aguenta golpes que derrubariam qualquer outro.',
    primario: 'forca',
    secundario: 'constituicao',
    armaInicial: 'faixas-ferro',
  },
  espada: {
    id: 'espada',
    nome: 'Caminho da Espada',
    descricao: 'Equilíbrio entre força e precisão. A lâmina é uma extensão do qi.',
    primario: 'forca',
    secundario: 'destreza',
    armaInicial: 'espada-ferro',
  },
  sombra: {
    id: 'sombra',
    nome: 'Sombra Veloz',
    descricao: 'Movimento e golpes precisos. Vence antes de ser tocado.',
    primario: 'destreza',
    secundario: 'sorte',
    armaInicial: 'adagas-gemeas',
  },
  leque: {
    id: 'leque',
    nome: 'Leque do Erudito',
    descricao: 'Luta com a mente: lê o adversário e canaliza o qi por técnicas.',
    primario: 'inteligencia',
    secundario: 'espirito',
    armaInicial: 'leque-ferro',
  },
  lanca: {
    id: 'lanca',
    nome: 'Lança do Dragão Firme',
    descricao: 'Alcance e resistência. Uma muralha que também ataca.',
    primario: 'constituicao',
    secundario: 'forca',
    armaInicial: 'lanca-besta',
  },
};

export const ESTILO_IDS = Object.keys(ESTILOS) as EstiloId[];

export function createEstilos(): Record<EstiloId, EstiloEstado> {
  return Object.fromEntries(ESTILO_IDS.map((id) => [id, { nivel: 0, xp: 0 }])) as Record<EstiloId, EstiloEstado>;
}

export function tituloMaestria(estado: EstiloEstado): string {
  return estado.nivel > 0 ? NIVEIS_MAESTRIA[estado.nivel - 1] : 'Não aprendido';
}

export function xpParaProximaMaestria(nivel: number): number {
  return Math.round(80 * Math.pow(nivel, 1.5));
}

/** Primário: +1 em Iniciante, Adepto e Grão-Mestre (máx. +3). Secundário: +1 a partir de Mestre. */
export function bonusDeEstilos(estilos: Record<EstiloId, EstiloEstado>): Partial<Attributes> {
  const bonus: Partial<Attributes> = {};
  for (const id of ESTILO_IDS) {
    const { nivel } = estilos[id];
    if (nivel === 0) continue;
    const info = ESTILOS[id];
    bonus[info.primario] = (bonus[info.primario] ?? 0) + Math.ceil(nivel / 2);
    if (nivel >= 4) bonus[info.secundario] = (bonus[info.secundario] ?? 0) + 1;
  }
  return bonus;
}

/** O estilo de maior maestria é o que você usa para lutar. */
export function estiloPrincipal(estilos: Record<EstiloId, EstiloEstado>): EstiloId | null {
  const aprendidos = ESTILO_IDS.filter((id) => estilos[id].nivel > 0);
  if (aprendidos.length === 0) return null;
  return aprendidos.reduce((melhor, id) =>
    estilos[id].nivel * 1000 + estilos[id].xp > estilos[melhor].nivel * 1000 + estilos[melhor].xp ? id : melhor,
  );
}

export function descreverBonusEstilo(id: EstiloId): string {
  const info = ESTILOS[id];
  return `até +3 ${ATTRIBUTE_INFO[info.primario].sigla} e +1 ${ATTRIBUTE_INFO[info.secundario].sigla} com a maestria`;
}

/** XP escala com a Compreensão (Inteligência): +3% por ponto. */
export function ganharXpEstilo(
  id: EstiloId,
  estado: EstiloEstado,
  xp: number,
  compreensao: number,
  rank: number,
): string[] {
  if (estado.nivel === 0 || xp <= 0) return [];

  const mensagens: string[] = [];
  estado.xp += Math.round(xp * (1 + compreensao * 0.03));

  while (estado.nivel < NIVEIS_MAESTRIA.length && estado.xp >= xpParaProximaMaestria(estado.nivel)) {
    const necessario = xpParaProximaMaestria(estado.nivel);
    if (rank < RANK_MINIMO_MAESTRIA[estado.nivel]) {
      estado.xp = necessario;
      mensagens.push(`${ESTILOS[id].nome}: seu cultivo ainda não sustenta o próximo nível de maestria.`);
      break;
    }
    estado.xp -= necessario;
    estado.nivel += 1;
    mensagens.push(`${ESTILOS[id].nome}: você agora é ${NIVEIS_MAESTRIA[estado.nivel - 1]}!`);
  }

  if (estado.nivel >= NIVEIS_MAESTRIA.length) estado.xp = 0;
  return mensagens;
}
