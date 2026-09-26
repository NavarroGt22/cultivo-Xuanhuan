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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Painel do jogo');
  overlay.tabIndex = -1;
  const anterior = document.activeElement as HTMLElement | null;
  const anteriorId = anterior?.id;
  const focaveis = (): HTMLElement[] => Array.from(overlay.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
  const aoTeclar = (e: KeyboardEvent): void => {
    const abertas = document.querySelectorAll('.overlay');
    if (abertas[abertas.length - 1] !== overlay) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); overlay.remove(); return; }
    if (e.key === 'Tab') {
      const itens = focaveis();
      const primeiro = itens[0]; const ultimo = itens[itens.length - 1];
      if (!primeiro) { e.preventDefault(); overlay.focus(); }
      else if (!overlay.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? ultimo : primeiro).focus(); }
      else if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === overlay)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  };
  document.addEventListener('keydown', aoTeclar);
  document.body.appendChild(overlay);
  const app = document.getElementById('app');
  if (app) app.inert = true;
  queueMicrotask(() => {
    if (!overlay.isConnected) return;
    const titulo = overlay.querySelector('h2');
    if (titulo) overlay.setAttribute('aria-label', titulo.textContent ?? 'Painel do jogo');
    (focaveis()[0] ?? overlay).focus();
  });
  const observer = new MutationObserver(() => {
    if (overlay.isConnected) return;
    observer.disconnect();
    document.removeEventListener('keydown', aoTeclar);
    if (app && !document.querySelector('.overlay')) app.inert = false;
    const destino = anterior?.isConnected ? anterior : anteriorId ? document.getElementById(anteriorId) : null;
    destino?.focus();
  });
  observer.observe(document.body, { childList: true });
  return overlay;
}
