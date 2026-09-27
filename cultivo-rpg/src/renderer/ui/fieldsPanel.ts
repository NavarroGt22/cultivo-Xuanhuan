import type { Character } from '../../game/character';
import type { StoryState } from '../../game/story';
import { PLANTIOS, comprarCampo, custoCampo, plantar } from '../../game/fields';
import { criarOverlay, escapeHtml } from './dom';
import { avisar } from './resultView';

export function abrirCampos(c: Character, h: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  const render = (): void => {
    const bloqueado = !!h.desfecho?.final;
    overlay.innerHTML = `<section class="painel painel-jornada"><button class="fechar" aria-label="Fechar">×</button>
      <p class="eyebrow">Patrimônio da família</p><h2>Campos espirituais</h2>
      <p class="descricao">Os campos são automáticos: quando a plantação amadurece, a colheita vai sozinha para a bolsa e o campo é replantado.
      Um campo vazio planta sozinho a melhor semente que seu reino permite, sem gastar mais da metade das suas pedras. Escolha uma semente para fixar o que cada campo planta. Seus herdeiros recebem os campos.</p>
      <p>${c.inventario.pedrasEspirituais} pedras</p>
      <button data-comprar ${bloqueado || c.idadeMeses < 144 || (c.campos?.length ?? 0) >= 3 || c.inventario.pedrasEspirituais < custoCampo(c) ? 'disabled' : ''}>Comprar campo · ${custoCampo(c)} pedras</button>
      ${c.idadeMeses < 144 ? '<p class="dica">Disponível a partir dos 12 anos.</p>' : ''}
      <div class="campos-grid">${(c.campos ?? []).map((campo, i) => {
        const planta = PLANTIOS.find(p => p.id === campo.cultivo);
        const preferida = PLANTIOS.find(p => p.id === campo.preferido);
        return `<article class="guia-item"><p class="eyebrow">Campo ${i + 1} · replanta: ${escapeHtml(preferida?.nome ?? 'a melhor possível')}</p><h3>${planta?.nome ?? 'Terra esperando sementes'}</h3>${planta
          ? `<progress class="campo-progresso" aria-label="Maturação" max="${planta.meses}" value="${campo.meses}"></progress><p>${campo.meses}/${planta.meses} meses · ${planta.quantidade} unidade(s) — colheita automática</p>`
          : '<p class="dica">Vai plantar sozinho na próxima estação, se houver pedras. Ou escolha agora:</p>'}
          <div class="acoes">${PLANTIOS.map(p => `<button data-plantar="${p.id}" data-campo="${i}" ${bloqueado || c.cultivo.rank < p.rank || (!planta && c.inventario.pedrasEspirituais < p.custo) ? 'disabled' : ''} title="${p.meses} meses · Reino ${p.rank}">${planta ? 'Replantar sempre' : 'Plantar'}: ${p.nome} · ${p.custo} pedras</button>`).join('')}</div></article>`;
      }).join('') || '<p class="estado-vazio">Adquira seu primeiro campo para cultivar ingredientes.</p>'}</div></section>`;
  };
  overlay.addEventListener('click', e => {
    const alvo = e.target as HTMLElement;
    if (alvo === overlay || alvo.closest('.fechar')) { overlay.remove(); return; }
    const b = alvo.closest<HTMLButtonElement>('button'); if (!b || b.disabled) return;
    let mensagem: string;
    if (b.hasAttribute('data-comprar')) mensagem = comprarCampo(c, h);
    else if (b.dataset.plantar) {
      const campo = c.campos?.[Number(b.dataset.campo)];
      const planta = PLANTIOS.find(p => p.id === b.dataset.plantar);
      if (campo?.cultivo && planta) {
        campo.preferido = planta.id;
        mensagem = `Quando a plantação atual for colhida, este campo passa a replantar ${planta.nome}.`;
      } else mensagem = plantar(c, h, Number(b.dataset.campo), b.dataset.plantar);
    } else return;
    aoAlterar(); render(); avisar([mensagem]);
  });
  render();
}
