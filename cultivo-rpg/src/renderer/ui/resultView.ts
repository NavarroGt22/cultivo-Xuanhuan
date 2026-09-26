import type { DesfechoExibido } from '../../game/story';
import { escapeHtml } from './dom';
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

export function renderEnergia(energia: number, maximo: number): string {
  const pontos = Array.from({ length: maximo }, (_, i) => `<span class="ponto-energia ${i < energia ? 'cheio' : ''}"></span>`).join('');
  return `<div class="energia" title="Energia da estação: atividades, missões, desafios e refino gastam energia. Recarrega ao continuar a história.">Energia ${pontos} ${energia}/${maximo}</div>`;
}
