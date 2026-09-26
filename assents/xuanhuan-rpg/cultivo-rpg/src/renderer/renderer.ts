import { CLASSES } from '../game/classes';
import { createCharacter, Character, getEffectiveAttributes } from '../game/character';
import { STORY, resolverEscolha, StoryNode } from '../game/story';
import { saveGame, loadGame, hasSave } from '../game/saveLoad';
import { alignmentLabel } from '../game/alignment';

const app = document.getElementById('app') as HTMLElement;

let character: Character;
let noAtualId: string;
let ultimaMensagemTeste: string | undefined;

function iniciarNovoJogo(): void {
  // Terceiro argumento é opcional — nome de um arquivo em /assets (ex: 'protagonista.png').
  character = createCharacter('Viajante Sem Nome', CLASSES[0]);
  noAtualId = 'inicio';
  ultimaMensagemTeste = undefined;
  renderJogo();
}

function continuarJogo(): void {
  const dados = loadGame();
  if (dados) {
    character = dados.character;
    noAtualId = dados.noAtualId;
    renderJogo();
  }
}

function renderTelaInicial(): void {
  app.innerHTML = `
    <div class="tela-inicial">
      <h1>Xuanhuan RPG</h1>
      <button id="btn-novo">Novo Jogo</button>
      ${hasSave() ? '<button id="btn-continuar">Continuar</button>' : ''}
    </div>
  `;

  document.getElementById('btn-novo')?.addEventListener('click', iniciarNovoJogo);
  document.getElementById('btn-continuar')?.addEventListener('click', continuarJogo);
}

function renderJogo(): void {
  const no: StoryNode = STORY[noAtualId];
  const atributos = getEffectiveAttributes(character);

  const listaAtributos = Object.entries(atributos)
    .map(([chave, valor]) => `<span>${chave}: ${valor}</span>`)
    .join('');

  const escolhasHtml = no.escolhas
    .map((escolha, indice) => `<button class="escolha" data-indice="${indice}">${escolha.texto}</button>`)
    .join('');

  const retratoProtagonista = character.retrato
    ? `<img class="retrato-protagonista" src="../../assets/${character.retrato}" alt="${character.nome}" />`
    : '';

  const caixaDialogo = no.personagem
    ? `
      <div class="caixa-dialogo">
        ${
          no.personagem.retrato
            ? `<img class="retrato-personagem" src="../../assets/${no.personagem.retrato}" alt="${no.personagem.nome}" />`
            : ''
        }
        <div class="fala">
          <p class="nome-personagem">${no.personagem.nome}</p>
          <p class="texto-narrativa">${no.texto}</p>
        </div>
      </div>
    `
    : `<p class="texto-narrativa">${no.texto}</p>`;

  app.innerHTML = `
    <div class="jogo">
      <aside class="painel-personagem">
        ${retratoProtagonista}
        <h2 class="nome-personagem">${character.nome}</h2>
        <p>Classe: ${character.classe.nome}</p>
        <p>Alinhamento: ${alignmentLabel(character.alinhamento)} (${character.alinhamento.valor})</p>
        <div class="atributos">${listaAtributos}</div>
        <button id="btn-salvar">Salvar</button>
      </aside>
      <main class="painel-narrativa">
        ${no.imagem ? `<img class="ilustracao" src="../../assets/${no.imagem}" alt="" />` : ''}
        ${ultimaMensagemTeste ? `<p class="mensagem-teste">${ultimaMensagemTeste}</p>` : ''}
        ${caixaDialogo}
        <div class="escolhas">${no.final ? '<p><em>Fim.</em></p>' : escolhasHtml}</div>
      </main>
    </div>
  `;

  document.querySelectorAll<HTMLButtonElement>('.escolha').forEach((botao) => {
    botao.addEventListener('click', (evento) => {
      const indice = Number((evento.currentTarget as HTMLElement).dataset.indice);
      const escolha = no.escolhas[indice];
      const resultado = resolverEscolha(character, escolha);
      noAtualId = resultado.novoNoId;
      ultimaMensagemTeste = resultado.mensagemTeste;
      renderJogo();
    });
  });

  document.getElementById('btn-salvar')?.addEventListener('click', () => {
    saveGame({ character, noAtualId, criadoEm: new Date().toISOString() });
    alert('Jogo salvo!');
  });
}

renderTelaInicial();
