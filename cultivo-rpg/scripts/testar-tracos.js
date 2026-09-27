const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria, resolverEscolha } = require('../dist/game/story');
const { aplicarEfeitos } = require('../dist/game/effects');
const { gerarInimigo } = require('../dist/game/combat');
const { fatorCultivoPassivo } = require('../dist/game/sect');
const { atualizarTracosVida, feitosDe, fatorRelacoesTracos, fatorVingancaTracos, fatorEmboscadaTracos } = require('../dist/game/lifeTraits');

function novo() {
  const c = createCharacter({ nome: 'Lin Feng', genero: 'masculino', traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  const h = iniciarHistoria(c);
  c.idadeMeses = 20 * 12;
  return { c, h };
}

test('há mais traços de criação, todos com ids únicos', () => {
  assert.ok(TRAITS.length >= 17);
  assert.equal(new Set(TRAITS.map((t) => t.id)).size, TRAITS.length);
});

test('escolhas com alinhamento contam boas ações e crueldades; quase-morte é registrada', () => {
  const { c } = novo();
  aplicarEfeitos(c, { alinhamento: 5 });
  aplicarEfeitos(c, { alinhamento: -5 });
  aplicarEfeitos(c, { alinhamento: -5, flags: { quaseMorte: true } });
  aplicarEfeitos(c, { feitos: { mortes: 4 } });
  const f = feitosDe(c);
  assert.equal(f.bondades, 1);
  assert.equal(f.crueldades, 2);
  assert.equal(f.quaseMortes, 1);
  assert.equal(f.mortes, 4);
});

test('vencer uma pessoa num evento conta morte; vencer uma besta conta besta abatida; duelos não matam', () => {
  const { c, h } = novo();
  const luta = (nome, arquetipo, evento) => {
    h.desfecho = null;
    h.noAtual = { id: evento, evento, titulo: 'Luta', texto: '', meses: 1, escolhas: [{ texto: 'Lutar', combate: gerarInimigo(nome, arquetipo, 1, 1, 1), resultado: { texto: 'Venceu' }, falha: { texto: 'Perdeu' } }] };
    resolverEscolha(c, h, 0);
  };
  luta('Bandido', 'guerreiro', 'bandidos');
  luta('Lobo', 'besta', 'besta');
  luta('Rival', 'guerreiro', 'rival');
  const f = feitosDe(c);
  assert.equal(f.mortes, 1);
  assert.equal(f.bestasAbatidas, 1);
  assert.equal(f.vitorias, 3);
});

test('cem mortes com o coração frio fazem um Psicopata: ajuda na força, atrapalha nas relações e atrai vingança', () => {
  const { c } = novo();
  const forca = c.atributosBase.forca;
  c.feitos = { mortes: 100, crueldades: 40, bondades: 5 };
  const mensagens = atualizarTracosVida(c, 3);
  assert.ok(c.tracosVida.includes('psicopata'));
  assert.ok(c.tracosVida.includes('maos-de-sangue'));
  assert.ok(mensagens.some((m) => m.includes('Psicopata')));
  assert.ok(c.atributosBase.forca >= forca + 2);
  assert.ok(fatorRelacoesTracos(c) < 0.5);
  assert.ok(fatorVingancaTracos(c) > 1);
  const alinhamento = c.alinhamento.valor;
  atualizarTracosVida(c, 12);
  assert.ok(c.alinhamento.valor < alinhamento, 'o alinhamento escorre para o demoníaco');
  atualizarTracosVida(c, 3);
  assert.equal(c.tracosVida.filter((t) => t === 'psicopata').length, 1, 'não ganha o mesmo traço duas vezes');
});

test('quem ajuda muita gente fica Bondoso (e, sem crueldade, Santo Vivo)', () => {
  const { c } = novo();
  c.afiliacao = { tipo: 'seita', nome: 'Seita do Jade', posto: 'Discípulo Externo', ortodoxa: true, estipendio: 2 };
  const cultivo = fatorCultivoPassivo(c);
  c.feitos = { bondades: 90, crueldades: 3 };
  atualizarTracosVida(c, 3);
  assert.ok(c.tracosVida.includes('coracao-bondoso'));
  assert.ok(c.tracosVida.includes('santo-vivo'));
  assert.ok(fatorRelacoesTracos(c) > 1);
  assert.ok(fatorEmboscadaTracos(c) > 1, 'a bondade também atrapalha: parece um alvo fácil');
  assert.ok(fatorCultivoPassivo(c) > cultivo);
});

test('quem nasce entre mortais não cultiva sozinho até achar um método', () => {
  const { metodoDeCultivo } = require('../dist/game/cultivationMethod');
  const { c } = novo();
  c.origem = { ...c.origem, tipo: 'familia-comum' };
  c.afiliacao = { tipo: 'familia', nome: 'Família Lin', ortodoxa: true, posto: 'Filho da casa', estipendio: 0 };
  c.tecnicas = [];
  delete c.mestrePessoal;
  c.faccao = null;
  assert.equal(metodoDeCultivo(c), null);
  assert.equal(fatorCultivoPassivo(c), 0);
  c.tecnicas.push('respiracao-nove-nuvens');
  assert.ok(metodoDeCultivo(c));
  assert.ok(fatorCultivoPassivo(c) > 0);
});

test('alma antiga desperta uma identidade e rola a raiz de novo, no mínimo grau 3, sem piorar', () => {
  const { podeDespertar, sortearIdentidade } = require('../dist/game/soulAwakening');
  const { c } = novo();
  c.traco = TRAITS.find((t) => t.id === 'alma-antiga');
  assert.ok(podeDespertar(c));
  const identidade = sortearIdentidade(c);
  c.raizEspiritual.grau = 1;
  aplicarEfeitos(c, { ...identidade.recompensa, rerolarRaiz: { minimo: 3 }, flags: { almaDespertada: identidade.id } });
  assert.ok(c.raizEspiritual.grau >= 3);
  assert.ok(!podeDespertar(c), 'só desperta uma vez');
  const { c: outro } = novo();
  outro.traco = TRAITS.find((t) => t.id === 'heranca-escondida');
  outro.raizEspiritual.grau = 7;
  aplicarEfeitos(outro, { rerolarRaiz: { minimo: 3 } });
  assert.equal(outro.raizEspiritual.grau, 7, 'uma raiz melhor nunca piora');
  const { c: comum } = novo();
  comum.traco = TRAITS[0];
  assert.ok(!podeDespertar(comum));
});

test('traços aleatórios surgem com os anos, no máximo três por vida', () => {
  const { c } = novo();
  for (let i = 0; i < 4000; i++) atualizarTracosVida(c, 3);
  const aleatorios = (c.tracosVida ?? []).length;
  assert.ok(aleatorios >= 1 && aleatorios <= 3, `aleatórios: ${aleatorios}`);
});
