import { Character } from '../game/character';
import {
  StoryState,
  continuarHistoria,
  descreverEscolha,
  iniciarHistoria,
  resolverEscolha,
} from '../game/story';
import { saveGame, loadGame, hasSave } from '../game/saveLoad';
import { renderCriacao } from './ui/creation';
import { renderHud } from './ui/hud';
import { abrirInventario } from './ui/inventoryPanel';
import { abrirAtividades } from './ui/activitiesPanel';
import { abrirOcupacao } from './ui/occupationPanel';
import { ehDiscipulo } from '../game/sect';
import { ENERGIA_POR_ESTACAO } from '../game/story';
import { estadoCampanha } from '../game/campaign';
import { abrirMissoes } from './ui/missionsPanel';
import { abrirRankings } from './ui/rankingsPanel';
import { abrirRelacoes } from './ui/relationsPanel';
import { abrirOficios, temOficio } from './ui/alchemyPanel';
import { precisaReproduzir, reproduzirCombate } from './ui/combatPlayer';
import { imagemOpcional } from './ui/assets';
import { abrirMundo } from './ui/worldPanel';
import { abrirMercado } from './ui/marketPanel';
import { torneioAberto } from '../game/tournaments';
import { criarHerdeiro, herdeirosDisponiveis } from '../game/heirs';
import { grauRaizInfo } from '../game/spiritualRoot';
import { escapeHtml } from './ui/dom';

const app = document.getElementById('app') as HTMLElement;

let character: Character;
let historia: StoryState;

