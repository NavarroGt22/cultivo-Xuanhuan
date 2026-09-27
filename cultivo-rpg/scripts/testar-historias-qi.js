const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const story = require('../dist/game/story');
const { usarConsumivel } = require('../dist/game/effects');
const { addItem } = require('../dist/game/inventory');
const { idManual } = require('../dist/game/techniques');
const { interpretarSave } = require('../dist/game/saveLoad');
const qi = require('../dist/game/qiNature');
const nar = require('../dist/game/narrative');

function comum(genero = 'masculino') {
  const c = createCharacter({ nome: 'Lin Feng', genero, traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  return { c, h: story.iniciarHistoria(c) };
}

function his001(genero = 'masculino') {
  const c = createCharacter({ nome: 'Shen Feng', genero, traco: TRAITS[0], origem: nar.origemHis001('Shen Feng'), raizEspiritual: nar.RAIZ_DO_VAZIO, atributosDistribuidos: createBaseAttributes() });
  nar.prepararHis001(c);
  return { c, h: story.iniciarHistoria(c) };
}

/** Joga a campanha escolhendo `escolher(opcoesValidas)` até a pausa. */
function jogar(c, h, escolher = (validas) => validas[0]) {
  const trilha = [];
  for (let i = 0; i < 100 && h.noAtual.id !== nar.CENA_PAUSA; i++) {
    assert.equal(h.noAtual.evento, 'HIS-001', `evento fora da campanha: ${h.noAtual.evento}`);
    trilha.push({ id: h.noAtual.id, idade: Math.floor(c.idadeMeses / 12) });
    const validas = h.noAtual.escolhas.map((e, idx) => ({ e, idx })).filter(({ e }) => !story.descreverEscolha(c, e).bloqueio);
    assert.ok(validas.length, `sem escolha válida em ${h.noAtual.id}`);
    story.resolverEscolha(c, h, escolher(validas).idx);
    assert.ok(!h.desfecho.final, 'o Ato 1 não mata o protagonista');
    story.continuarHistoria(c, h);
  }
  return trilha;
}

// --- Qi (Fase 1) ---
test('natureza do Qi: o corpo muda só a frequência (RNG injetável) e demônio nunca é sorteado', () => {
  assert.equal(qi.sortearNaturezaQi('feminino', () => 0.69), 'yin');
  assert.equal(qi.sortearNaturezaQi('feminino', () => 0.71), 'yang');
  assert.equal(qi.sortearNaturezaQi('masculino', () => 0.29), 'yin');
  assert.equal(qi.sortearNaturezaQi('masculino', () => 0.31), 'yang');
  let yin = 0;
  for (let i = 0; i < 4000; i++) if (qi.sortearNaturezaQi('feminino') === 'yin') yin++;
  assert.ok(yin / 4000 > 0.66 && yin / 4000 < 0.74, `feminino Yin ${yin / 4000}`);
  for (let i = 0; i < 50; i++) assert.ok(['yin', 'yang'].includes(comum(i % 2 ? 'feminino' : 'masculino').c.naturezaQi));
});

test('compatibilidade: universal serve a todos; polaridade oposta é adaptável; demoníaca só para demônios', () => {
  const { c } = comum();
  c.naturezaQi = 'yang';
  assert.equal(qi.avaliarCompatibilidade(c, 'respiracao-nove-nuvens').classe, 'seguro');
  assert.equal(qi.avaliarCompatibilidade(c, 'palma-trovao').classe, 'seguro');
  assert.equal(qi.avaliarCompatibilidade(c, 'sutra-lotus-azul').classe, 'adaptavel');
  const demoniaca = qi.avaliarCompatibilidade(c, 'garras-cadaver');
  assert.equal(demoniaca.executavel, false);
  assert.equal(demoniaca.texto, 'Somente demônios podem completar este ciclo.');
  c.naturezaQi = 'yin';
  assert.equal(qi.avaliarCompatibilidade(c, 'sutra-lotus-azul').classe, 'seguro');
  assert.equal(qi.avaliarCompatibilidade(c, 'palma-trovao').classe, 'adaptavel');
  c.naturezaQi = 'demoniaco-yin';
  assert.equal(qi.avaliarCompatibilidade(c, 'garras-cadaver').classe, 'seguro');
  assert.equal(qi.compatibilidadeDaTecnica('sangue-fervente'), 'yang', 'arte proibida humana não é demoníaca');
  assert.equal(qi.nomeEnergia(1), 'Chakra');
  assert.equal(qi.nomeEnergia(2), 'Star');
});

test('humano pode ler um manual demoníaco, mas não completa a circulação (nem gasta o manual)', () => {
  const { c } = comum();
  const manual = idManual('garras-cadaver');
  addItem(c.inventario, manual, 1);
  const mensagens = usarConsumivel(c, manual);
  assert.ok(mensagens.some((m) => m.includes('Somente demônios')));
  assert.ok(!c.tecnicas.includes('garras-cadaver'));
  assert.ok(c.inventario.itens.some((i) => i.id === manual));
});

test('save antigo sem natureza fica pendente (sem sorteio silencioso) e a migração é idempotente', () => {
  const { c, h } = comum();
  delete c.naturezaQi;
  const uma = interpretarSave(JSON.stringify({ versao: 12, character: c, historia: h }));
  const duas = interpretarSave(JSON.stringify(uma));
  assert.equal(uma.character.naturezaQi, undefined);
  assert.equal(duas.character.naturezaQi, undefined);
  assert.equal(qi.avaliarCompatibilidade(duas.character, 'sutra-lotus-azul').classe, 'desconhecido');
});

// --- Histórias ---
test('HIS-001: nascimento fixo aos 8 anos, sem pedras, com Raiz do Vazio', () => {
  const { c, h } = his001();
  assert.equal(c.historia, 'HIS-001');
  assert.equal(c.idadeMeses, 96);
  assert.equal(c.raizEspiritual.tipo, 'vazio');
  assert.equal(c.origem.tipo, 'familia-comum');
  assert.equal(c.inventario.pedrasEspirituais, 0);
  assert.equal(h.noAtual.id, 'HIS-001-CAP-01-CEN-01');
  assert.match(h.noAtual.titulo, /Capítulo 1/);
  assert.equal(comum().c.narrativa, undefined, 'a História do Pequeno Herói não usa a campanha');
});

test('HIS-001: o Ato 1 inteiro é jogável até a pausa, com idades canônicas e escolhas registradas', () => {
  for (let rodada = 0; rodada < 12; rodada++) {
    const { c, h } = his001(rodada % 2 ? 'feminino' : 'masculino');
    const trilha = jogar(c, h, (validas) => validas[Math.floor(Math.random() * validas.length)]);
    const idade = (prefixo) => trilha.find((t) => t.id.startsWith(prefixo)).idade;
    assert.equal(idade('HIS-001-CAP-01'), 8);
    assert.equal(idade('HIS-001-CAP-03'), 12, 'o massacre acontece aos 12');
    assert.equal(idade('HIS-001-CAP-04-DIA-7'), 12);
    assert.equal(h.noAtual.id, nar.CENA_PAUSA);
    assert.ok(c.narrativa.registro.length >= 28);
    assert.ok(c.narrativa.registro.every((r) => r.escolha.startsWith('HIS-001') && Number.isFinite(r.idadeMeses)));
    assert.ok(c.narrativa.flags['MEMORIA-NITIDA'], 'a tarde do Capítulo 1 vira Memória Nítida');
    assert.ok(c.narrativa.flags['OBJETO-FAMILIAR'], 'a família entrega um objeto antes da fuga');
    assert.ok(c.flags.raizRevelada);
    assert.ok(nar.marcasVisiveis(c).length >= 3);
  }
});

test('HIS-001: requisitos bloqueiam escolhas com motivo visível e as consequências voltam depois', () => {
  const { c } = his001();
  c.narrativa.cena = 'HIS-001-CAP-03-CEN-01';
  const no = nar.noDaNarrativa(c);
  const resistencia = no.escolhas[0];
  assert.match(story.descreverEscolha(c, resistencia).bloqueio, /Exige/);
  assert.equal(story.descreverEscolha(c, no.escolhas[3]).bloqueio, null, 'ficar com a família está sempre disponível');
  c.narrativa.flags['TRACO-CORPO-CAMPONES'] = true;
  assert.equal(story.descreverEscolha(c, nar.noDaNarrativa(c).escolhas[0]).bloqueio, null);

  c.narrativa.cena = 'HIS-001-CAP-03-CEN-04';
  c.narrativa.flags['GRAOS-EXPOSTOS'] = true;
  assert.match(nar.noDaNarrativa(c).texto, /Ma Qiu, o coletor de impostos que você desmascarou/);
});

test('HIS-001: salvar e carregar no meio da campanha continua da mesma cena; a pausa retoma sozinha quando há capítulo novo', () => {
  const { c, h } = his001();
  for (let i = 0; i < 8; i++) {
    story.resolverEscolha(c, h, 0);
    story.continuarHistoria(c, h);
  }
  const cena = c.narrativa.cena;
  const carregado = interpretarSave(JSON.stringify({ versao: 12, character: c, historia: h }));
  assert.equal(carregado.character.narrativa.cena, cena);
  assert.equal(carregado.historia.noAtual.id, cena);
  assert.equal(JSON.stringify(interpretarSave(JSON.stringify(carregado))), JSON.stringify(carregado), 'recarregar não altera nada');

  const { c: pausado } = his001();
  pausado.narrativa.cena = nar.CENA_PAUSA;
  pausado.narrativa.pausadaEm = 'HIS-001-CAP-02-CEN-07';
  assert.equal(nar.noDaNarrativa(pausado).id, 'HIS-001-CAP-03-CEN-01', 'havendo cena seguinte, a pausa se desfaz');
  pausado.narrativa.cena = nar.CENA_PAUSA;
  pausado.narrativa.pausadaEm = 'HIS-001-CAP-04-DIA-7';
  assert.equal(nar.noDaNarrativa(pausado).id, nar.CENA_PAUSA);
});

test('cenas do mesmo dia não passam estação nem renovam energia', () => {
  const { c, h } = his001();
  h.energia = 2;
  const idade = c.idadeMeses;
  story.resolverEscolha(c, h, 0);
  story.continuarHistoria(c, h);
  assert.equal(c.idadeMeses, idade);
  assert.equal(h.energia, 2);
});
