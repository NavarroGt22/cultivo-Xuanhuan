import type { Character } from './character';
import { REINOS } from './cultivation';
import { influenciaPessoal } from './influence';
import { addPedrasEspirituais } from './inventory';
import type { TipoOrigem } from './origin';
import { inteiro } from './rng';

/**
 * Fundar a própria Seita ou Clã. O fundador vira Patriarca/Mestre da Seita:
 * recruta membros, constrói instalações, recebe renda — e a facção passa para o herdeiro.
 */
export type TipoFaccao = 'cla' | 'seita';

export interface Instalacoes {
  /** Veia espiritual canalizada: +8% de cultivo passivo por nível. */
  salaCultivo: number;
  /** Manuais copiados: −2 de dificuldade para estudar técnicas por nível. */
  biblioteca: number;
  /** Formações de defesa: afastam vingadores e rivais (−25% de chance de ataques por nível). */
  muralhas: number;
}

export interface Faccao {
  tipo: TipoFaccao;
  nome: string;
  membros: number;
  ortodoxa: boolean;
  fundadaIdadeMeses: number;
  instalacoes: Instalacoes;
}

export const NOME_INSTALACAO: Record<keyof Instalacoes, string> = {
  salaCultivo: 'Sala de Cultivo (veia espiritual)',
  biblioteca: 'Biblioteca de Manuais',
  muralhas: 'Muralhas e Formações de Defesa',
};

export const NIVEL_MAX_INSTALACAO = 3;

const REQUISITOS: Record<TipoFaccao, { rank: number; pedras: number; reputacao: number }> = {
  cla: { rank: 3, pedras: 300, reputacao: 40 },
  seita: { rank: 4, pedras: 600, reputacao: 80 },
};

export function requisitosFundacao(tipo: TipoFaccao): string {
  const r = REQUISITOS[tipo];
  return `${REINOS[r.rank - 1].nome}, ${r.pedras} pedras e reputação ${r.reputacao}`;
}

export function motivoBloqueioFundacao(character: Character, tipo: TipoFaccao, nome: string): string | null {
  const r = REQUISITOS[tipo];
  if (character.faccao) return `Você já lidera ${character.faccao.nome}`;
  if (nome.trim().length < 3) return 'Dê um nome (pelo menos 3 letras)';
  if (character.cultivo.rank < r.rank) return `Requer ${REINOS[r.rank - 1].nome}`;
  if (character.inventario.pedrasEspirituais < r.pedras) return `Requer ${r.pedras} pedras`;
  if (character.reputacao < r.reputacao) return `Requer reputação ${r.reputacao}`;
  return null;
}

export function fundarFaccao(character: Character, tipo: TipoFaccao, nomeDigitado: string): string[] {
  const bloqueio = motivoBloqueioFundacao(character, tipo, nomeDigitado);
  if (bloqueio) return [bloqueio];

  const base = nomeDigitado.trim();
  const nome = tipo === 'cla' && !/^Clã\s/i.test(base) ? `Clã ${base}` : base;
  addPedrasEspirituais(character.inventario, -REQUISITOS[tipo].pedras);
  const ortodoxa = character.alinhamento.valor >= 0;
  const antiga = character.afiliacao.nome;

  character.faccao = {
    tipo,
    nome,
    membros: tipo === 'cla' ? 5 : 8,
    ortodoxa,
    fundadaIdadeMeses: character.idadeMeses,
    instalacoes: { salaCultivo: 0, biblioteca: 0, muralhas: 0 },
  };
  character.afiliacao = {
    tipo,
    nome,
    ortodoxa,
    posto: tipo === 'cla' ? 'Patriarca Fundador' : 'Mestre da Seita',
    estipendio: 0,
  };
  character.contribuicao = 0;
  character.reputacao += 15;

  return [
    `Você funda ${tipo === 'cla' ? 'o' : 'a'} **${nome}**${ortodoxa ? '' : ' (não-ortodoxa)'}! ${character.afiliacao.posto}: ${character.nome}.`,
    antiga && antiga !== nome ? `Você deixa ${antiga} para trás.` : '',
    `Os primeiros ${character.faccao.membros} membros juram lealdade. Reputação +15.`,
  ].filter(Boolean);
}

