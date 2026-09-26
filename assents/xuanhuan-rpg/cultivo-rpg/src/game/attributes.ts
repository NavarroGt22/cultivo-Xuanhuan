export interface Attributes {
  forca: number;
  destreza: number;
  inteligencia: number;
  constituicao: number;
  espirito: number;
  sorte: number;
}

export function createBaseAttributes(overrides: Partial<Attributes> = {}): Attributes {
  const base: Attributes = {
    forca: 5,
    destreza: 5,
    inteligencia: 5,
    constituicao: 5,
    espirito: 5,
    sorte: 5,
  };

  for (const chave of Object.keys(overrides) as (keyof Attributes)[]) {
    const valor = overrides[chave];
    if (valor !== undefined) {
      base[chave] += valor;
    }
  }

  return base;
}