/** Texto de evento: parágrafos separados por linha em branco e **negrito**. */
function formatarTexto(texto: string): string {
  return escapeHtml(texto)
    .split('\n\n')
    .map((paragrafo) => `<p>${paragrafo.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    .join('');
}

function iniciarNovoJogo(): void {
  renderCriacao(
    app,
    (novoPersonagem) => {
      character = novoPersonagem;
      historia = iniciarHistoria(character);
      renderJogo();
    },
    renderTelaInicial,
  );
}

function continuarJogo(): void {
  const dados = loadGame();
  if (dados) {
    character = dados.character;
    historia = dados.historia;
    renderJogo();
  }
}

function renderTelaInicial(): void {
  const temSave = hasSave();
  app.innerHTML = `
    <div class="tela-inicial">
      <h1>Xuanhuan RPG</h1>
      <button id="btn-continuar" class="primario" ${temSave ? '' : 'disabled title="Nenhum jogo salvo ainda"'}>Continuar</button>
      <button id="btn-novo">Novo Jogo</button>
      <p class="dica">O jogo salva automaticamente a cada escolha.</p>
    </div>
  `;

  document.getElementById('btn-novo')?.addEventListener('click', iniciarNovoJogo);
  document.getElementById('btn-continuar')?.addEventListener('click', continuarJogo);
}

function renderEvento(): string {
  const no = historia.noAtual;
  const avisos = historia.avisos.length
    ? `<div class="avisos">${historia.avisos.map((a) => `<p>${escapeHtml(a)}</p>`).join('')}</div>`
    : '';

  const escolhas = no.escolhas
    .map((escolha, indice) => {
      const info = descreverEscolha(character, escolha);
      const detalhe = info.bloqueio ?? info.detalhe;
      return `
        <button class="escolha" data-indice="${indice}" ${info.bloqueio ? 'disabled' : ''}>
          <span>${escapeHtml(escolha.texto)}</span>
          ${detalhe ? `<small>${escapeHtml(detalhe)}</small>` : ''}
        </button>`;
    })
    .join('');

  const cena = imagemOpcional(`cenas/${no.evento}.png`, 'ilustracao');
  const texto = no.personagem
    ? `<div class="caixa-dialogo">
         ${no.personagem.retrato ? imagemOpcional(`retratos/${no.personagem.retrato}`, 'retrato-personagem') : ''}
         <div class="fala">
           <p class="nome-personagem">${escapeHtml(no.personagem.nome)}</p>
           <div class="texto-narrativa">${formatarTexto(no.texto)}</div>
         </div>
       </div>`
    : `<div class="texto-narrativa">${formatarTexto(no.texto)}</div>`;

  return `
    ${avisos}
    ${cena}
    <h2 class="titulo-evento">${escapeHtml(no.titulo)}</h2>
    ${texto}
    <div class="escolhas">${escolhas}</div>`;
}

function renderDesfecho(): string {
  const d = historia.desfecho;
  if (!d) return '';

  if (precisaReproduzir(d.combate)) {
    return `
      <h2 class="titulo-evento">${escapeHtml(historia.noAtual.titulo)}</h2>
      <div id="reproducao-combate"></div>`;
  }

  const log = d.log.length
    ? `<details class="log-combate">
         <summary>Registro da luta (${d.log.length} ações)</summary>
         ${d.log.map((linha) => `<p>${escapeHtml(linha)}</p>`).join('')}
       </details>`
    : '';

  return `
    <h2 class="titulo-evento">${escapeHtml(historia.noAtual.titulo)}</h2>
    ${d.resumo ? `<p class="mensagem-teste">${escapeHtml(d.resumo)}</p>` : ''}
    ${log}
    <div class="texto-narrativa">${formatarTexto(d.texto)}</div>
    ${d.mensagens.length ? `<div class="mensagens">${d.mensagens.map((m) => `<p>${escapeHtml(m)}</p>`).join('')}</div>` : ''}
    <div class="escolhas">
      ${d.final ? renderFimDeVida() : '<button id="btn-continuar-historia" class="primario">Continuar</button>'}
    </div>`;
}

function renderFimDeVida(): string {
  const herdeiros = herdeirosDisponiveis(character);
  const linhagem = String(character.flags.linhagem ?? character.nome).split('|').join(' → ');
  const botoes = herdeiros
    .map(
      (filho) => `
        <button class="escolha" data-herdeiro="${filho.id}">
          <span>Continuar como ${escapeHtml(filho.nome)}</span>
          <small>${Math.floor(filho.idade)} anos · Raiz Grau ${filho.raizGrau ?? '?'} (${escapeHtml(grauRaizInfo(filho.raizGrau ?? 1).nome)})</small>
        </button>`,
    )
    .join('');
  return `
    <p class="fim"><em>Fim da vida de ${escapeHtml(character.nome)}.</em></p>
    <p class="dica">Linhagem: ${escapeHtml(linhagem)}</p>
    ${
      herdeiros.length
        ? `<h3>Herdeiros</h3><p class="dica">O herdeiro recebe metade das pedras, os artefatos, os manuais das suas técnicas, a arte marcial da família, a besta companheira e parte da sua fama — que murcha se a nova geração não fizer o próprio nome.</p>${botoes}`
        : '<p class="dica">Sem filhos, a linhagem termina aqui.</p>'
    }
    <button id="btn-novo-jogo">Começar uma vida nova (outra família)</button>`;
}

function salvar(): void {
  saveGame({ character, historia, criadoEm: new Date().toISOString() });
}

/** Toda mudança de estado passa por aqui, então salvar aqui é o autosave. */
function renderJogo(): void {
  salvar();
  const temRecompensa = estadoCampanha(character, historia.mundo).some((e) => e.status === 'concluido');
  app.innerHTML = `
    <div class="jogo">
      ${renderHud(character)}
      <main class="painel-narrativa">
        ${historia.desfecho ? renderDesfecho() : renderEvento()}
      </main>
      <nav class="barra-inferior">
        <button id="btn-atividades" ${historia.energia > 0 ? 'class="destaque"' : ''}>Atividades (${historia.energia}/${ENERGIA_POR_ESTACAO})</button>
        <button id="btn-missoes" ${temRecompensa ? 'class="destaque"' : ''}>Missões${temRecompensa ? ' ★' : ''}</button>
        <button id="btn-mundo" ${torneioAberto(historia) && character.idadeMeses >= 14 * 12 ? 'class="destaque"' : ''}>Mundo</button>
        <button id="btn-rankings">Rankings</button>
        <button id="btn-relacoes">Relações</button>
        <button id="btn-ocupacao">${ehDiscipulo(character) ? 'Seita e Ocupação' : 'Ocupação'}</button>
        ${temOficio(character) ? '<button id="btn-alquimia">Ofícios</button>' : ''}
        <button id="btn-mercado">Mercado</button>
        <button id="btn-inventario">Inventário</button>
        <button id="btn-salvar">Salvar</button>
        <button id="btn-menu">Menu</button>
      </nav>
    </div>
  `;

  const areaCombate = document.getElementById('reproducao-combate');
  if (areaCombate && historia.desfecho?.combate) {
    reproduzirCombate(areaCombate, historia.desfecho.combate, renderJogo);
  }

  document.querySelectorAll<HTMLButtonElement>('.escolha[data-indice]').forEach((botao) => {
    botao.addEventListener('click', () => {
      resolverEscolha(character, historia, Number(botao.dataset.indice));
      renderJogo();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-herdeiro]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const resultado = criarHerdeiro(character, historia, botao.dataset.herdeiro ?? '');
      if (!resultado) return;
      character = resultado.character;
      historia = resultado.historia;
      renderJogo();
    });
  });

  document.getElementById('btn-continuar-historia')?.addEventListener('click', () => {
    continuarHistoria(character, historia);
    renderJogo();
  });

  document.getElementById('btn-novo-jogo')?.addEventListener('click', iniciarNovoJogo);
  document.getElementById('btn-inventario')?.addEventListener('click', () => abrirInventario(character, renderJogo));
  document.getElementById('btn-atividades')?.addEventListener('click', () => abrirAtividades(character, historia, renderJogo));
  document.getElementById('btn-ocupacao')?.addEventListener('click', () => abrirOcupacao(character, renderJogo));
  document.getElementById('btn-missoes')?.addEventListener('click', () => abrirMissoes(character, historia, renderJogo));
  document.getElementById('btn-rankings')?.addEventListener('click', () => abrirRankings(character, historia, renderJogo));
  document.getElementById('btn-mundo')?.addEventListener('click', () => abrirMundo(character, historia, renderJogo));
  document.getElementById('btn-relacoes')?.addEventListener('click', () => abrirRelacoes(character, historia, renderJogo));
  document.getElementById('btn-alquimia')?.addEventListener('click', () => abrirOficios(character, historia, renderJogo));
  document.getElementById('btn-mercado')?.addEventListener('click', () => abrirMercado(character, renderJogo));

  document.getElementById('btn-salvar')?.addEventListener('click', () => {
    salvar();
    alert('Jogo salvo!');
  });

  document.getElementById('btn-menu')?.addEventListener('click', renderTelaInicial);
}

renderTelaInicial();
