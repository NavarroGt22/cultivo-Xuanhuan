import type { AttributeKey } from './attributes';

/**
 * Papéis dos Companheiros de Jornada (GDD 15.3). Fica separado de journeyCompanions.ts para que
 * character.ts possa somar os atributos sem importar o módulo inteiro (evita import circular).
 */
export type PapelCompanheiro = 'guerreiro' | 'batedor' | 'curandeiro' | 'erudito';

export interface PapelInfo {
  nome: string;
  atributo: AttributeKey;
  descricao: string;
}

export const PAPEIS: Record<PapelCompanheiro, PapelInfo> = {
  guerreiro: { nome: 'Guerreiro', atributo: 'forca', descricao: 'luta ao seu lado: +2 Força e +2 Constituição' },
  batedor: { nome: 'Batedor', atributo: 'destreza', descricao: 'vigia a estrada: +2 Destreza e 30% menos emboscadas' },
  curandeiro: { nome: 'Curandeiro', atributo: 'espirito', descricao: 'cuida das feridas: +2 Espírito e +15% de vida recuperada por estação' },
  erudito: { nome: 'Erudito', atributo: 'inteligencia', descricao: 'discute o Dao com você: +2 Inteligência e +5% de cultivo passivo' },
};

/** Lealdade a partir da qual o companheiro vira Irmão de Armas (bônus em dobro). */
export const LEALDADE_IRMAO = 90;

interface ComPapel {
  papel?: PapelCompanheiro;
  lealdade?: number;
  tipo: string;
}

export function multiplicadorLealdade(r: ComPapel): number {
  return (r.lealdade ?? 0) >= LEALDADE_IRMAO ? 2 : 1;
}

export function bonusAtributosCompanheiros(relacoes: ComPapel[]): Partial<Record<AttributeKey, number>> {
  const bonus: Partial<Record<AttributeKey, number>> = {};
  for (const r of relacoes) {
    if (!r.papel || r.tipo === 'Ex') continue;
    const valor = 2 * multiplicadorLealdade(r);
    const info = PAPEIS[r.papel];
    bonus[info.atributo] = (bonus[info.atributo] ?? 0) + valor;
    if (r.papel === 'guerreiro') bonus.constituicao = (bonus.constituicao ?? 0) + valor;
  }
  return bonus;
}
