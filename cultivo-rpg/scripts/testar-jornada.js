// Regressões de diário e compatibilidade de saves. Execute: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria, resolverEscolha } = require('../dist/game/story');
const { registrarJornada, atualizarMarcos, LIMITE_DIARIO } = require('../dist/game/journal');
const { migrarSave } = require('../dist/game/saveMigration');
const { SAVE_VERSION } = require('../dist/shared/types');

function novo() {
  const c = createCharacter({ nome: 'Lin Yue', genero: 'feminino', traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  return { c, h: iniciarHistoria(c) };
}

test('saves antigos recebem um diário sem acontecimentos retroativos', () => {
  const { c, h } = novo();
  h.turno = 12;
  const dados = migrarSave({ versao: SAVE_VERSION - 1, character: c, historia: h });
  assert.ok(dados);
  atualizarMarcos(dados.character, dados.historia);
  assert.equal(dados.historia.diario.length, 1);
  assert.match(dados.historia.diario[0].texto, /anteriores não estão disponíveis/);
  atualizarMarcos(dados.character, dados.historia);
  assert.equal(dados.historia.diario.length, 1);
});

test('uma escolha registra um único desfecho, inclusive após clique duplicado', () => {
  const { c, h } = novo();
  h.noAtual = { id: 'teste', evento: 'teste', titulo: 'Um encontro', texto: 'Olá', meses: 3, escolhas: [{ texto: 'Aceitar o conselho', resultado: { texto: 'Você aprende com o mestre.' } }] };
  resolverEscolha(c, h, 0);
  resolverEscolha(c, h, 0);
  assert.equal(h.diario.length, 1);
  assert.match(h.diario[0].texto, /Aceitar o conselho/);
  assert.match(h.diario[0].texto, /aprende com o mestre/);
});

test('escolhas bloqueadas não entram no diário', () => {
  const { c, h } = novo();
  h.noAtual.escolhas = [{ texto: 'Comprar', requisito: { pedras: 1000000 }, resultado: { texto: 'Comprado' } }];
  resolverEscolha(c, h, 0);
  assert.equal(h.diario, undefined);
});

test('avanço e viagem geram marcos apenas uma vez e sobrevivem à serialização', () => {
  const { c, h } = novo();
  atualizarMarcos(c, h);
  c.cultivo.estagio += 1;
  c.local.cidade = 'Cidade das Mil Ervas';
  atualizarMarcos(c, h);
  assert.equal(h.diario.length, 3);
  const salvo = JSON.parse(JSON.stringify({ versao: SAVE_VERSION, character: c, historia: h }));
  const carregado = migrarSave(salvo);
  atualizarMarcos(carregado.character, carregado.historia);
  assert.equal(carregado.historia.diario.length, 3);
  assert.equal(carregado.historia.diario[2].titulo, 'Novos horizontes');
});

test('diário mantém os registros mais recentes sem crescer indefinidamente', () => {
  const { c, h } = novo();
  for (let i = 0; i < LIMITE_DIARIO + 50; i++) registrarJornada(c, h, 'atividade', `Atividade ${i}`, 'Resultado');
  assert.equal(h.diario.length, LIMITE_DIARIO);
  assert.equal(h.diario[0].titulo, 'Atividade 50');
  assert.equal(h.diario.at(-1).titulo, `Atividade ${LIMITE_DIARIO + 49}`);
});
