const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria } = require('../dist/game/story');
const { aplicarEfeitos } = require('../dist/game/effects');
const { arranjarNoivado, crescerNoivado, forcaRelativa } = require('../dist/game/betrothal');
const { escolherRival, iniciarGuerra, processarGuerra, podeTerGuerra, proporTregua } = require('../dist/game/clanWar');
const { rankingFaccoes, faccoesDaRegiao } = require('../dist/game/regionalFactions');
const { ranking } = require('../dist/game/rankings');

function novo(tipo = 'cla-grande') {
  const origem = { ...rollOrigin(8), tipo, nomeCasa: 'Clã Xiao', ramo: 'principal' };
  const c = createCharacter({ nome: 'Xiao Yan', genero: 'masculino', traco: TRAITS[0], origem, raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  c.afiliacao = { tipo: 'cla', nome: 'Clã Xiao', ortodoxa: true, posto: 'Ramo Principal', estipendio: 2 };
  const h = iniciarHistoria(c);
  c.idadeMeses = 16 * 12;
  return { c, h };
}

test('famílias de prestígio arranjam noivados; famílias comuns não', () => {
  let arranjados = 0;
  for (let i = 0; i < 200; i++) if (arranjarNoivado({ ...rollOrigin(8), tipo: 'cla-grande' }, 'masculino')) arranjados++;
  assert.ok(arranjados > 100, `cla grande: ${arranjados}/200`);
  for (let i = 0; i < 50; i++) assert.equal(arranjarNoivado({ ...rollOrigin(8), tipo: 'familia-comum' }, 'masculino'), null);
  const n = arranjarNoivado({ ...rollOrigin(8), tipo: 'super-cla' }, 'masculino') ?? arranjarNoivado({ ...rollOrigin(8), tipo: 'super-cla' }, 'masculino');
  if (n) assert.equal(n.genero, 'feminino');
});

test('a noiva cresce com o tempo e a força relativa cai para quem não cultiva', () => {
  const { c } = novo();
  c.noivado = arranjarNoivado({ ...rollOrigin(8), tipo: 'super-cla' }, 'masculino') ?? c.noivado;
  if (!c.noivado) return;
  const antes = forcaRelativa(c);
  crescerNoivado(c.noivado, 16 * 12);
  assert.ok(c.noivado.rank > 1 || c.noivado.estagio > 1);
  assert.ok(forcaRelativa(c) < antes);
});

test('casar pelo noivado cria um Cônjuge; a rixa cria um Inimigo Jurado', () => {
  const { c } = novo();
  c.noivado = { id: 'n1', nome: 'Nalan Yan', genero: 'feminino', idade: 18, rank: 2, estagio: 3, raizGrau: 7, alquimia: 0, afiliacao: 'Seita do Vento Nublado', atributoMedio: 12, arquetipo: 'mistico', status: 'prometidos', orgulho: 80, demoniaca: false };
  aplicarEfeitos(c, { noivado: { rixa: true } });
  assert.ok(c.relacoes.some((r) => r.tipo === 'Inimigo Jurado' && r.nome === 'Seita do Vento Nublado'));
  aplicarEfeitos(c, { noivado: { casar: true } });
  assert.equal(c.noivado.status, 'casados');
  assert.ok(c.relacoes.some((r) => r.tipo === 'Cônjuge' && r.nome === 'Nalan Yan'));
  aplicarEfeitos(c, { noivado: { status: 'desafio', duelo: 36 } });
  assert.equal(c.noivado.duelo, c.idadeMeses + 36);
});

test('guerra de clãs: rival da região, pressão a cada estação e fim decisivo', () => {
  const { c, h } = novo();
  assert.ok(podeTerGuerra(c));
  const rival = escolherRival(h.mundo, c);
  assert.ok(rival);
  assert.equal(rival.tipo, 'cla');
  iniciarGuerra(h.mundo, c, rival, 'uma veia de pedras');
  c.guerra.placar = 4;
  c.guerra.razao = 0.1;
  for (let i = 0; i < 30 && c.guerra; i++) processarGuerra(h.mundo, c, 1);
  assert.equal(c.guerra, null);
  assert.ok(c.relacoes.some((r) => r.tipo === 'Vassalo' && r.nome === rival.nome) || c.flags.fimGuerraIdade !== undefined);
});

test('trégua com desvantagem cobra indenização', () => {
  const { c, h } = novo();
  iniciarGuerra(h.mundo, c, escolherRival(h.mundo, c), 'honra');
  c.guerra.placar = -3;
  c.inventario.pedrasEspirituais = 0;
  assert.match(proporTregua(c)[0], /exige/);
  assert.ok(c.guerra);
  c.inventario.pedrasEspirituais = 100000;
  proporTregua(c);
  assert.equal(c.guerra, null);
});

test('rankings por região: facções de qualquer região; você só aparece onde está', () => {
  const { c, h } = novo();
  const outra = c.local.regiao === 'central' ? 'norte' : 'central';
  const faccoes = rankingFaccoes(h.mundo, c, outra);
  assert.ok(faccoes.some((f) => f.tipo === 'seita-suprema'));
  assert.ok(faccoes.length >= 9);
  assert.ok(!ranking(h.mundo, c, 'forca', outra).some((e) => e.jogador));
  assert.ok(ranking(h.mundo, c, 'forca').some((e) => e.jogador));
  c.faccao = { tipo: 'seita', nome: 'Seita do Lótus Celeste', membros: 40, ortodoxa: true, fundadaIdadeMeses: 0, instalacoes: { salaCultivo: 1, biblioteca: 0, muralhas: 0 } };
  const aqui = rankingFaccoes(h.mundo, c, c.local.regiao);
  assert.ok(aqui.some((f) => f.sua && f.nome === 'Seita do Lótus Celeste'));
  assert.ok(faccoesDaRegiao(h.mundo, outra).length >= 9);
});
