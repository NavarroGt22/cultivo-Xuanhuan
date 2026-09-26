export interface AlignmentState {
  /** -100 (Caos/Não-Ortodoxo) a 100 (Ordem/Ortodoxo) */
  valor: number;
}

function clamp(valor: number): number {
  return Math.max(-100, Math.min(100, valor));
}

export function createAlignment(valorInicial = 0): AlignmentState {
  return { valor: clamp(valorInicial) };
}

export function shiftAlignment(state: AlignmentState, delta: number): AlignmentState {
  return { valor: clamp(state.valor + delta) };
}

export function alignmentLabel(state: AlignmentState): string {
  if (state.valor >= 40) return 'Ortodoxo';
  if (state.valor <= -40) return 'Não-Ortodoxo (Demoníaco)';
  return 'Neutro';
}
