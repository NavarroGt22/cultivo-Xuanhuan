// Executar com Electron; usa uma vida isolada, nunca o save do jogador.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..');
const saida = path.resolve(process.argv[2] || path.join(raiz, 'work', 'verificacao-visual'));
fs.mkdirSync(saida, { recursive: true });
const temporario = fs.mkdtempSync(path.join(saida, 'sessao-'));
process.chdir(temporario);
app.setPath('userData', path.join(temporario, 'electron'));
app.disableHardwareAcceleration();
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria } = require('../dist/game/story');
const { saveGame } = require('../dist/game/saveLoad');
const c = createCharacter({ nome: 'Lin Yue', genero: 'feminino', traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
c.idadeMeses = 192; c.inventario.pedrasEspirituais = 2000; c.contribuicao = 100;
c.afiliacao = { tipo: 'seita', nome: 'Seita do Jade', posto: 'Discípulo Externo', ortodoxa: true, estipendio: 2 };
const h = iniciarHistoria(c);
h.noAtual = { id: 'visual', evento: 'visual', titulo: 'A Cerimônia do Despertar', texto: 'Você chega ao salão ancestral. A pedra acende com uma luz tímida e estável.\n\nO caminho de cultivo começa com uma escolha.', meses: 3, escolhas: [{ texto: 'Jurar em silêncio que vai superar qualquer limite.', resultado: { texto: 'Você dá o primeiro passo.' } }] };
saveGame({ character: c, historia: h, criadoEm: new Date().toISOString() });
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1440, height: 1000, show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, backgroundThrottling: false } });
  const erros = [];
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 3) erros.push(message); });
  const executar = code => win.webContents.executeJavaScript(code);
  const clicar = seletor => executar(`document.querySelector(${JSON.stringify(seletor)}).click()`);
  const foto = async nome => { fs.writeFileSync(path.join(saida, nome), (await win.webContents.capturePage()).toPNG()); };
  try {
    await win.loadFile(path.join(raiz, 'dist/renderer/index.html'));
    await clicar('#btn-continuar');
    for (const largura of [1920, 1440, 1100, 760, 390]) {
      win.setContentSize(largura, 1000);
      await executar('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      const medidas = await executar(`(() => { const r = document.querySelector('.jogo').getBoundingClientRect(); return { largura: innerWidth, total: document.documentElement.scrollWidth, esquerda: r.left, direita: innerWidth - r.right, salvo: document.querySelector('.save-status').textContent }; })()`);
      assert.ok(medidas.total <= medidas.largura, JSON.stringify(medidas));
      assert.ok(Math.abs(medidas.esquerda - medidas.direita) <= 1, JSON.stringify(medidas));
      assert.equal(medidas.salvo, 'Progresso salvo');
      await foto(`jornada-${largura}.png`); console.log('Layout OK', JSON.stringify(medidas));
    }
    win.setContentSize(1440, 1000);
    await clicar('#btn-campos'); await clicar('[data-comprar]'); await clicar('[data-plantar="erva-espiritual"]');
    assert.match(await executar('document.querySelector(".overlay").textContent'), /0\/6 meses/);
    await foto('campos.png'); await clicar('.fechar');
    await clicar('#btn-relacoes'); await clicar('[data-mestre]'); await clicar('[data-mestre-licao]');
    assert.match(await executar('document.querySelector(".mestre-card").textContent'), /Vínculo 25\/100/);
    await foto('mestre.png'); await clicar('.fechar');
    await clicar('#btn-diario');
    assert.match(await executar('document.querySelector(".conteudo-jornada").textContent'), /Ensinamentos do Shifu/);
    await foto('diario.png'); await clicar('.fechar');
    await clicar('#btn-saves');
    assert.equal(await executar('document.querySelectorAll(".save-grid article").length'), 3);
    await foto('saves.png');
    await clicar('[data-slot="2"][data-action="selecionar"]');
    assert.equal(await executar('document.querySelector("#btn-continuar").disabled'), true);
    assert.equal(erros.length, 0, erros.join('\n'));
    console.log('Interface Electron OK: campos, mestre, diário, slots e isolamento do save.');
  } catch (err) { console.error(err); process.exitCode = 1; }
  finally { win.destroy(); app.exit(process.exitCode || 0); }
}).catch(err => { console.error(err); app.exit(1); });
