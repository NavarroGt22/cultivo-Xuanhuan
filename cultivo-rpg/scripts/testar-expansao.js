const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria, continuarHistoria, resolverEscolha } = require('../dist/game/story');
const { comprarCampo, plantar, colher, amadurecerCampos } = require('../dist/game/fields');
const { tornarDiscipulo, receberLicao } = require('../dist/game/mentor');
const { rosterDaSeita } = require('../dist/game/worldState');
const { criarHerdeiro } = require('../dist/game/heirs');
const saves = require('../dist/game/saveLoad');

function novo() {
  const c = createCharacter({ nome: 'Lin Yue', genero: 'feminino', traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  const h = iniciarHistoria(c); c.idadeMeses = 144; c.inventario.pedrasEspirituais = 2000;
  return { c, h };
}
test('slots isolados, backup recuperável e importação inválida não substitui a vida', () => {
  const anterior = process.cwd();
  const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanhuan-saves-'));
  process.chdir(temporario);
  try {
    const { c, h } = novo();
    const dados = { character: c, historia: h, criadoEm: new Date().toISOString() };
    saves.saveGame(dados, 1);
    c.nome = 'Outra vida'; saves.saveGame(dados, 2);
    assert.equal(saves.loadGame(1).character.nome, 'Lin Yue');
    assert.equal(saves.loadGame(2).character.nome, 'Outra vida');
    assert.throws(() => saves.importarSave('{"versao":12,"character":{},"historia":{}}', 1));
    assert.equal(saves.loadGame(1).character.nome, 'Lin Yue');
    saves.importarSave(saves.exportarSave(1), 3);
    assert.equal(saves.loadGame(3).character.nome, 'Lin Yue');
    saves.saveGame(dados, 1);
    fs.writeFileSync('save.json', '{truncado');
    assert.equal(saves.usandoBackup(1), true);
    assert.equal(saves.loadGame(1).character.nome, 'Lin Yue');
    saves.saveGame(dados, 1);
    assert.equal(saves.loadGame(1).character.nome, 'Outra vida');
    assert.equal(JSON.parse(fs.readFileSync('save.json.bak')).character.nome, 'Lin Yue');
    assert.throws(() => saves.selecionarSlot(99));
    const ruim = JSON.parse(saves.exportarSave(1)); ruim.historia.diario = [{}];
    assert.throws(() => saves.importarSave(JSON.stringify(ruim), 1));
    const renomear = fs.renameSync;
    fs.renameSync = () => { throw new Error('Falha de gravação simulada'); };
    try {
      c.nome = 'Não deve substituir';
      assert.throws(() => saves.saveGame(dados, 1), /Falha de gravação/);
      assert.equal(saves.loadGame(1).character.nome, 'Outra vida');
    } finally { fs.renameSync = renomear; }
  } finally { process.chdir(anterior); fs.rmSync(temporario, { recursive: true }); }
});
test('campos cobram recursos, colhem e replantam sozinhos sem duplicar colheitas', () => {
  const { c, h } = novo();
  comprarCampo(c, h); assert.equal(c.inventario.pedrasEspirituais, 1850);
  plantar(c, h, 0, 'erva-espiritual'); assert.equal(h.energia, 5, 'plantar não gasta energia');
  assert.equal(c.inventario.pedrasEspirituais, 1842);
  plantar(c, h, 0, 'erva-espiritual'); assert.equal(c.inventario.pedrasEspirituais, 1842, 'campo ocupado não planta de novo');
  assert.match(colher(c, h, 0), /não está pronta/);
  assert.equal(amadurecerCampos(c, 3).length, 0);
  assert.equal(amadurecerCampos(c, 3).length, 1, 'colheita automática ao amadurecer');
  assert.equal(c.inventario.itens.find(i => i.id === 'erva-espiritual').quantidade, 3);
  assert.equal(c.campos[0].cultivo, 'erva-espiritual', 'replanta sozinho a semente escolhida');
  assert.equal(amadurecerCampos(c, 3).length, 0);
  colher(c, h, 0);
  assert.equal(c.inventario.itens.find(i => i.id === 'erva-espiritual').quantidade, 3, 'não duplica');
  const outro = novo();
  comprarCampo(outro.c, outro.h); plantar(outro.c, outro.h, 0, 'erva-1000-anos'); assert.equal(outro.c.campos[0].cultivo, null, 'erva de 1000 anos exige reino 5');
  comprarCampo(c, h); comprarCampo(c, h); comprarCampo(c, h); assert.equal(c.campos.length, 3);
});
test('avanço real da história amadurece os campos uma única vez', () => {
  const { c, h } = novo(); comprarCampo(c, h); plantar(c, h, 0, 'erva-espiritual');
  h.noAtual = { id: 'teste', evento: 'teste', titulo: 'Estação', texto: 'Tempo', meses: 3, escolhas: [{ texto: 'Esperar', resultado: { texto: 'Passou' } }] };
  resolverEscolha(c, h, 0); continuarHistoria(c, h); continuarHistoria(c, h);
  assert.equal(c.campos[0].meses, 3);
});
test('mestre requer contribuição, limita orientação e desativa ao deixar a seita', () => {
  const { c, h } = novo();
  c.afiliacao = { tipo: 'seita', nome: 'Seita do Jade', posto: 'Discípulo Externo', ortodoxa: true, estipendio: 2 };
  const anciao = rosterDaSeita(h.mundo, c).membros.find(m => m.posto === 'Ancião');
  tornarDiscipulo(c, h, anciao.id); assert.equal(c.mestrePessoal, undefined);
  c.contribuicao = 50; tornarDiscipulo(c, h, anciao.id); assert.equal(c.contribuicao, 0);
  c.cultivo.toxina = 10; receberLicao(c, h); const progresso = c.cultivo.progresso;
  assert.equal(h.energia, 4); assert.equal(c.cultivo.toxina, 8);
  receberLicao(c, h); assert.equal(h.energia, 4); assert.equal(c.cultivo.progresso, progresso);
  c.afiliacao.nome = 'Outra seita'; h.turno++;
  assert.match(receberLicao(c, h), /inativo/); assert.equal(h.energia, 4);
});
test('herdeiro recebe campos e crônicas sem compartilhar objetos da vida anterior', () => {
  const { c, h } = novo(); comprarCampo(c, h); plantar(c, h, 0, 'erva-espiritual');
  c.relacoes.push({ id: 'filha', nome: 'Lin Mei', tipo: 'Filho(a)', idade: 16, relacao: 70, rank: 1, estagio: 1, raizGrau: 3 });
  const filho = criarHerdeiro(c, h, 'filha'); assert.ok(filho);
  assert.equal(filho.historia.ancestrais.length, 1);
  assert.equal(filho.historia.ancestrais[0].nome, c.nome);
  assert.equal(filho.character.campos[0].cultivo, 'erva-espiritual');
  filho.character.campos[0].meses = 99; assert.equal(c.campos[0].meses, 0);
  filho.historia.ancestrais[0].registros[0].titulo = 'Alterado'; assert.notEqual(h.diario[0].titulo, 'Alterado');
  assert.equal(filho.character.mestrePessoal, undefined);
});
test('vida encerrada bloqueia compras e ações novas', () => {
  const { c, h } = novo(); h.desfecho = { final: true };
  assert.match(comprarCampo(c, h), /terminou/); assert.equal(c.campos, undefined);
  assert.match(receberLicao(c, h), /terminou/);
});
