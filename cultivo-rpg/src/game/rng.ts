import { VALOR_INICIAL_ATRIBUTO } from './attributes';

export function inteiro(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function escolher<T>(lista: readonly T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

export function chance(probabilidade: number): boolean {
  return Math.random() < probabilidade;
}

/** Valor multiplicado por um fator aleatório em [1 - amplitude, 1 + amplitude]. */
export function variacao(valor: number, amplitude = 0.15): number {
  return valor * (1 - amplitude + Math.random() * amplitude * 2);
}

export function escolherPonderado<T>(opcoes: { valor: T; peso: number }[]): T {
  const total = opcoes.reduce((soma, opcao) => soma + Math.max(0, opcao.peso), 0);
  if (total <= 0) return opcoes[0].valor;

  let restante = Math.random() * total;
  for (const opcao of opcoes) {
    restante -= Math.max(0, opcao.peso);
    if (restante < 0) return opcao.valor;
  }
  return opcoes[opcoes.length - 1].valor;
}

/**
 * Percentil 0–100 deslocado pela Sorte: Sorte 5 é neutra, cada ponto acima
 * encolhe a distância até o topo em 4% (máx. 50%); abaixo de 5 piora.
 */
export function percentilComSorte(sorte: number): number {
  const fator = Math.min(1.3, Math.max(0.5, 1 - (sorte - VALOR_INICIAL_ATRIBUTO) * 0.04));
  return 100 - (100 - Math.random() * 100) * fator;
}
