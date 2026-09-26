/**
 * Escala universal de qualidade (Sistema de Vida): vale para peças forjadas, pílulas, moradias e montarias.
 * `margem` é quanto o teste precisa passar da dificuldade para alcançar a qualidade.
 */
export const QUALIDADES = [
  { nome: 'Bronze', multiplicador: 1, margem: 0 },
  { nome: 'Prata', multiplicador: 1.2, margem: 6 },
  { nome: 'Ouro', multiplicador: 1.5, margem: 12 },
  { nome: 'Ouro Negro', multiplicador: 2, margem: 18 },
  { nome: 'Lendário', multiplicador: 3, margem: 24 },
];

export function indiceQualidadePorMargem(margem: number): number {
  let indice = 0;
  QUALIDADES.forEach((q, i) => {
    if (margem >= q.margem) indice = i;
  });
  return indice;
}