export function custoRecrutamento(faccao: Faccao): number {
  return 20 + faccao.membros * 2;
}

export function recrutarMembros(character: Character): string[] {
  const faccao = character.faccao;
  if (!faccao) return [];
  const custo = custoRecrutamento(faccao);
  if (character.inventario.pedrasEspirituais < custo) return [`Requer ${custo} pedras`];
  addPedrasEspirituais(character.inventario, -custo);
  const novos = 2 + influenciaPessoal(character).nivel + inteiro(0, 3);
  faccao.membros += novos;
  return [`Você abre os portões para novos membros: +${novos} (total ${faccao.membros}). Custo: ${custo} pedras.`];
}

export function custoInstalacao(nivelAtual: number): number {
  return Math.round(80 * Math.pow(nivelAtual + 1, 1.5));
}

export function melhorarInstalacao(character: Character, instalacao: keyof Instalacoes): string[] {
  const faccao = character.faccao;
  if (!faccao) return [];
  const nivel = faccao.instalacoes[instalacao];
  if (nivel >= NIVEL_MAX_INSTALACAO) return ['Já está no nível máximo.'];
  const custo = custoInstalacao(nivel);
  if (character.inventario.pedrasEspirituais < custo) return [`Requer ${custo} pedras`];
  addPedrasEspirituais(character.inventario, -custo);
  faccao.instalacoes[instalacao] = nivel + 1;
  return [`${NOME_INSTALACAO[instalacao]} agora está no nível ${nivel + 1}. Custo: ${custo} pedras.`];
}

/** Renda dos membros menos a manutenção das instalações; a fama atrai membros sozinha. */
export function processarFaccao(character: Character, estacoes: number): string[] {
  const faccao = character.faccao;
  if (!faccao) return [];
  const { salaCultivo, biblioteca, muralhas } = faccao.instalacoes;
  const renda = Math.round(faccao.membros * (faccao.tipo === 'seita' ? 1.5 : 1) * estacoes);
  const manutencao = (salaCultivo + biblioteca + muralhas) * 3 * estacoes;
  addPedrasEspirituais(character.inventario, renda - manutencao);

  const mensagens = [`${faccao.nome}: renda dos membros +${renda}, manutenção −${manutencao} pedras.`];
  if (influenciaPessoal(character).nivel >= 3 && Math.random() < 0.3 * estacoes) {
    const novos = inteiro(1, 3);
    faccao.membros += novos;
    mensagens.push(`Atraídos pela sua fama, ${novos} novo(s) membro(s) chegam à ${faccao.nome}.`);
  }
  return mensagens;
}

/** O tamanho da facção define o tipo de família que o herdeiro terá nascido. */
export function tipoOrigemDaFaccao(faccao: Faccao): TipoOrigem {
  if (faccao.tipo === 'seita') return faccao.membros >= 200 ? 'seita-suprema' : 'seita-menor';
  if (faccao.membros >= 150) return 'super-cla';
  if (faccao.membros >= 60) return 'cla-grande';
  if (faccao.membros >= 20) return 'cla-medio';
  return 'cla-menor';
}

export function bonusCultivoFaccao(character: Character): number {
  return (character.faccao?.instalacoes.salaCultivo ?? 0) * 0.08;
}

export function reducaoEstudoFaccao(character: Character): number {
  return (character.faccao?.instalacoes.biblioteca ?? 0) * 2;
}

export function protecaoFaccao(character: Character): number {
  return Math.max(0, 1 - (character.faccao?.instalacoes.muralhas ?? 0) * 0.25);
}
