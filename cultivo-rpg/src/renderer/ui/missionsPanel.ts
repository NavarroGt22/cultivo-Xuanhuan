import { Character } from '../../game/character';
import { estadoCampanha, resgatarObjetivo } from '../../game/campaign';
import { ENERGIA_MISSAO, aleijarNpc, escolhaDaMissao } from '../../game/bounties';
import { motivoBloqueioDestruirNucleo } from '../../game/coreDestruction';
import { aplicarEfeitos } from '../../game/effects';
import { npcsDaRegiao } from '../../game/worldState';
import { ehDiscipulo } from '../../game/sect';
import { DesfechoExibido, ENERGIA_POR_ESTACAO, StoryState, descreverEscolha, executarEscolha, gastarEnergia } from '../../game/story';
import { criarOverlay, escapeHtml } from './dom';
import { ativarReproducao, renderEnergia, renderMensagens, renderResultado } from './resultView';

const ROTULO_STATUS = {
  resgatado: '✓ Concluído',
  concluido: '★ Pronto para resgatar',
  'em-andamento': '… Em andamento',
  bloqueado: '🔒 Bloqueado',
} as const;

export function abrirMissoes(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let mensagens: string[] = [];
  let resultado: DesfechoExibido | null = null;
  const destruir = new Set<number>();

  const render = (): void => {
    const mundo = historia.mundo;
    let arcoAtual = '';
    const campanha = estadoCampanha(character, mundo)
      .map(({ objetivo, status }) => {
        const cabecalho = objetivo.arco !== arcoAtual ? `<h3>${escapeHtml(objetivo.arco)}</h3>` : '';
        arcoAtual = objetivo.arco;
        const oculto = status === 'bloqueado';
        return `
          ${cabecalho}
          <div class="objetivo ${status}">
            <div>
              <strong>${oculto ? '???' : escapeHtml(objetivo.titulo)}</strong>
              <small>${ROTULO_STATUS[status]}</small>
            </div>
            <p>${oculto ? 'Conclua o objetivo anterior para revelar.' : escapeHtml(objetivo.descricao)}</p>
            ${oculto ? '' : `<small>Recompensa: ${escapeHtml(objetivo.textoRecompensa)}</small>`}
            ${status === 'concluido' ? `<button class="primario" data-resgatar="${objetivo.id}">Resgatar recompensa</button>` : ''}
          </div>`;
      })
      .join('');

    const semEnergia = historia.energia < ENERGIA_MISSAO;
    const quadro = mundo.quadro.length
      ? mundo.quadro
          .map((missao, indice) => {
            const info = descreverEscolha(character, escolhaDaMissao(missao));
            return `
              <div class="objetivo">
                <div><strong>${escapeHtml(missao.titulo)}</strong><small>${escapeHtml(missao.cultivo)}</small></div>
                <p>${escapeHtml(missao.descricao)}</p>
                <small>${escapeHtml(info.detalhe ?? '')}</small>
                ${
                  missao.npcId
                    ? `<label class="opcao"><input type="checkbox" data-destruir="${indice}" ${destruir.has(indice) ? 'checked' : ''} ${
                        motivoBloqueioDestruirNucleo(character, missao.inimigo.rank, missao.inimigo.estagio) ? 'disabled' : ''
                      } /> Duelo Demoníaco: destruir o núcleo se vencer (alinhamento −25, Inimigo Jurado${
                        character.afiliacao.ortodoxa && ehDiscipulo(character) ? ', expulsão da seita' : ''
                      })</label>`
                    : ''
                }
                <button data-missao="${indice}" ${semEnergia ? 'disabled' : ''}>${semEnergia ? 'Sem energia' : `Aceitar (${ENERGIA_MISSAO} de energia)`}</button>
              </div>`;
          })
          .join('')
      : '<p class="vazio-texto">O quadro aparece depois da Cerimônia do Despertar e se renova a cada 4 estações.</p>';

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Missões</h2>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}
        ${renderMensagens(mensagens)}
        ${resultado ? renderResultado(resultado) : ''}
        <h3>Quadro de missões — ${escapeHtml(character.local.cidade)}</h3>
        <div class="lista-objetivos">${quadro}</div>
        <h2 class="subtitulo">Campanha</h2>
        <div class="lista-objetivos">${campanha}</div>
      </div>`;
    ativarReproducao(overlay, resultado, render);
  };

  overlay.addEventListener('change', (evento) => {
    const alvo = evento.target as HTMLInputElement;
    if (alvo.dataset.destruir === undefined) return;
    const indice = Number(alvo.dataset.destruir);
    if (alvo.checked) destruir.add(indice);
    else destruir.delete(indice);
  });

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;

    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      return;
    }

    const resgatar = alvo.closest<HTMLElement>('[data-resgatar]');
    const aceitar = alvo.closest<HTMLButtonElement>('[data-missao]');

    if (resgatar?.dataset.resgatar) {
      mensagens = resgatarObjetivo(character, historia.mundo, resgatar.dataset.resgatar);
      resultado = null;
    } else if (aceitar && !aceitar.disabled) {
      const indice = Number(aceitar.dataset.missao);
      const missao = historia.mundo.quadro[indice];
      if (!missao || !gastarEnergia(historia, ENERGIA_MISSAO)) return;
      resultado = executarEscolha(character, escolhaDaMissao(missao));
      mensagens = [];
      if (resultado.vitoria) {
        if (missao.npcId && destruir.has(indice)) {
          const npc = npcsDaRegiao(historia.mundo, character.local.regiao).find((n) => n.id === missao.npcId);
          if (npc) aleijarNpc(npc);
          mensagens = aplicarEfeitos(character, {
            destruirNucleo: { nome: missao.inimigo.nome, afiliacao: missao.npcAfiliacao ?? '', rank: missao.inimigo.rank },
          });
        }
        historia.mundo.quadro.splice(indice, 1);
      }
      destruir.clear();
    } else {
      return;
    }

    aoAlterar();
    render();
    overlay.querySelector('.painel')?.scrollTo({ top: 0 });
  });

  render();
}
