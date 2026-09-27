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

/** Seletor que reencontra o mesmo controle depois de trocar o innerHTML (id ou todos os atributos data-*). */
function seletorDoControle(elemento: Element | null, raiz: HTMLElement): string | null {
  if (!(elemento instanceof HTMLElement) || !raiz.contains(elemento)) return null;
  if (elemento.id) return `#${CSS.escape(elemento.id)}`;
  const dados = Array.from(elemento.attributes).filter((a) => a.name.startsWith('data-'));
  return dados.length ? dados.map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join('') : null;
}

const INNER_HTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') as PropertyDescriptor;

/**
 * Todo painel redesenha trocando o innerHTML do overlay; aqui essa troca passa a guardar a rolagem
 * do painel e o foco no mesmo botão, para nenhum clique jogar a tela de volta ao topo.
 */
function manterPosicaoAoRedesenhar(overlay: HTMLDivElement): void {
  Object.defineProperty(overlay, 'innerHTML', {
    configurable: true,
    get(this: HTMLDivElement): string {
      return INNER_HTML.get?.call(this) as string;
    },
    set(this: HTMLDivElement, html: string) {
      const rolagem = this.querySelector<HTMLElement>('.painel')?.scrollTop ?? 0;
      const foco = seletorDoControle(document.activeElement, this);
      INNER_HTML.set?.call(this, html);
      const painel = this.querySelector<HTMLElement>('.painel');
      if (painel) painel.scrollTop = rolagem;
      const controle = foco ? this.querySelector<HTMLElement>(foco) : null;
      if (controle && !(controle as HTMLButtonElement).disabled) controle.focus({ preventScroll: true });
      else if (foco) this.focus({ preventScroll: true });
    },
  });
}

/**
 * Redesenha `raiz` sem pular para o topo: guarda a rolagem da página e do seletor `rolavel`
 * (o painel que tem a barra de rolagem) e devolve o foco ao mesmo controle.
 */
export function redesenharMantendoPosicao(raiz: HTMLElement, desenhar: () => void, rolavel?: string): void {
  const paginaY = window.scrollY;
  const rolagem = rolavel ? (raiz.querySelector<HTMLElement>(rolavel)?.scrollTop ?? 0) : 0;
  const foco = seletorDoControle(document.activeElement, raiz);

  desenhar();

  if (rolavel) {
    const novo = raiz.querySelector<HTMLElement>(rolavel);
    if (novo) novo.scrollTop = rolagem;
  }
  const controle = foco ? raiz.querySelector<HTMLElement>(foco) : null;
  if (controle && !(controle as HTMLButtonElement).disabled) {
    controle.focus({ preventScroll: true });
  } else if (foco && raiz.hasAttribute('tabindex')) {
    // O botão ficou desabilitado (ex.: atributo no máximo): o foco fica no modal, sem escapar para a página.
    raiz.focus({ preventScroll: true });
  }
  window.scrollTo(window.scrollX, paginaY);
}

/** Cria um overlay modal no <body>, fora do #app, para sobreviver a re-renderizações da tela. */
export function criarOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Painel do jogo');
  overlay.tabIndex = -1;
  manterPosicaoAoRedesenhar(overlay);
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
    (focaveis()[0] ?? overlay).focus({ preventScroll: true });
  });
  const observer = new MutationObserver(() => {
    if (overlay.isConnected) return;
    observer.disconnect();
    document.removeEventListener('keydown', aoTeclar);
    if (app && !document.querySelector('.overlay')) app.inert = false;
    const destino = anterior?.isConnected ? anterior : anteriorId ? document.getElementById(anteriorId) : null;
    destino?.focus({ preventScroll: true });
  });
  observer.observe(document.body, { childList: true });
  return overlay;
}
