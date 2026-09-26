import type { Character } from './character';
import { Npc, gerarNpc, poderNpc, envelhecerNpcs } from './npcs';
import { REGIOES, RegiaoId } from './world';
import { POSTOS_SEITA, ehDiscipulo, estipendioDoPosto, indicePosto } from './sect';
import { escolher } from './rng';

export type PostoMembro = 'Líder da Seita' | 'Ancião' | string;

export interface MembroSeita extends Npc {
  posto: PostoMembro;
}

export interface BestaGuardia {
  nome: string;
  rank: number;
  estagio: number;
}

export interface SeitaRoster {
  nome: string;
  suprema: boolean;
  membros: MembroSeita[];
  bestas: BestaGuardia[];
}

/** Ordem de exibição: do topo da hierarquia para a base. */
export const ORDEM_POSTOS: PostoMembro[] = ['Líder da Seita', 'Ancião', ...[...POSTOS_SEITA].reverse().map((p) => p.nome)];

const COMPOSICAO: { posto: PostoMembro; quantidade: number; rankMin: number; rankMax: number }[] = [
  { posto: 'Líder da Seita', quantidade: 1, rankMin: 5, rankMax: 6 },
  { posto: 'Ancião', quantidade: 3, rankMin: 4, rankMax: 5 },
  { posto: 'Ancião Aprendiz', quantidade: 2, rankMin: 3, rankMax: 3 },
  { posto: 'Discípulo Núcleo', quantidade: 4, rankMin: 2, rankMax: 3 },
  { posto: 'Discípulo Interno', quantidade: 7, rankMin: 1, rankMax: 2 },
  { posto: 'Discípulo Externo', quantidade: 10, rankMin: 1, rankMax: 1 },
];

export function gerarRoster(nome: string, suprema: boolean, regiao: RegiaoId): SeitaRoster {
  const bonus = suprema ? 3 : 0;
  const membros: MembroSeita[] = COMPOSICAO.flatMap(({ posto, quantidade, rankMin, rankMax }) =>
    Array.from({ length: quantidade }, () => ({
      ...gerarNpc(regiao, { rankMin: rankMin + bonus, rankMax: rankMax + bonus, afiliacao: nome }),
      posto,
    })),
  );
  const lider = membros[0];
  const bestas = Array.from({ length: 2 }, () => ({
    nome: `${escolher(REGIOES[regiao].fauna)} Guardiã`,
    rank: Math.max(1, lider.rank - 1),
    estagio: lider.estagio,
  }));
  return { nome, suprema, membros, bestas };
}

export function ordenarRoster(roster: SeitaRoster): MembroSeita[] {
  return [...roster.membros].sort(
    (a, b) => ORDEM_POSTOS.indexOf(a.posto) - ORDEM_POSTOS.indexOf(b.posto) || poderNpc(b) - poderNpc(a),
  );
}

/** Pode desafiar discípulos do seu posto ou do posto logo acima (nunca anciões ou o líder). */
export function podeDesafiar(character: Character, membro: MembroSeita): boolean {
  if (!ehDiscipulo(character)) return false;
  const meu = indicePosto(character);
  const alvo = POSTOS_SEITA.findIndex((p) => p.nome === membro.posto);
  return alvo === meu || alvo === meu + 1;
}

/** Depois de vencer: se o alvo era do posto acima, vocês trocam de lugar. */
export function aplicarVitoriaDesafio(character: Character, roster: SeitaRoster, membro: MembroSeita): string[] {
  const meu = indicePosto(character);
  const alvo = POSTOS_SEITA.findIndex((p) => p.nome === membro.posto);
  if (alvo !== meu + 1) {
    return [`Você venceu ${membro.nome} diante dos discípulos. Seu nome sobe entre os ${POSTOS_SEITA[meu].nome}s.`];
  }

  const tipo = character.afiliacao.tipo as 'seita' | 'seita-suprema';
  const novoPosto = POSTOS_SEITA[alvo];
  membro.posto = POSTOS_SEITA[meu].nome;
  character.afiliacao = { ...character.afiliacao, posto: novoPosto.nome, estipendio: estipendioDoPosto(tipo, novoPosto) };
  const alvoNoRoster = roster.membros.find((m) => m.id === membro.id);
  if (alvoNoRoster) alvoNoRoster.posto = membro.posto;
  return [`Você tomou a vaga de ${membro.nome}! Agora é ${novoPosto.nome}, e ${membro.nome} desce para ${membro.posto}.`];
}

export function envelhecerRoster(roster: SeitaRoster, meses: number): void {
  envelhecerNpcs(roster.membros, meses);
}
