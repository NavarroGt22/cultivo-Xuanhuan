export interface AlignmentState {
  /** -100 (Caos/Não-Ortodoxo) a 100 (Ordem/Ortodoxo) */
  valor: number;
}

export function createAlignment(): AlignmentState {
  return { valor: 0 };
}

export function shiftAlignment(state: AlignmentState, delta: number): AlignmentState {
  const novoValor = Math.max(-100, Math.min(100, state.valor + delta));
  return { valor: novoValor };
}

export function alignmentLabel(state: AlignmentState): string {
  if (state.valor >= 40) return 'Ortodoxo';
  if (state.valor <= -40) return 'Não-Ortodoxo (Demoníaco)';
  return 'Neutro';
}
