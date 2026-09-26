import { Character } from '../../game/character';
import { TITULO_RANKING, TipoRanking, ranking } from '../../game/rankings';
import { REGIOES } from '../../game/world';
import { StoryState } from '../../game/story';
import { criarOverlay, escapeHtml } from './dom';

const TAMANHO_TOP = 10;

export function abrirRankings(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let aba: TipoRanking = 'forca';

  const render = (): void => {
    const lista = ranking(historia.mundo, character, aba);
    const posicao = lista.findIndex((e) => e.jogador);
    const top = lista.slice(0, TAMANHO_TOP);

    const linhas = top
      .map(
        (entrada, i) => `
        <tr class="${entrada.jogador ? 'linha-jogador' : ''}">
          <td>#${i + 1}</td>
          <td>${escapeHtml(entrada.nome)}</td>
          <td>${escapeHtml(entrada.detalhe)}</td>
          <td>${escapeHtml(entrada.afiliacao)}</td>
        </tr>`,
      )
      .join('');

    const suaPosicao =
      posicao < 0
        ? `<p class="dica">${aba === 'alquimia' ? 'Aprenda Alquimia para entrar neste ranking.' : aba === 'talento' ? 'Só entram cultivadores de até 40 anos com a raiz revelada.' : ''}</p>`
        : posicao >= TAMANHO_TOP
          ? `<p class="dica">Sua posição: <strong>#${posicao + 1}</strong> de ${lista.length}.</p>`
          : '';

    const abas = (Object.keys(TITULO_RANKING) as TipoRanking[])
      .map((tipo) => `<button class="aba ${tipo === aba ? 'ativa' : ''}" data-aba="${tipo}">${TITULO_RANKING[tipo]}</button>`)
      .join('');

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Rankings — ${escapeHtml(REGIOES[character.local.regiao].nome)}</h2>
        <div class="abas">${abas}</div>
        <table class="tabela-ranking">
          <thead><tr><th></th><th>Nome</th><th>${aba === 'alquimia' ? 'Título' : 'Cultivo'}</th><th>Afiliação</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
        ${suaPosicao}
        <p class="dica">Os cultivadores da região também cultivam com o tempo. Duelos no quadro de missões enfrentam pessoas desta lista.</p>
      </div>`;
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      aoAlterar();
      return;
    }
    const botaoAba = alvo.closest<HTMLElement>('[data-aba]');
    if (botaoAba?.dataset.aba) {
      aba = botaoAba.dataset.aba as TipoRanking;
      render();
    }
  });

  render();
}
