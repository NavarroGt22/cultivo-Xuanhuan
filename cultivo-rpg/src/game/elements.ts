import { ELEMENTOS_BASE, Elemento, NOME_ELEMENTO, SpiritualRoot } from './spiritualRoot';

/**
 * GDD 8 — Ciclo de dominação (Wu Xing):
 * Fogo supera Metal · Metal supera Madeira · Madeira supera Terra · Terra supera Água · Água supera Fogo.
 * Elementos superiores (raio, vento, luz…) ficam fora do ciclo simples.
 */
const DOMINA: Partial<Record<Elemento, Elemento>> = {
  fogo: 'metal',
  metal: 'madeira',
  madeira: 'terra',
  terra: 'agua',
  agua: 'fogo',
};

/** Vantagem elemental é forte o bastante para um estágio inferior neutralizar um superior. */
export const BONUS_VANTAGEM = 1.25;
export const PENALIDADE_DESVANTAGEM = 0.8;

export function elementoDeCombate(raiz: SpiritualRoot): Elemento | undefined {
  const principal = raiz.elementos[0];
  return principal && ELEMENTOS_BASE.includes(principal) ? principal : undefined;
}

export function fatorElemental(atacante?: Elemento, defensor?: Elemento): number {
  if (!atacante || !defensor) return 1;
  if (DOMINA[atacante] === defensor) return BONUS_VANTAGEM;
  if (DOMINA[defensor] === atacante) return PENALIDADE_DESVANTAGEM;
  return 1;
}

/** Elemento estável derivado de um nome (NPCs sempre têm o mesmo elemento). */
export function elementoDeNome(nome: string): Elemento | undefined {
  let hash = 0;
  for (const letra of nome) hash = (hash * 33 + letra.charCodeAt(0)) >>> 0;
  return hash % 5 === 0 ? undefined : ELEMENTOS_BASE[hash % ELEMENTOS_BASE.length];
}

export function descreverConfronto(meu?: Elemento, dele?: Elemento): string | null {
  if (!dele) return null;
  const nomeDele = NOME_ELEMENTO[dele];
  if (!meu) return `Elemento inimigo: ${nomeDele}`;
  const ataque = fatorElemental(meu, dele);
  const defesa = fatorElemental(dele, meu);
  if (ataque > 1) return `Elemento inimigo: ${nomeDele} — seu ${NOME_ELEMENTO[meu]} o domina!`;
  if (defesa > 1) return `Elemento inimigo: ${nomeDele} — domina seu ${NOME_ELEMENTO[meu]}!`;
  return `Elemento inimigo: ${nomeDele} (neutro)`;
}
