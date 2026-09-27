// Playwright/Edge: adaptador fs em memória para testar o renderer sem Electron.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..');
const saida = path.resolve(process.argv[2] || path.join(raiz, 'work', 'verificacao-visual'));
fs.mkdirSync(saida, { recursive: true });
const fontes = {};
function coletar(pasta) {
  for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
    const nome = path.join(pasta, item.name);
    if (item.isDirectory()) coletar(nome);
    else if (nome.endsWith('.js')) fontes['/' + path.relative(path.join(raiz, 'dist'), nome).replaceAll('\\', '/')] = fs.readFileSync(nome, 'utf8');
  }
}
coletar(path.join(raiz, 'dist'));
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria } = require('../dist/game/story');
const c = createCharacter({ nome: 'Lin Yue', genero: 'feminino', traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
c.idadeMeses = 192; c.inventario.pedrasEspirituais = 2000; c.contribuicao = 100;
c.afiliacao = { tipo: 'seita', nome: 'Seita do Jade', posto: 'Discípulo Externo', ortodoxa: true, estipendio: 2 };
const h = iniciarHistoria(c);
h.noAtual = { id: 'visual', evento: 'visual', titulo: 'A Cerimônia do Despertar', texto: 'Você chega ao salão ancestral. A pedra acende com uma luz tímida e estável.\n\nO caminho de cultivo começa com uma escolha.', meses: 3, escolhas: [{ texto: 'Jurar em silêncio que vai superar qualquer limite.', resultado: { texto: 'Você dá o primeiro passo.' } }] };
h.ancestrais = [{ nome: 'Lin An', idadeMeses: 960, reino: 'Martial Master', reputacao: 150, registros: [{ turno: 1, idadeMeses: 240, categoria: 'marco', titulo: 'A fundação do clã', texto: 'Um legado para as gerações.' }] }];
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage(); const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.addInitScript(({ fontes, save }) => {
      const arquivos = { '/save.json': save }; const cache = {};
      const normalizar = valor => { const partes = []; for (const parte of valor.split('/')) { if (parte === '..') partes.pop(); else if (parte && parte !== '.') partes.push(parte); } return '/' + partes.join('/'); };
      const vfs = { existsSync: n => n in arquivos, readFileSync: n => { if (!(n in arquivos)) throw Error('ENOENT'); return arquivos[n]; }, writeFileSync: (n, v) => arquivos[n] = v, copyFileSync: (a, b) => arquivos[b] = arquivos[a], renameSync: (a, b) => { arquivos[b] = arquivos[a]; delete arquivos[a]; }, readdirSync: () => [] };
      window.process = { cwd: () => '/' };
      const carregar = (id, origem = '/renderer/index.js') => {
        if (id === 'fs') return vfs;
        if (id === 'path') return { join: (...partes) => normalizar(partes.join('/')) };
        let nome = normalizar(origem.slice(0, origem.lastIndexOf('/') + 1) + id);
        if (!nome.endsWith('.js')) nome += '.js';
        if (cache[nome]) return cache[nome].exports;
        if (!(nome in fontes)) throw Error('Módulo ausente: ' + nome);
        const modulo = { exports: {} }; cache[nome] = modulo;
        new Function('require', 'module', 'exports', fontes[nome])(proximo => carregar(proximo, nome), modulo, modulo.exports);
        return modulo.exports;
      };
      window.require = carregar;
    }, { fontes, save: JSON.stringify({ versao: 12, character: c, historia: h, criadoEm: new Date().toISOString() }) });
    await page.goto('file:///' + path.join(raiz, 'dist/renderer/index.html').replaceAll('\\', '/'));
    await page.locator('#btn-continuar').click();
    for (const largura of [1920, 1440, 1100, 760, 390]) {
      await page.setViewportSize({ width: largura, height: 1000 });
      const medidas = await page.evaluate(() => { const r = document.querySelector('.jogo').getBoundingClientRect(); return { largura: innerWidth, total: document.documentElement.scrollWidth, esquerda: r.left, direita: innerWidth - r.right, salvo: document.querySelector('.save-status').textContent }; });
      assert.ok(medidas.total <= medidas.largura, JSON.stringify(medidas));
      assert.ok(Math.abs(medidas.esquerda - medidas.direita) <= 1, JSON.stringify(medidas));
      assert.equal(medidas.salvo, 'Progresso salvo');
      await page.screenshot({ path: path.join(saida, `jornada-${largura}.png`), fullPage: true }); console.log('Layout OK', JSON.stringify(medidas));
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#btn-campos').click(); await page.locator('[data-comprar]').click(); await page.locator('[data-plantar="erva-espiritual"]').click();
    assert.match(await page.locator('.overlay').textContent(), /0\/6 meses/);
    await page.screenshot({ path: path.join(saida, 'campos.png') }); await page.locator('.fechar').click();
    await page.locator('#btn-relacoes').click(); await page.locator('[data-mestre]').first().click(); await page.locator('[data-mestre-licao]').click();
    assert.match(await page.locator('.mestre-card').textContent(), /Vínculo 25\/100/);
    await page.screenshot({ path: path.join(saida, 'mestre.png') }); await page.locator('.fechar').click();
    await page.locator('#btn-diario').click(); assert.match(await page.locator('.conteudo-jornada').textContent(), /Ensinamentos do Shifu/);
    await page.getByLabel('Vida consultada', { exact: true }).selectOption('0');
    assert.match(await page.locator('.conteudo-jornada').textContent(), /fundação do clã/);
    await page.screenshot({ path: path.join(saida, 'diario.png') }); await page.keyboard.press('Escape');
    await page.locator('#btn-opcoes').click(); await page.locator('#pref-fonte').selectOption('grande'); await page.keyboard.press('Escape');
    for (const largura of [1440, 760, 390]) { await page.setViewportSize({ width: largura, height: 1000 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#btn-saves').click(); assert.equal(await page.locator('.save-grid article').count(), 3);
    await page.screenshot({ path: path.join(saida, 'saves.png') });
    await page.locator('[data-slot="2"][data-action="selecionar"]').click(); assert.ok(await page.locator('#btn-continuar').isDisabled());
    await page.locator('#btn-saves').click();
    const arquivoDownload = page.waitForEvent('download');
    await page.locator('[data-slot="1"][data-action="exportar"]').click();
    const download = await arquivoDownload;
    const exportado = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exportado.character.nome, 'Lin Yue');
    const invalido = page.waitForEvent('filechooser');
    await page.locator('[data-slot="2"][data-action="importar"]').click();
    await (await invalido).setFiles({ name: 'invalido.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await page.getByRole('status').filter({ hasText: 'incompatível' }).waitFor();
    const valido = page.waitForEvent('filechooser');
    await page.locator('[data-slot="2"][data-action="importar"]').click();
    exportado.character.nome = 'Jornada importada';
    await (await valido).setFiles({ name: 'vida.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exportado)) });
    await page.locator('.hud-nome').filter({ hasText: 'Jornada importada' }).waitFor();
    assert.equal(await page.evaluate(() => window.require('../game/saveLoad').loadGame(1).character.nome), 'Lin Yue');
    assert.deepEqual(erros, []);
    console.log('Interface OK: campos, mestre, diário ancestral, fonte ampliada, slots e isolamento do save.');
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exit(1); });
