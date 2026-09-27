import { Character } from '../game/character';
import {
  StoryState,
  continuarHistoria,
  descreverEscolha,
  iniciarHistoria,
  resolverEscolha,
} from '../game/story';
import { saveGame, loadGame, hasSave, getSlotAtivo } from '../game/saveLoad';
import { abrirSaves } from './ui/savePanel';
import { abrirCampos } from './ui/fieldsPanel';
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
import { abrirBestiario } from './ui/bestiaryPanel';
import { abrirCodex } from './ui/codexPanel';
import { confirmar } from './ui/resultView';
import { torneioAberto } from '../game/tournaments';
import { criarHerdeiro, herdeirosDisponiveis } from '../game/heirs';
import { grauRaizInfo } from '../game/spiritualRoot';
import { escapeHtml } from './ui/dom';
import { atualizarMarcos } from '../game/journal';
import { abrirDiario, abrirGuia } from './ui/journeyPanel';
import { aplicarPreferencias, abrirPreferencias } from './ui/preferences';
import { icone, renderPainelJornada } from './ui/journeyDashboard';

const app = document.getElementById('app') as HTMLElement;

let character: Character;
let historia: StoryState;
let avisoSave = '';

function notificar(texto: string): void {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = texto;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function botaoNav(id: string, texto: string, badge = ''): string {
  return `<button id="btn-${id}" class="nav-item">${icone(id)}<span>${texto}</span>${badge ? `<small class="nav-badge">${badge}</small>` : ''}</button>`;
}

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
  const dados = temSave ? loadGame() : null;
  app.innerHTML = `
    <main class="tela-inicial">
      <div class="paisagem" aria-hidden="true"><div class="sol"></div><div class="montanha distante"></div><div class="montanha media"></div><div class="montanha perto"></div></div>
      <div class="intro-jogo"><p class="eyebrow">Crônicas de um mundo imortal</p><div class="selo-dao" aria-hidden="true">${icone('jornada')}</div>
        <h1>XUANHUAN</h1><p class="intro-subtitulo">Entre o céu e a eternidade.</p>
        <p class="intro-descricao">Cultive seu poder. Escreva seu destino.<br>Deixe um legado que atravesse gerações.</p>
        <div class="menu-acoes"><button id="btn-continuar" class="primario" ${temSave ? '' : 'disabled title="Nenhum jogo salvo ainda"'}>Continuar jornada <span aria-hidden="true">→</span></button>
        ${dados ? `<p class="save-resumo">${escapeHtml(dados.character.nome)} · ${Math.floor(dados.character.idadeMeses / 12)} anos · Capítulo ${dados.historia.turno + 1}</p>` : ''}
        <button id="btn-novo">Iniciar uma nova vida</button><button id="btn-saves">Jornadas salvas · Slot ${getSlotAtivo()}</button></div>
        <div class="intro-links"><button id="btn-guia" class="link-botao">Guia do cultivador</button><span>·</span><button id="btn-opcoes" class="link-botao">Opções de leitura</button></div>
      </div><footer class="intro-rodape"><span>13 reinos · 5 regiões · Infinitos destinos</span><span>Salvamento automático a cada escolha</span></footer>
    </main>`;
  document.getElementById('btn-novo')?.addEventListener('click', async () => {
    if (temSave && !(await confirmar('Iniciar uma nova vida substituirá o save atual quando a criação for concluída. Deseja continuar?', 'Nova vida'))) return;
    iniciarNovoJogo();
  });
  document.getElementById('btn-continuar')?.addEventListener('click', continuarJogo);
  document.getElementById('btn-saves')?.addEventListener('click', () => abrirSaves(() => hasSave() ? continuarJogo() : renderTelaInicial()));
  document.getElementById('btn-guia')?.addEventListener('click', abrirGuia);
  document.getElementById('btn-opcoes')?.addEventListener('click', abrirPreferencias);
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
          <span class="escolha-titulo"><small class="numero-escolha">${String(indice + 1).padStart(2, '0')}</small>${escapeHtml(escolha.texto)}<span class="seta-escolha" aria-hidden="true">↗</span></span>
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
    <div class="bloco-escolhas"><p class="eyebrow escolha-rotulo">Qual será sua decisão?</p><div class="escolhas">${escolhas}</div></div>`;
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
    <div class="${d.final ? '' : 'bloco-escolhas '}escolhas">
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
  try {
    saveGame({ character, historia, criadoEm: new Date().toISOString() });
    avisoSave = '';
  } catch {
    avisoSave = 'Não foi possível salvar. Verifique o espaço e a permissão da pasta do jogo.';
  }
}

/**
 * Recria a tela e deixa a história no centro: o evento (texto + escolhas) fica centralizado na tela;
 * se for mais alto que ela, o começo do texto fica no topo. A barra lateral mantém a rolagem.
 */
function centralizarHistoria(desenhar: () => void): void {
  const lateralY = document.querySelector<HTMLElement>('.sidebar')?.scrollTop ?? 0;

  desenhar();

  const lateral = document.querySelector<HTMLElement>('.sidebar');
  if (lateral) lateral.scrollTop = lateralY;
  const evento = document.querySelector<HTMLElement>('.evento-conteudo');
  const area = document.querySelector<HTMLElement>('.area-jogo');
  if (!evento || !area) return;

  const margem = 12;
  const altura = evento.offsetHeight;
  const rolaNaArea = getComputedStyle(area).overflowY !== 'visible' && area.scrollHeight > area.clientHeight;
  if (rolaNaArea) {
    const topo = evento.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop;
    const visivel = area.clientHeight;
    area.scrollTop = Math.max(0, altura + margem * 2 <= visivel ? topo - (visivel - altura) / 2 : topo - margem);
  } else {
    const topo = evento.getBoundingClientRect().top + window.scrollY;
    const visivel = window.innerHeight;
    window.scrollTo(window.scrollX, Math.max(0, altura + margem * 2 <= visivel ? topo - (visivel - altura) / 2 : topo - margem));
  }
}

/** Toda mudança de estado passa por aqui, então salvar aqui é o autosave. */
function renderJogo(): void {
  atualizarMarcos(character, historia);
  salvar();
  centralizarHistoria(desenharJogo);
}

function desenharJogo(): void {
  const temRecompensa = estadoCampanha(character, historia.mundo).some((e) => e.status === 'concluido');
  app.innerHTML = `
    <div class="jogo">
      <aside class="sidebar">
        <a class="marca" href="#narrativa" aria-label="Ir para a narrativa"><span class="marca-selo">${icone('jornada')}</span><span>XUANHUAN<small>CRÔNICAS DO CULTIVO</small></span></a>
        <nav class="navegacao" aria-label="Navegação do jogo"><p class="nav-grupo">Sua jornada</p>
          <a href="#narrativa" class="nav-item atual" aria-current="page">${icone('jornada')}<span>Jornada</span><span class="ponto-atual"></span></a>
          ${botaoNav('atividades', 'Atividades', String(historia.energia))}
          ${botaoNav('missoes', 'Missões', temRecompensa ? '★' : '')}
          ${botaoNav('diario', 'Diário')}
          <p class="nav-grupo">Além dos portões</p>
          ${botaoNav('mundo', 'Mundo', torneioAberto(historia) && character.idadeMeses >= 14 * 12 ? '•' : '')}
          ${botaoNav('rankings', 'Rankings')}
          ${botaoNav('relacoes', 'Relações')}
          ${botaoNav('ocupacao', ehDiscipulo(character) ? 'Seita e ocupação' : 'Ocupação')}
          ${temOficio(character) ? botaoNav('alquimia', 'Ofícios') : ''}
          ${botaoNav('mercado', 'Mercado')}
          ${botaoNav('campos', 'Campos espirituais')}
          ${botaoNav('inventario', 'Inventário')}
        </nav>
        <div class="sidebar-rodape">${botaoNav('saves', 'Jornadas salvas')}${botaoNav('guia', 'Guia do cultivador')}${botaoNav('bestiario', 'Bestiário')}${botaoNav('codex', 'Codex')}${botaoNav('opcoes', 'Opções de leitura')}${botaoNav('menu', 'Menu inicial')}</div>
      </aside>
      <div class="area-jogo"><div class="centro-jornada">
        <header class="topbar"><div><span class="eyebrow">O livro da sua vida</span><h1>Sua jornada</h1></div><div class="topbar-direita"><span class="save-status ${avisoSave ? 'erro' : ''}" role="status">${avisoSave ? 'Falha ao salvar' : 'Progresso salvo'}</span><button id="btn-salvar" class="botao-salvar">${icone('salvar')} Salvar</button></div></header>
        ${avisoSave ? `<p class="erro-save" role="alert">${escapeHtml(avisoSave)}</p>` : ''}
        ${renderHud(character, historia.mundo)}
        <div class="conteudo-jogo">
          <main class="painel-narrativa" id="narrativa" tabindex="-1">
            <div class="banner-jornada"><div class="paisagem" aria-hidden="true"><div class="sol"></div><div class="montanha distante"></div><div class="montanha media"></div><div class="montanha perto"></div></div>
              <div class="banner-texto"><span class="eyebrow">Capítulo ${String(historia.turno + 1).padStart(2, '0')}</span><p>Cada escolha ecoa<br>pela eternidade.</p></div><span class="banner-selo" aria-hidden="true">${icone('jornada')}</span></div>
            <article class="evento-conteudo">${historia.desfecho ? renderDesfecho() : renderEvento()}</article>
            <footer class="narrativa-rodape"><span>Uma vida. Mil possibilidades.</span><button class="link-botao" data-abrir="diario">Abrir crônicas →</button></footer>
          </main>
          ${renderPainelJornada(character, historia)}
        </div>
      </div></div>
    </div>`;

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
  document.getElementById('btn-ocupacao')?.addEventListener('click', () => abrirOcupacao(character, historia, renderJogo));
  document.getElementById('btn-missoes')?.addEventListener('click', () => abrirMissoes(character, historia, renderJogo));
  document.getElementById('btn-rankings')?.addEventListener('click', () => abrirRankings(character, historia, renderJogo));
  document.getElementById('btn-mundo')?.addEventListener('click', () => abrirMundo(character, historia, renderJogo));
  document.getElementById('btn-relacoes')?.addEventListener('click', () => abrirRelacoes(character, historia, renderJogo));
  document.getElementById('btn-alquimia')?.addEventListener('click', () => abrirOficios(character, historia, renderJogo));
  document.getElementById('btn-mercado')?.addEventListener('click', () => abrirMercado(character, historia, renderJogo));
  document.getElementById('btn-campos')?.addEventListener('click', () => abrirCampos(character, historia, renderJogo));
  document.getElementById('btn-saves')?.addEventListener('click', () => abrirSaves(() => hasSave() ? continuarJogo() : renderTelaInicial()));

  document.getElementById('btn-salvar')?.addEventListener('click', () => {
    salvar();
    notificar(avisoSave || 'Jornada salva com sucesso.');
    const status = document.querySelector('.save-status');
    if (status) { status.textContent = avisoSave ? 'Falha ao salvar' : 'Progresso salvo'; status.classList.toggle('erro', Boolean(avisoSave)); }
  });

  document.getElementById('btn-diario')?.addEventListener('click', () => abrirDiario(historia));
  document.getElementById('btn-guia')?.addEventListener('click', abrirGuia);
  document.getElementById('btn-bestiario')?.addEventListener('click', () => abrirBestiario(character, renderJogo, historia));
  document.getElementById('btn-codex')?.addEventListener('click', () => abrirCodex(character, historia));
  document.getElementById('btn-opcoes')?.addEventListener('click', abrirPreferencias);
  document.querySelectorAll<HTMLElement>('[data-abrir]').forEach(botao => botao.addEventListener('click', () => document.getElementById(`btn-${botao.dataset.abrir}`)?.click()));
  document.getElementById('btn-menu')?.addEventListener('click', renderTelaInicial);
}

aplicarPreferencias();
renderTelaInicial();
