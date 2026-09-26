const ENTIDADES_HTML: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (caractere) => ENTIDADES_HTML[caractere]);
}

export function formatarNumero(valor: number, casasDecimais = 1): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casasDecimais });
}

/** Cria um overlay modal no <body>, fora do #app, para sobreviver a re-renderizações da tela. */
export function criarOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);
  return overlay;
}
