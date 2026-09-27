import { Character } from '../../game/character';
import {
  AtividadeDisponivel,
  ENERGIA_ATIVIDADE,
  LIMITE_REPETICOES,
  ORDEM_GRUPOS,
  listarAtividades,
} from '../../game/activities';
import { ENERGIA_POR_ESTACAO, StoryState, descreverEscolha, executarEscolha, gastarEnergia } from '../../game/story';
import { criarOverlay, escapeHtml } from './dom';
import { abrirResultado, renderEnergia } from './resultView';
import { registrarJornada } from '../../game/journal';

/** Atividades organizadas em pastas; cada uma custa energia e repetir demais tem consequências. */
export function abrirAtividades(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let listadas: AtividadeDisponivel[] = [];
  let pastaAberta: string | null = null;

  const render = (): void => {
    listadas = listarAtividades(character, historia.contagemAtividades);
    const grupos = ORDEM_GRUPOS.map((grupo) => ({
      grupo,
      itens: listadas.map((item, indice) => ({ ...item, indice })).filter((item) => item.atividade.grupo === grupo),
    })).filter((g) => g.itens.length > 0);

    const semEnergia = historia.energia < ENERGIA_ATIVIDADE;

    const pastas = grupos
      .map(({ grupo, itens }) => {
        const disponiveis = itens.filter((i) => !i.bloqueio).length;
        const aberta = pastaAberta === grupo;
        const conteudo = aberta
          ? `<div class="lista-atividades">${itens
              .map((item) => {
                const info = descreverEscolha(character, item.escolha);
                const motivo = item.bloqueio ?? info.bloqueio ?? (semEnergia ? 'Sem energia nesta estação' : null);
                const contador = item.vezes > 0 ? ` · feita ${item.vezes}×` : '';
                const aviso = item.emExcesso ? ' · ⚠ passou do limite' : item.vezes === LIMITE_REPETICOES - 1 ? ' · última vez sem risco' : '';
                const detalhe = motivo ?? `${info.detalhe ?? ''}${contador}${aviso}`.replace(/^ · /, '');
                return `
                  <button class="escolha atividade ${item.emExcesso ? 'excesso' : ''}" data-indice="${item.indice}" ${motivo ? 'disabled' : ''}>
                    <span>${escapeHtml(item.escolha.texto)}</span>
                    ${detalhe ? `<small>${escapeHtml(detalhe)}</small>` : ''}
                  </button>`;
              })
              .join('')}</div>`
          : '';
        return `
          <div class="pasta ${aberta ? 'aberta' : ''}">
            <button class="pasta-cabecalho" data-pasta="${escapeHtml(grupo)}">
              <span>${aberta ? '▾' : '▸'} ${escapeHtml(grupo)}</span>
              <small>${disponiveis}/${itens.length} disponíveis</small>
            </button>
            ${conteudo}
          </div>`;
      })
      .join('');

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Atividades</h2>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}
        <p class="dica">Cada atividade custa ${ENERGIA_ATIVIDADE} de energia. Repetir a mesma mais de ${LIMITE_REPETICOES} vezes na estação não rende nada — e cultivar ou treinar demais pode causar desvio de qi ou lesão.</p>
        ${pastas}
      </div>`;
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;

    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      return;
    }

    const pasta = alvo.closest<HTMLElement>('[data-pasta]');
    if (pasta) {
      pastaAberta = pastaAberta === pasta.dataset.pasta ? null : (pasta.dataset.pasta ?? null);
      render();
      return;
    }

    const botao = alvo.closest<HTMLButtonElement>('.atividade');
    if (!botao || botao.disabled) return;

    const item = listadas[Number(botao.dataset.indice)];
    if (!item || item.bloqueio || descreverEscolha(character, item.escolha).bloqueio) return;
    if (!gastarEnergia(historia, ENERGIA_ATIVIDADE)) return;

    historia.contagemAtividades[item.atividade.id] = item.vezes + 1;
    const resultado = executarEscolha(character, item.escolha);
    registrarJornada(character, historia, 'atividade', item.escolha.texto, resultado.texto);
    aoAlterar();
    render();
    abrirResultado(resultado, [], item.escolha.texto);
  });

  render();
}
