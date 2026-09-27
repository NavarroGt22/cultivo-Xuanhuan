const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria } = require('../dist/game/story');
const { aplicarEfeitos } = require('../dist/game/effects');
const { gerarProximoEvento } = require('../dist/game/storyEvents');
const { criarHerdeiro } = require('../dist/game/heirs');
const { MORADIAS, precoComDesconto } = require('../dist/game/market');
const { karmaDe, modificadorTribulacaoKarma, nivelKarma } = require('../dist/game/karma');
const {
  ajustarReputacaoSuprema, bloqueioSupremaAnfitria, fatorPrecoSupremas, nivelReputacao,
  processarSupremas, reputacaoSuprema, supremaAnfitria, supremaHostil, supremasDaRegiao,
} = require('../dist/game/supremeSects');

function novo() {
  const origem = { ...rollOrigin(8), tipo: 'familia-comum', regiao: 'central' };
  const c = createCharacter({ nome: 'Lin Feng', genero: 'masculino', traco: TRAITS[0], origem, raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  c.local = { ...c.local, regiao: 'central' };
  const h = iniciarHistoria(c);
  c.idadeMeses = 20 * 12;
  c.inventario.pedrasEspirituais = 5000;
  c.flags.raizRevelada = true;
  return { c, h };
}

test('atos justos agradam as Supremas ortodoxas da região e irritam a demoníaca', () => {
  const { c } = novo();
  const supremas = supremasDaRegiao('central');
  assert.equal(supremas.length, 3);
  aplicarEfeitos(c, { alinhamento: 30 });
  for (const s of supremas) {
    const valor = reputacaoSuprema(c, s.nome);
    assert.ok(s.ortodoxa ? valor > 0 : valor < 0, `${s.nome}: ${valor}`);
  }
  const mensagens = aplicarEfeitos(c, { reputacaoSuprema: { [supremas[0].nome]: 45 } });
  assert.ok(mensagens.some((m) => m.includes(supremas[0].nome) && m.includes('Aliada')));
  assert.equal(nivelReputacao(reputacaoSuprema(c, supremas[0].nome)), 'Aliada');
  assert.equal(ajustarReputacaoSuprema(c, 'Seita Inventada', 10), null);
  ajustarReputacaoSuprema(c, supremas[1].nome, 500);
  assert.equal(reputacaoSuprema(c, supremas[1].nome), 100);
});

test('Suprema hostil: preços mais altos, torre e torneio proibidos e discípulos atrás de você', () => {
  const { c, h } = novo();
  const casa = MORADIAS[3];
  const precoNormal = precoComDesconto(c, casa.preco);
  const anfitria = supremaAnfitria('central');
  assert.equal(bloqueioSupremaAnfitria(c), null);
  for (const s of supremasDaRegiao('central')) ajustarReputacaoSuprema(c, s.nome, -80);
  assert.ok(supremaHostil(c));
  assert.match(bloqueioSupremaAnfitria(c), new RegExp(anfitria.nome));
  assert.equal(fatorPrecoSupremas(c), 1.2);
  assert.ok(precoComDesconto(c, casa.preco) > precoNormal);

  let hostil = 0;
  for (let i = 0; i < 400; i++) if (gerarProximoEvento(c, 100 + i, [], h.mundo).evento === 'suprema-hostil') hostil++;
  assert.ok(hostil > 0, 'o evento de discípulos hostis deveria aparecer');

  c.raizEspiritual.grau = 9;
  for (let i = 0; i < 400; i++) {
    const node = gerarProximoEvento(c, 1000 + i, [], h.mundo);
    if (node.evento !== 'recrutamento') continue;
    assert.ok(!supremasDaRegiao('central').some((s) => node.texto.includes(s.nome)), 'uma Suprema hostil não recruta você');
  }
});

test('a facção fundada paga tributo anual às Supremas; sem pedras, elas se irritam', () => {
  const { c } = novo();
  c.faccao = { tipo: 'cla', nome: 'Clã Lin', membros: 40, ortodoxa: true, fundadaIdadeMeses: c.idadeMeses, instalacoes: {} };
  const antes = c.inventario.pedrasEspirituais;
  assert.equal(processarSupremas(c, 3).length, 0);
  assert.equal(processarSupremas(c, 1).length, 1);
  assert.equal(c.inventario.pedrasEspirituais, antes - 20);
  const nome = supremasDaRegiao('central')[0].nome;
  assert.equal(reputacaoSuprema(c, nome), 3);
  c.inventario.pedrasEspirituais = 0;
  processarSupremas(c, 4);
  assert.equal(reputacaoSuprema(c, nome), -7);
});

test('karma: crueldades pesam na Tribulação Celestial; boas ações aliviam', () => {
  const { c } = novo();
  assert.equal(nivelKarma(c).nome, 'Equilibrado');
  c.feitos = { crueldades: 40, mortes: 20 };
  assert.equal(karmaDe(c), 130);
  assert.equal(nivelKarma(c).nome, 'Muito pesado');
  assert.equal(modificadorTribulacaoKarma(c), 6);
  c.cultivo.estagio = 7; c.cultivo.progresso = 100;
  const tribulacao = gerarProximoEvento(c, 50, [], undefined);
  assert.equal(tribulacao.evento, 'tribulacao');
  assert.match(tribulacao.texto, /karma/);
  const dificuldadeComKarma = tribulacao.escolhas[0].teste.dificuldade;
  c.feitos = { bondades: 60 };
  assert.equal(nivelKarma(c).nome, 'Abençoado pelo Céu');
  const leve = gerarProximoEvento(c, 50, [], undefined);
  assert.equal(dificuldadeComKarma - leve.escolhas[0].teste.dificuldade, 9);
});

test('o herdeiro herda metade da reputação com as Supremas', () => {
  const { c, h } = novo();
  const nome = supremasDaRegiao('central')[0].nome;
  ajustarReputacaoSuprema(c, nome, 60);
  c.relacoes.push({ id: 'filho', nome: 'Lin Hao', tipo: 'Filho(a)', idade: 16, relacao: 70, rank: 1, estagio: 1, raizGrau: 3 });
  const herdeiro = criarHerdeiro(c, h, 'filho');
  assert.equal(reputacaoSuprema(herdeiro.character, nome), 30);
});
