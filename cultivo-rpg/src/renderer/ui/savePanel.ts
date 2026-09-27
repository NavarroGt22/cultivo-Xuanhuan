import { SLOTS, SaveSlot, exportarSave, getSlotAtivo, importarSave, loadGame, selecionarSlot, usandoBackup } from '../../game/saveLoad';
import { criarOverlay, escapeHtml } from './dom';
import { confirmar } from './resultView';

export function abrirSaves(aoEscolher: () => void): void {
  const overlay = criarOverlay();
  let mensagem = '';
  const render = (): void => {
    overlay.innerHTML = `<section class="painel painel-jornada"><button class="fechar" aria-label="Fechar">×</button>
      <p class="eyebrow">Suas vidas, guardadas</p><h2>Jornadas salvas</h2>
      <p class="descricao">Três slots independentes. Escolha um slot vazio para começar outra vida. O slot 1 conserva seu save original.</p>
      <p role="status">${escapeHtml(mensagem)}</p><div class="save-grid">${SLOTS.map(slot => {
        const d = loadGame(slot);
        return `<article class="guia-item"><p class="eyebrow">Slot ${slot}${slot === getSlotAtivo() ? ' · atual' : ''}</p>
          <h3>${d ? escapeHtml(d.character.nome) : 'Uma história por escrever'}</h3>
          <p>${d ? `${Math.floor(d.character.idadeMeses / 12)} anos · Capítulo ${d.historia.turno + 1}` : 'Vazio'}</p>
          ${usandoBackup(slot) ? '<p class="aviso">Recuperado da cópia de segurança.</p>' : ''}
          <div class="acoes"><button data-slot="${slot}" data-action="selecionar">${d ? 'Continuar' : 'Usar este slot'}</button>
          <button data-slot="${slot}" data-action="exportar" ${d ? '' : 'disabled'}>Exportar</button>
          <button data-slot="${slot}" data-action="importar">Importar</button></div></article>`;
      }).join('')}</div></section>`;
  };
  overlay.addEventListener('click', e => {
    const alvo = e.target as HTMLElement;
    if (alvo === overlay || alvo.closest('.fechar')) { overlay.remove(); return; }
    const b = alvo.closest<HTMLButtonElement>('[data-action]');
    if (!b || b.disabled) return;
    const slot = Number(b.dataset.slot) as SaveSlot;
    try {
      if (b.dataset.action === 'selecionar') {
        selecionarSlot(slot); overlay.remove(); aoEscolher(); return;
      }
      if (b.dataset.action === 'exportar') {
        const url = URL.createObjectURL(new Blob([exportarSave(slot)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `xuanhuan-slot-${slot}.json`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      if (b.dataset.action === 'importar') {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
        input.addEventListener('change', async () => {
          const file = input.files?.[0]; if (!file) return;
          try {
            if (file.size > 20 * 1024 * 1024) throw new Error('O arquivo excede 20 MB.');
            if (loadGame(slot) && !(await confirmar(`Substituir a jornada do slot ${slot}? A versão anterior ficará no backup.`, 'Substituir'))) return;
            importarSave(await file.text(), slot);
            selecionarSlot(slot); overlay.remove(); aoEscolher(); return;
          } catch (err) { mensagem = err instanceof Error ? err.message : 'Falha ao importar.'; }
          render();
        });
        input.click();
      }
    } catch (err) { mensagem = err instanceof Error ? err.message : 'Não foi possível acessar o save.'; render(); }
  });
  render();
}
