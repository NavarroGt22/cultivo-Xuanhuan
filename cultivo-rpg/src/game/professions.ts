export type ProfissaoId = 'alquimia' | 'inscricao' | 'domador' | 'adivinhacao' | 'refinador';

export interface ProfissaoEstado {
  /** 0 = ainda não aprendeu. */
  nivel: number;
  xp: number;
}

export interface ProfissaoInfo {
  nome: string;
  /** Índice = nível - 1. */
  titulos: string[];
  /** Rank de cultivo mínimo para cada nível (GDD seções 4 e 7). */
  rankMinimo: number[];
}

export const PROFISSAO_INFO: Record<ProfissaoId, ProfissaoInfo> = {
  alquimia: {
    nome: 'Alquimia',
    titulos: [
      'Alchemy Apprentice',
      'Warrior-Level Alchemist (1ª Ordem)',
      'Master-Level Alchemist (2ª Ordem)',
      'Great Master-Level Alchemist (3ª Ordem)',
      'Lord-Level Alchemist (4ª Ordem)',
      'King-Level Alchemist (5ª Ordem)',
      'Grandmaster-Level Alchemist (6ª Ordem)',
      'Emperor-Level Alchemist (7ª Ordem)',
      'Supreme-Level Alchemist (8ª Ordem)',
      'Sovereign-Level Alchemist (9ª Ordem)',
      'Alchemy God (10ª Ordem)',
    ],
    rankMinimo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  inscricao: {
    nome: 'Inscrição',
    titulos: [
      'Aprendiz de Inscrições',
      'Inscricionista',
      'Mestre de Inscrições',
      'Grão-Mestre de Inscrições',
      'Mestre de Arrays',
      'Mestre do Dao das Inscrições',
      'Sábio Supremo das Inscrições',
    ],
    rankMinimo: [1, 2, 4, 6, 8, 10, 12],
  },
  domador: {
    nome: 'Domador de Bestas',
    /** GDD 10: escala própria, sem correlação obrigatória com o cultivo pessoal. */
    titulos: ['Aprendiz de Domador', 'Domador', 'Grão-Domador', 'Mestre das Mil Bestas'],
    rankMinimo: [1, 1, 2, 3],
  },
  adivinhacao: {
    nome: 'Divinação',
    /** GDD 14.6: estrelas, ossos de tartaruga, sonhos. */
    titulos: ['Leitor de Sinais', 'Adivinho', 'Vidente', 'Oráculo'],
    rankMinimo: [1, 1, 2, 3],
  },
  refinador: {
    nome: 'Forja (Mestre Refinador)',
    /** GDD 5: mesma escala de Ordem dos alquimistas. */
    titulos: ['Aprendiz de Forja', 'Refinador de 1ª Ordem', 'Refinador de 2ª Ordem', 'Mestre Refinador', 'Grão-Mestre Refinador', 'Refinador Celestial'],
    rankMinimo: [1, 1, 2, 3, 5, 7],
  },
};

export const PROFISSAO_IDS = Object.keys(PROFISSAO_INFO) as ProfissaoId[];

export function createProfissoes(): Record<ProfissaoId, ProfissaoEstado> {
  return {
    alquimia: { nivel: 0, xp: 0 },
    inscricao: { nivel: 0, xp: 0 },
    domador: { nivel: 0, xp: 0 },
    adivinhacao: { nivel: 0, xp: 0 },
    refinador: { nivel: 0, xp: 0 },
  };
}

export function xpParaProximoNivel(nivel: number): number {
  return 100 * nivel;
}

export function tituloProfissao(id: ProfissaoId, estado: ProfissaoEstado): string | null {
  return estado.nivel > 0 ? PROFISSAO_INFO[id].titulos[estado.nivel - 1] : null;
}

export function ganharXpProfissao(id: ProfissaoId, estado: ProfissaoEstado, xp: number, rank: number): string[] {
  if (estado.nivel === 0 || xp <= 0) return [];

  const info = PROFISSAO_INFO[id];
  const mensagens: string[] = [];
  estado.xp += xp;

  while (estado.nivel < info.titulos.length && estado.xp >= xpParaProximoNivel(estado.nivel)) {
    const necessario = xpParaProximoNivel(estado.nivel);
    if (rank < info.rankMinimo[estado.nivel]) {
      estado.xp = necessario;
      mensagens.push(`Seu domínio de ${info.nome} chegou ao limite do que seu reino de cultivo permite.`);
      break;
    }
    estado.xp -= necessario;
    estado.nivel += 1;
    mensagens.push(`${info.nome}: você agora é ${info.titulos[estado.nivel - 1]}!`);
  }

  return mensagens;
}
