const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter, getEffectiveAttributes } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria } = require('../dist/game/story');
const { aplicarEfeitos } = require('../dist/game/effects');
const { gerarProximoEvento } = require('../dist/game/storyEvents');
const { criarHerdeiro } = require('../dist/game/heirs');
const { INTERACOES, conhecerAlguem } = require('../dist/game/relationships');
const { BONUS_ELEMENTO_ESTACAO, avancarCalendario, bonusCultivoEstacao, estacaoAtual } = require('../dist/game/seasons');
const {
  companheirosDeJornada, curaCompanheiros, fatorEmboscadaCompanheiros, gerarCompanheiroErrante,
  limiteCompanheiros, processarCompanheiros,
} = require('../dist/game/journeyCompanions');
const { entradasCodex, registrarNoCodex } = require('../dist/game/codex');

function novo() {
  const origem = { ...rollOrigin(8), tipo: 'familia-comum' };
  const c = createCharacter({ nome: 'Lin Feng', genero: 'masculino', traco: TRAITS[0], origem, raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  const h = iniciarHistoria(c);
  c.idadeMeses = 20 * 12;
  c.inventario.pedrasEspirituais = 1000;
  c.flags.raizRevelada = true;
  return { c, h };
}
const interacao = (id) => INTERACOES.find((i) => i.id === id);

test('calendário: as estações giram, cada uma favorece um elemento e o clima muda com elas', () => {
  const { c, h } = novo();
  assert.equal(estacaoAtual(h.mundo).id, 'primavera');
  avancarCalendario(h.mundo, 10);
  assert.equal(h.mundo.mesDoAno, 10);
  assert.equal(estacaoAtual(h.mundo).id, 'inverno');
  assert.ok(['normal', 'mare', 'seca'].includes(h.mundo.clima));
  avancarCalendario(h.mundo, 3);
  assert.equal(estacaoAtual(h.mundo).id, 'primavera');

  h.mundo.mesDoAno = 10; h.mundo.clima = 'normal';
  c.raizEspiritual.elementos = ['agua'];
  assert.equal(bonusCultivoEstacao(c, h.mundo), BONUS_ELEMENTO_ESTACAO);
  c.raizEspiritual.elementos = ['fogo'];
  assert.equal(bonusCultivoEstacao(c, h.mundo), 0);
  h.mundo.clima = 'mare';
  assert.ok(bonusCultivoEstacao(c, h.mundo) > 0);
});

test('eventos de estação só aparecem na época certa', () => {
  const { c, h } = novo();
  h.mundo.mesDoAno = 10;
  const vistos = new Set();
  for (let i = 0; i < 600; i++) vistos.add(gerarProximoEvento(c, 100 + i, [], h.mundo).evento);
  assert.ok(vistos.has('lotus-inverno'));
  assert.ok(!vistos.has('flor-sol') && !vistos.has('orvalho-primavera') && !vistos.has('colheita-outono'));
});

test('companheiros: convite, bônus do papel, lealdade que reage aos seus atos e limite do grupo', () => {
  const { c } = novo();
  const amigo = conhecerAlguem(c);
  amigo.relacao = 40;
  assert.equal(interacao('convidar-jornada').bloqueio(c, amigo), 'Requer relação 50');
  amigo.relacao = 60;
  assert.equal(interacao('convidar-jornada').bloqueio(c, amigo), null);
  const antes = getEffectiveAttributes(c);
  interacao('convidar-jornada').executar(c, amigo);
  assert.equal(amigo.tipo, 'Companheiro de Jornada');
  assert.ok(amigo.papel && amigo.lealdade > 0);
  const depois = getEffectiveAttributes(c);
  const soma = (a) => Object.values(a).reduce((s, v) => s + v, 0);
  assert.ok(soma(depois) - soma(antes) >= 2, 'o papel soma atributos');

  amigo.papel = 'batedor';
  assert.equal(fatorEmboscadaCompanheiros(c), 0.7);
  amigo.papel = 'curandeiro';
  assert.equal(curaCompanheiros(c), 15);
  amigo.lealdade = 95;
  assert.equal(curaCompanheiros(c), 30, 'Irmão de Armas dobra o bônus');

  amigo.caminho = 'ortodoxo'; amigo.lealdade = 60;
  aplicarEfeitos(c, { alinhamento: -20 });
  assert.equal(amigo.lealdade, 54, 'ortodoxo desaprova crueldade');
  amigo.caminho = 'demoniaco';
  aplicarEfeitos(c, { alinhamento: -20 });
  assert.equal(amigo.lealdade, 60, 'demoníaco aprova');

  const pedras = c.inventario.pedrasEspirituais;
  interacao('dividir-espolios').executar(c, amigo);
  assert.equal(amigo.lealdade, 72);
  assert.ok(c.inventario.pedrasEspirituais < pedras);

  for (let i = companheirosDeJornada(c).length; i < limiteCompanheiros(c); i++) aplicarEfeitos(c, { companheiroJornada: gerarCompanheiroErrante(c) });
  assert.equal(companheirosDeJornada(c).length, limiteCompanheiros(c));
  const mensagens = aplicarEfeitos(c, { companheiroJornada: gerarCompanheiroErrante(c) });
  assert.ok(mensagens.some((m) => m.includes('cheio')));
  assert.equal(companheirosDeJornada(c).length, limiteCompanheiros(c));

  interacao('dispensar-jornada').executar(c, amigo);
  assert.ok(!amigo.papel);
  assert.equal(amigo.tipo, 'Amigo');
});

test('companheiro negligenciado trai; caminhos opostos brigam', () => {
  const { c } = novo();
  const a = gerarCompanheiroErrante(c); a.caminho = 'ortodoxo'; a.lealdade = 80;
  const b = gerarCompanheiroErrante(c); b.caminho = 'demoniaco'; b.lealdade = 80;
  c.relacoes.push(a, b);
  let brigas = 0;
  for (let i = 0; i < 20; i++) brigas += processarCompanheiros(c, 1).filter((m) => m.includes('brigaram')).length;
  assert.ok(brigas > 0);

  a.lealdade = 0;
  const pedras = c.inventario.pedrasEspirituais;
  for (let i = 0; i < 40 && c.relacoes.some((r) => r.id === a.id); i++) processarCompanheiros(c, 1);
  assert.ok(!c.relacoes.some((r) => r.id === a.id), 'quem tem lealdade zero acaba traindo');
  assert.ok(c.inventario.pedrasEspirituais < pedras);
});

test('codex: registra o que aparece nos textos e passa ao herdeiro', () => {
  const { c, h } = novo();
  const avisos = registrarNoCodex(h.mundo, c, 'Um emissário da Seita da Espada Imortal fala do Pavilhão do Mar de Nuvens.');
  assert.ok(avisos[0].startsWith('Novo no Codex'));
  assert.ok(entradasCodex(h.mundo, 'supremas').includes('Seita da Espada Imortal'));
  assert.ok(entradasCodex(h.mundo, 'supremas').includes('Pavilhão do Mar de Nuvens'));
  assert.equal(entradasCodex(h.mundo, 'regioes').length, 1, 'a região atual entra sozinha');
  assert.equal(registrarNoCodex(h.mundo, c, 'Seita da Espada Imortal outra vez').length, 0, 'sem aviso repetido');

  c.relacoes.push({ id: 'filho', nome: 'Lin Hao', tipo: 'Filho(a)', idade: 16, relacao: 70, rank: 1, estagio: 1, raizGrau: 3 });
  const herdeiro = criarHerdeiro(c, h, 'filho');
  assert.ok(entradasCodex(herdeiro.historia.mundo, 'supremas').includes('Seita da Espada Imortal'));
});
