import type { DesfechoExibido } from '../../game/story';
import { criarOverlay, escapeHtml } from './dom';
import { precisaReproduzir, reproduzirCombate } from './combatPlayer';

export function renderMensagens(mensagens: string[]): string {
  return mensagens.length ? `<div class="mensagens">${mensagens.map((m) => `<p>${escapeHtml(m)}</p>`).join('')}</div>` : '';
}

/** Enquanto a luta não foi assistida, o resultado mostra só a arena (o texto aparece depois). */
export function renderResultado(resultado: DesfechoExibido, extras: string[] = []): string {
  if (precisaReproduzir(resultado.combate)) {
    return '<div class="resultado-atividade"><div data-reproducao></div></div>';
  }
  const log = resultado.log.length
    ? `<details class="log-combate"><summary>Registro da luta (${resultado.log.length} ações)</summary>${resultado.log
        .map((linha) => `<p>${escapeHtml(linha)}</p>`)
        .join('')}</details>`
    : '';
  return `
    <div class="resultado-atividade">
      ${resultado.resumo ? `<p class="mensagem-teste">${escapeHtml(resultado.resumo)}</p>` : ''}
      ${log}
      <p>${escapeHtml(resultado.texto)}</p>
      ${renderMensagens([...resultado.mensagens, ...extras])}
    </div>`;
}

/** Chamar depois de inserir o HTML de `renderResultado` na página. */
export function ativarReproducao(raiz: HTMLElement, resultado: DesfechoExibido | null, aoTerminar: () => void): void {
  const alvo = raiz.querySelector<HTMLElement>('[data-reproducao]');
  if (alvo && resultado && precisaReproduzir(resultado.combate)) {
    reproduzirCombate(alvo, resultado.combate, aoTerminar);
  }
}

/**
 * Resultado de uma ação (luta, teste) numa janela própria por cima do painel: o painel de baixo
 * não se mexe, e a luta é assistida ali mesmo. `aoFechar` roda quando o jogador fecha a janela.
 */
export function abrirResultado(resultado: DesfechoExibido, extras: string[] = [], titulo = 'Resultado', aoFechar?: () => void): void {
  const overlay = criarOverlay();
  const desenhar = (): void => {
    const assistindo = precisaReproduzir(resultado.combate);
    overlay.innerHTML = `
      <div class="painel painel-resultado">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>${escapeHtml(titulo)}</h2>
        ${renderResultado(resultado, extras)}
        ${assistindo ? '' : '<div class="acoes"><button class="primario" data-acao="fechar">Continuar</button></div>'}
      </div>`;
    ativarReproducao(overlay, resultado, desenhar);
  };
  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      aoFechar?.();
    }
  });
  desenhar();
}

/** Mensagens curtas (compras, conversas, refinos) num aviso flutuante: aparecem onde você está, sem rolar nada. */
export function avisar(mensagens: string[]): void {
  const limpas = mensagens.filter(Boolean);
  if (!limpas.length) return;
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast toast-mensagens';
  toast.setAttribute('role', 'status');
  toast.innerHTML = limpas.map((m) => `<p>${escapeHtml(m)}</p>`).join('');
  toast.addEventListener('click', () => toast.remove());
  document.body.appendChild(toast);
  const duracao = Math.min(10000, 3500 + limpas.join(' ').length * 40);
  setTimeout(() => toast.remove(), duracao);
}

/** Confirmação dentro do jogo (o confirm() nativo do Electron pode travar o foco no Windows). */
export function confirmar(pergunta: string, rotuloSim = 'Sim', rotuloNao = 'Cancelar'): Promise<boolean> {
  return new Promise((resolver) => {
    const overlay = criarOverlay();
    let respondido = false;
    const responder = (valor: boolean): void => {
      if (respondido) return;
      respondido = true;
      overlay.remove();
      resolver(valor);
    };
    overlay.innerHTML = `
      <div class="painel painel-confirmacao" role="alertdialog">
        <h2>Tem certeza?</h2>
        <p>${escapeHtml(pergunta)}</p>
        <div class="acoes">
          <button data-resposta="nao">${escapeHtml(rotuloNao)}</button>
          <button class="primario" data-resposta="sim">${escapeHtml(rotuloSim)}</button>
        </div>
      </div>`;
    overlay.addEventListener('click', (evento) => {
      const alvo = evento.target as HTMLElement;
      if (alvo === overlay) return responder(false);
      const botao = alvo.closest<HTMLElement>('[data-resposta]');
      if (botao) responder(botao.dataset.resposta === 'sim');
    });
    new MutationObserver((_, observador) => {
      if (!overlay.isConnected) {
        observador.disconnect();
        responder(false);
      }
    }).observe(document.body, { childList: true });
  });
}

export function renderEnergia(energia: number, maximo: number): string {
  const pontos = Array.from({ length: maximo }, (_, i) => `<span class="ponto-energia ${i < energia ? 'cheio' : ''}"></span>`).join('');
  return `<div class="energia" title="Energia da estação: atividades, missões, desafios e refino gastam energia. Recarrega ao continuar a história.">Energia ${pontos} ${energia}/${maximo}</div>`;
}
