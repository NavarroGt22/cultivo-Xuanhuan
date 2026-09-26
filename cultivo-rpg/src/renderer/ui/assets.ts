import * as fs from 'fs';
import * as path from 'path';

/** Pasta `assets/` na raiz do projeto (a mesma usada por `npm start`). */
export const PASTA_ASSETS = path.join(process.cwd(), 'assets');

export function existeAsset(relativo: string): boolean {
  return fs.existsSync(path.join(PASTA_ASSETS, relativo));
}

/** `<img>` só se o arquivo existir — o jogo funciona igual sem nenhuma imagem. */
export function imagemOpcional(relativo: string, classe: string, alt = ''): string {
  if (!existeAsset(relativo)) return '';
  const url = `file:///${path.join(PASTA_ASSETS, relativo).replace(/\\/g, '/')}`;
  return `<img class="${classe}" src="${url}" alt="${alt}" />`;
}

/** Retratos disponíveis para o protagonista (`assets/retratos/protagonista*.png|jpg`). */
export function retratosDoProtagonista(): string[] {
  const pasta = path.join(PASTA_ASSETS, 'retratos');
  if (!fs.existsSync(pasta)) return [];
  return fs
    .readdirSync(pasta)
    .filter((nome) => /^protagonista.*\.(png|jpe?g|webp)$/i.test(nome))
    .sort();
}
