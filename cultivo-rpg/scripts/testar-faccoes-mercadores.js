const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria, executarEscolha } = require('../dist/game/story');
const { INTERACOES, aceitarDiscipulo, bloqueioBuscarDiscipulo, discipulosDe, gerarCandidatoDiscipulo, limiteDiscipulos, passarTempoRelacoes } = require('../dist/game/relationships');
const { provocarGuerra, rivaisProvocaveis, processarGuerra } = require('../dist/game/clanWar');
const { acharFaccao, avancarFaccoes, faccoesDaRegiao, poderFaccao, rankingFaccoes } = require('../dist/game/regionalFactions');
const { comprarCota, descontoMercador, escolhaContrato, processarMercadores, registrarContrato, venderCota } = require('../dist/game/merchantGroups');
const { MORADIAS, precoComDesconto } = require('../dist/game/market');

function novo() {
  const origem = { ...rollOrigin(8), tipo: 'cla-medio', nomeCasa: 'Clã Xiao', ramo: 'principal' };
  const c = createCharacter({ nome: 'Xiao Yan', genero: 'masculino', traco: TRAITS[0], origem, raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  c.afiliacao = { tipo: 'cla', nome: 'Clã Xiao', ortodoxa: true, posto: 'Ramo Principal', estipendio: 2 };
  const h = iniciarHistoria(c);
  c.idadeMeses = 20 * 12;
  c.inventario.pedrasEspirituais = 5000;
  return { c, h };
}

test('discípulos: só a partir do 3º reino, com limite, e crescem sem passar do mestre', () => {
  const { c } = novo();
  c.reputacao = 50;
  assert.match(bloqueioBuscarDiscipulo(c), /3º reino/);
  c.cultivo.rank = 4;
  assert.equal(limiteDiscipulos(c), 2);
  aceitarDiscipulo(c, gerarCandidatoDiscipulo(c));
  aceitarDiscipulo(c, gerarCandidatoDiscipulo(c));
  assert.equal(discipulosDe(c).length, 2);
  assert.match(bloqueioBuscarDiscipulo(c), /máximo/);
  const discipulo = discipulosDe(c)[0];
  const ensinar = INTERACOES.find((i) => i.id === 'ensinar');
  assert.equal(ensinar.bloqueio(c, discipulo), null);
  const namorar = INTERACOES.find((i) => i.id === 'namorar');
  assert.equal(namorar.bloqueio(c, discipulo), 'Não se aplica');
  for (let i = 0; i < 400; i++) { ensinar.executar(c, discipulo); passarTempoRelacoes(c, 3); }
  assert.ok(discipulo.rank < c.cultivo.rank, `discípulo no reino ${discipulo.rank}, mestre no ${c.cultivo.rank}`);
  assert.ok(discipulo.rank >= 2);
});

test('provocar guerra: rivais do mesmo tipo; vencer faz o clã crescer e dá prestígio', () => {
  const { c, h } = novo();
  const rivais = rivaisProvocaveis(h.mundo, c);
  assert.ok(rivais.length > 0);
  assert.ok(rivais.every((r) => r.faccao.tipo === 'cla'));
  const rival = rivais[0].faccao;
  assert.ok(provocarGuerra(h.mundo, c, rival.nome).length > 0);
  assert.equal(c.guerra.provocada, true);
  const meu = acharFaccao(h.mundo, c.guerra.lado);
  const membrosAntes = meu.membros;
  c.guerra.placar = 4; c.guerra.razao = 0.1;
  for (let i = 0; i < 40 && c.guerra; i++) processarGuerra(h.mundo, c, 1);
  if (c.relacoes.some((r) => r.tipo === 'Vassalo')) {
    assert.ok(meu.membros > membrosAntes);
    assert.ok(Number(c.flags.famaFamiliar) >= 25);
  }
});

test('rankings separam seitas e clãs; clãs raramente superam seitas; Supremas atraem discípulos', () => {
  const { c, h } = novo();
  let clasAcima = 0; let comparacoes = 0;
  for (const regiao of ['central', 'norte', 'sul', 'leste', 'oeste']) {
    const seitas = rankingFaccoes(h.mundo, c, regiao, 'seitas');
    const clas = rankingFaccoes(h.mundo, c, regiao, 'clas');
    assert.ok(seitas.every((e) => e.tipo !== 'cla'));
    assert.ok(clas.every((e) => e.tipo === 'cla'));
    const seitasMenores = seitas.filter((e) => e.tipo === 'seita');
    const medianaSeita = seitasMenores.map((e) => e.poder).sort((a, b) => a - b)[Math.floor(seitasMenores.length / 2)];
    for (const cla of clas) { comparacoes++; if (cla.poder > medianaSeita) clasAcima++; }
  }
  assert.ok(clasAcima / comparacoes < 0.35, `${clasAcima} de ${comparacoes} clãs acima da seita mediana`);
  const regiao = c.local.regiao;
  const suprema = faccoesDaRegiao(h.mundo, regiao).find((f) => f.tipo === 'seita-suprema');
  const antes = suprema.membros;
  for (let i = 0; i < 60; i++) avancarFaccoes(h.mundo, regiao, 3);
  assert.ok((h.mundo.cronicaFaccoes ?? []).some((n) => /atraiu \d+ discípulos/.test(n)) || suprema.membros !== antes);
});

test('grupos mercadores: cotas pagam dividendos, contratos dão reputação e desconto no Mercado', () => {
  const { c, h } = novo();
  comprarCota(c, h.mundo, 'mil-riquezas');
  comprarCota(c, h.mundo, 'mil-riquezas');
  const antes = c.inventario.pedrasEspirituais;
  assert.ok(processarMercadores(h.mundo, c, 1).length === 1);
  assert.ok(c.inventario.pedrasEspirituais > antes);
  venderCota(c, h.mundo, 'mil-riquezas');
  assert.equal(c.mercadores['mil-riquezas'].cotas, 1);
  c.atributosBase.inteligencia = 40;
  for (let i = 0; i < 6; i++) { executarEscolha(c, escolhaContrato(c, 'mil-riquezas')); registrarContrato(c); }
  assert.ok(c.mercadores['mil-riquezas'].reputacao >= 20);
  assert.ok(descontoMercador(c) >= 0.05);
  const casa = MORADIAS[3];
  assert.ok(precoComDesconto(c, casa.preco) < casa.preco);
});

const { fundarFaccao, membrosDaFamilia, processarFaccao, rendaFaccao, sincronizarFamilia } = require('../dist/game/faction');
const { talentoNosReinosAltos } = require('../dist/game/stats');

test('facção fundada: a renda cresce com o reino e a fama do fundador; a família entra sozinha', () => {
  const { c } = novo();
  c.cultivo.rank = 4; c.reputacao = 100;
  c.relacoes.push({ id: 'esposa', nome: 'Gu Yu', tipo: 'Cônjuge', idade: 30, relacao: 80, rank: 3, estagio: 1, aparencia: 70, inteligencia: 60, compatibilidadeElemental: 60 });
  c.relacoes.push({ id: 'filho', nome: 'Shen Zhu', tipo: 'Filho(a)', idade: 8, relacao: 80, rank: 1, estagio: 1, raizGrau: 3 });
  const mensagens = fundarFaccao(c, 'seita', 'Lótus Celeste');
  assert.ok(mensagens.some((m) => m.includes('Gu Yu') && m.includes('Shen Zhu')));
  assert.equal(c.faccao.membros, 10);
  assert.equal(membrosDaFamilia(c), 2);
  assert.equal(sincronizarFamilia(c).length, 0, 'não conta a família duas vezes');
  assert.equal(c.faccao.membros, 10);

  const noQuarto = rendaFaccao(c);
  c.cultivo.rank = 1;
  const noPrimeiro = rendaFaccao(c);
  assert.ok(noQuarto.membros > noPrimeiro.membros * 1.8, 'reino alto rende muito mais por membro');
  assert.equal(noQuarto.prestigio, Math.floor(c.reputacao / 15));

  c.relacoes.find((r) => r.id === 'esposa').tipo = 'Ex';
  sincronizarFamilia(c);
  assert.equal(c.faccao.membros, 9);
  assert.equal(membrosDaFamilia(c), 1);

  const antes = c.inventario.pedrasEspirituais;
  processarFaccao(c, 1);
  assert.ok(c.inventario.pedrasEspirituais > antes);
});

test('cultivo nos reinos altos: raízes melhores rendem mais quanto mais alto o reino', () => {
  const raiz = (grau) => ({ grau, tipo: 'unico', elementos: ['agua'] });
  assert.equal(talentoNosReinosAltos(raiz(3), { rank: 9 }), 1);
  assert.equal(talentoNosReinosAltos(raiz(5), { rank: 1 }), 1);
  assert.ok(Math.abs(talentoNosReinosAltos(raiz(5), { rank: 5 }) - 1.32) < 1e-9);
  assert.ok(talentoNosReinosAltos(raiz(8), { rank: 7 }) > talentoNosReinosAltos(raiz(5), { rank: 7 }));
});
