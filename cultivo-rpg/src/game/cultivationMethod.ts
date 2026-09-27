import type { Character } from './character';
import { getTecnica } from './techniques';

/**
 * Método de cultivo: sem alguém (ou algo) que ensine a circular o qi, uma raiz espiritual não serve de nada.
 * Quem nasce em família comum ou órfão cresce entre mortais: precisa de uma seita, um clã, um mestre,
 * um manual de Método de Cultivo ou das memórias de uma vida passada para começar.
 * Devolve de onde vem o método, ou null se o personagem não tem nenhum.
 */
export function metodoDeCultivo(character: Character): string | null {
  const tipoAfiliacao = character.afiliacao.tipo;
  if (tipoAfiliacao === 'cla' || tipoAfiliacao === 'seita' || tipoAfiliacao === 'seita-suprema') return `os ensinamentos do ${character.afiliacao.nome}`;
  if (character.faccao) return `os métodos da ${character.faccao.nome}`;
  if (character.mestrePessoal) return `as lições de ${character.mestrePessoal.nome}`;
  const manual = character.tecnicas.map(getTecnica).find((t) => t?.categoria === 'cultivo');
  if (manual) return manual.nome;
  if (character.origem.tipo !== 'orfao' && character.origem.tipo !== 'familia-comum') return 'o que aprendeu ainda criança no clã';
  if (Number(character.flags.memoriasDespertadas ?? 0) > 0) return 'as memórias da vida passada';
  return null;
}

/** Sem método, meditar é tatear no escuro: rende uma fração do normal. */
export const FATOR_SEM_METODO = 0.2;

export const DICA_SEM_METODO =
  'Você nasceu entre mortais e ninguém te ensinou a cultivar: sem um método, o qi não se acumula sozinho e meditar rende pouco. Entre para uma seita ou clã, encontre um mestre, ou compre e estude um manual de Método de Cultivo.';
