const test = require('node:test');
const assert = require('node:assert/strict');
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { iniciarHistoria } = require('../dist/game/story');
const { aplicarEfeitos } = require('../dist/game/effects');
const { ESPECIES, getEspecie, especieDeOvo, especieParaEncontro } = require('../dist/game/bestiary');
const { aplicarProgressoCompanheira, crescimentoPassivo, faseDaCompanheira, filhoteDaEspecie, combatenteDaCompanheira } = require('../dist/game/companion');
const { HERANCAS, herancasPorAlinhamento } = require('../dist/game/inheritance');
const { aceitarMestreErrante, bloqueioMestre, deixarMestre, receberLicao, tipoDeSaida } = require('../dist/game/mentor');
const { interpretarSave } = require('../dist/game/saveLoad');

function novo() {
  const c = createCharacter({ nome: 'Lin Yue', genero: 'feminino', traco: TRAITS[0], origem: rollOrigin(8), raizEspiritual: rollSpiritualRoot(8), atributosDistribuidos: createBaseAttributes() });
  const h = iniciarHistoria(c); c.idadeMeses = 16 * 12;
  return { c, h };
}

test('o ovo choca um filhote de linhagem divina ou ancestral, acima de um aprendiz, mas fraco até crescer', () => {
  const { c } = novo();
  for (let i = 0; i < 50; i++) {
    const especie = especieDeOvo('sul');
    assert.ok(['Divina', 'Ancestral'].includes(especie.linhagem));
  }
  const serpente = getEspecie('serpente-nove-cabecas');
  aplicarEfeitos(c, { novaCompanheira: { especie: serpente.nome, especieId: serpente.id, filhote: true, deInfancia: true, rank: 1, estagio: 1, atributoMedio: 12 } });
  const besta = c.companheira;
  assert.equal(besta.rank, 3);
  assert.ok(besta.rank > c.cultivo.rank);
  assert.equal(faseDaCompanheira(besta), 'Filhote');
  assert.equal(besta.deInfancia, true);
  const filhote = combatenteDaCompanheira(besta).ataque;
  besta.idade = serpente.maturidade;
  assert.equal(faseDaCompanheira(besta), 'Adulta');
  assert.ok(combatenteDaCompanheira(besta).ataque > filhote * 2);
});

test('filhotes não rompem reinos; crescem para jovem e adulto com o tempo', () => {
  const lobo = getEspecie('lobo-presas-gelo');
  const besta = filhoteDaEspecie(lobo, 6, true);
  besta.modoEvolucao = 'independente';
  besta.vinculo = 100;
  crescimentoPassivo(besta, 3, 6, 1, 1);
  assert.equal(faseDaCompanheira(besta), 'Filhote');
  aplicarProgressoCompanheira(besta, 100000);
  assert.equal(besta.rank, 1, 'filhote não rompe reino, por mais que cultive');
  for (let i = 0; i < 40; i++) crescimentoPassivo(besta, 3, 3, 1, 1);
  assert.ok(besta.idade >= 10);
  assert.equal(faseDaCompanheira(besta), 'Adulta');
  aplicarProgressoCompanheira(besta, 1e9);
  assert.equal(besta.rank, lobo.reinos[1], 'adulta alcança o teto da espécie e para nele');
});

test('evolução conjunta sobe com o domador só até o teto da fase', () => {
  const lobo = getEspecie('lobo-presas-gelo');
  const besta = filhoteDaEspecie(lobo, 6, true);
  crescimentoPassivo(besta, 1, 1, 3, 1);
  assert.equal(besta.rank, 1);
  besta.idade = lobo.maturidade;
  crescimentoPassivo(besta, 1, 1, 6, 1);
  assert.equal(besta.rank, lobo.reinos[1]);
});

test('encontros na natureza escolhem espécies cujos adultos combinam com o reino', () => {
  const distancia = (e, rank) => (rank < e.reinos[0] ? e.reinos[0] - rank : rank > e.reinos[1] ? rank - e.reinos[1] : 0);
  for (const rank of [1, 4, 8, 11]) {
    for (let i = 0; i < 30; i++) {
      const e = especieParaEncontro('norte', rank);
      assert.ok(distancia(e, rank) <= 1, `${e.nome} (${e.reinos}) para rank ${rank}`);
    }
  }
  assert.ok(ESPECIES.length >= 25);
});

test('heranças seguem o alinhamento', () => {
  const { c } = novo();
  c.alinhamento = { valor: -60 };
  assert.ok(herancasPorAlinhamento(c).every((h) => h.alinhamento === 'demoniaca'));
  c.alinhamento = { valor: 50 };
  assert.ok(herancasPorAlinhamento(c).every((h) => h.alinhamento !== 'demoniaca'));
  c.alinhamento = { valor: -60 };
  for (const h of HERANCAS.filter((x) => x.alinhamento === 'demoniaca')) c.flags[`heranca:${h.id}`] = true;
  assert.ok(herancasPorAlinhamento(c).every((h) => h.alinhamento === undefined));
});

test('o mestre errante é único: sem segundo mestre, e romper traz desonra', () => {
  const { c, h } = novo();
  aplicarEfeitos(c, { tornarDiscipuloErrante: 'Velho Mo' });
  assert.equal(c.mestrePessoal.origem, 'errante');
  assert.match(bloqueioMestre(c, h), /não serve a dois mestres/);
  aplicarEfeitos(c, { tornarDiscipuloErrante: 'Outro Velho' });
  assert.equal(c.mestrePessoal.nome, 'Velho Mo');
  const progresso = c.cultivo.progresso;
  receberLicao(c, h);
  assert.ok(c.cultivo.progresso > progresso || c.cultivo.estagio > 1);
  assert.equal(tipoDeSaida(c, h), 'romper');
  const reputacao = c.reputacao;
  deixarMestre(c, h);
  assert.equal(c.reputacao, reputacao - 15);
  assert.match(bloqueioMestre(c, h), /renegou/);
});

test('superar o mestre errante permite formar-se com honra', () => {
  const { c, h } = novo();
  aceitarMestreErrante(c, 'Velho Mo');
  c.cultivo.rank = c.mestrePessoal.rank;
  assert.equal(tipoDeSaida(c, h), 'formar');
  deixarMestre(c, h);
  assert.equal(c.flags.mestreFormado, 'Velho Mo');
  assert.equal(c.flags.renegouMestreAte, undefined);
});

test('saves antigos: discípulo do velho vira mestre errante e a besta ganha espécie', () => {
  const { c, h } = novo();
  c.flags.mestre = 'Velho Mo';
  c.companheira = { nome: 'Brasa', especie: 'Lobo de Presas de Gelo (filhote)', rank: 1, estagio: 1, progresso: 0, atributoMedio: 6, vinculo: 60, idade: 2, deInfancia: true, modoEvolucao: 'conjunta' };
  const dados = interpretarSave(JSON.stringify({ versao: 12, character: c, historia: h, criadoEm: new Date().toISOString() }));
  assert.equal(dados.character.mestrePessoal.nome, 'Velho Mo');
  assert.equal(dados.character.mestrePessoal.origem, 'errante');
  assert.equal(dados.character.companheira.especieId, 'lobo-presas-gelo');
});
