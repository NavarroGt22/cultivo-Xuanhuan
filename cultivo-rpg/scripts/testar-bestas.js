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

// --- Bestiário Profundo (Fase 1) ---
const { FICHAS, DADOS_PILOTOS, especieProfunda } = require('../dist/game/bestiaryDeep');
const { registrarNoCodex } = require('../dist/game/codex');
const {
  campoVisivel, conhecimentoRegistrado, elevarConhecimento, especieConhecida, fraquezaConhecida, nivelConhecimento,
  ouvirRumor, registrarEncontroBesta,
} = require('../dist/game/beastKnowledge');
const { executarEscolha } = require('../dist/game/story');

test('bestiário profundo: as 28 espécies têm ficha completa, sem mudar o catálogo', () => {
  assert.equal(ESPECIES.length, 28);
  const campos = ['nicho', 'comportamento', 'assinatura', 'fraqueza', 'materiais', 'vinculo', 'variante'];
  for (const e of ESPECIES) {
    const ficha = FICHAS[e.id];
    assert.ok(ficha, `ficha ausente: ${e.id}`);
    for (const campo of campos) assert.ok(ficha[campo]?.length > 20, `${e.id}.${campo}`);
    assert.ok(ficha.ameaca >= 1 && ficha.ameaca <= 6);
    assert.ok(ficha.papelEcologico.length >= 1);
    const profunda = especieProfunda(e);
    for (const chave of Object.keys(e)) assert.deepEqual(profunda[chave], e[chave], `campo original preservado: ${e.id}.${chave}`);
  }
  assert.equal(Object.keys(FICHAS).length, 28, 'nenhuma ficha para espécie inexistente');
  const calamidades = ESPECIES.filter((e) => e.linhagem === 'Ancestral');
  assert.ok(calamidades.every((e) => FICHAS[e.id].ameaca === 6), 'ancestrais são calamidades');
});

test('bestiário profundo: as 5 pilotos (uma por região) têm habilidades com sinal e resposta e materiais com origem', () => {
  const pilotos = ['coelho-jade', 'lobo-presas-gelo', 'pantera-nevoa', 'carpa-portao-dragao', 'camelo-duas-almas'];
  assert.deepEqual(Object.keys(DADOS_PILOTOS).sort(), [...pilotos].sort());
  assert.deepEqual(new Set(pilotos.map((id) => getEspecie(id).regioes[0])).size, 5);
  for (const id of pilotos) {
    const p = especieProfunda(getEspecie(id));
    assert.ok(p.habilidades.length >= 1);
    for (const h of p.habilidades) assert.ok(h.sinal && h.efeito && h.resposta && h.fases.length);
    assert.ok(p.materiaisDetalhados.length >= 1 && p.materiaisDetalhados.length <= 3, 'no máximo dois principais e um excepcional');
    for (const m of p.materiaisDetalhados) assert.ok(['coleta', 'muda', 'extracao', 'caca', 'presente'].includes(m.origem) && m.usos.length);
    assert.ok(p.materiaisDetalhados.some((m) => m.renovavel), 'toda piloto oferece recurso renovável');
    assert.ok(p.temperamento && p.inteligencia && p.estruturaSocial && p.atividade);
  }
});

test('bestiário profundo: a ficha só é revelada para bestas descobertas', () => {
  const { c, h } = novo();
  const lobo = getEspecie('lobo-presas-gelo');
  const tigre = getEspecie('tigre-nuvem-branca');
  const corvo = getEspecie('corvo-tres-olhos');
  assert.equal(especieConhecida(c, h.mundo, lobo), false);
  registrarNoCodex(h.mundo, c, 'Um Lobo de Presas de Gelo uiva ao longe.');
  assert.equal(especieConhecida(c, h.mundo, lobo), true);
  assert.equal(especieConhecida(c, h.mundo, tigre), false);
  c.flags['bestiario:tigre-nuvem-branca'] = true;
  assert.equal(especieConhecida(c, h.mundo, tigre), true, 'domar revela a ficha');
  aplicarEfeitos(c, { novaCompanheira: { especie: corvo.nome, rank: 1, estagio: 1, atributoMedio: 6, especieId: corvo.id, filhote: true } });
  assert.equal(especieConhecida(c, h.mundo, corvo), true, 'a companheira revela a própria ficha');
});

// --- Bestiário Profundo (Fase 2): conhecimento 0–5 e rumores ---
test('conhecimento: cada nível revela só o seu grupo de campos', () => {
  assert.equal(campoVisivel(0, 'identidade'), false);
  assert.equal(campoVisivel(1, 'identidade'), true);
  assert.equal(campoVisivel(1, 'ecologia'), false);
  assert.equal(campoVisivel(2, 'combate'), false);
  assert.equal(campoVisivel(3, 'combate'), true);
  assert.equal(campoVisivel(3, 'vinculo'), false);
  assert.equal(campoVisivel(4, 'lenda'), false);
  assert.equal(campoVisivel(5, 'lenda'), true);
});

test('conhecimento: o save antigo migra sem escrita (Codex → 1, domada → 4) e recarregar não duplica nada', () => {
  const { c, h } = novo();
  const lobo = getEspecie('lobo-presas-gelo');
  assert.equal(nivelConhecimento(c, h.mundo, lobo), 0);
  registrarNoCodex(h.mundo, c, 'Um Lobo de Presas de Gelo uiva.');
  assert.equal(nivelConhecimento(c, h.mundo, lobo), 1);
  assert.equal(c.conhecimentoBestas, undefined, 'derivar o nível não grava nada');
  c.flags['bestiario:lobo-presas-gelo'] = true;
  assert.equal(nivelConhecimento(c, h.mundo, lobo), 4);
  elevarConhecimento(c, lobo, 2, 'pista A');
  elevarConhecimento(c, lobo, 2, 'pista A');
  assert.deepEqual(conhecimentoRegistrado(c, lobo.id).pistas, ['pista A']);
  const texto = JSON.stringify({ versao: 12, character: c, historia: h });
  const uma = interpretarSave(texto);
  const duas = interpretarSave(JSON.stringify(uma));
  assert.deepEqual(duas.character.conhecimentoBestas, uma.character.conhecimentoBestas);
  assert.equal(nivelConhecimento(duas.character, duas.historia.mundo, lobo), 4);
});

test('conhecimento: lutas ensinam; compreender a fraqueza enfraquece a besta em combate', () => {
  const { c } = novo();
  const pantera = getEspecie('pantera-nevoa');
  registrarEncontroBesta(c, 'Pantera da Névoa', false);
  assert.equal(nivelConhecimento(c, undefined, pantera), 1);
  registrarEncontroBesta(c, 'Pantera da Névoa', false);
  registrarEncontroBesta(c, 'Pantera da Névoa', false);
  assert.equal(nivelConhecimento(c, undefined, pantera), 2);
  assert.equal(fraquezaConhecida(c, pantera), null);
  registrarEncontroBesta(c, 'Pantera da Névoa', true);
  registrarEncontroBesta(c, 'Pantera da Névoa', true);
  assert.equal(nivelConhecimento(c, undefined, pantera), 3);
  assert.match(fraquezaConhecida(c, pantera), /Pólen/);
  const atributos = { forca: 20, destreza: 20, inteligencia: 20, constituicao: 20, espirito: 20, sorte: 20 };
  const luta = executarEscolha(c, { texto: 'Lutar', combate: { nome: 'Pantera da Névoa', atributos, rank: 1, estagio: 1, besta: true }, resultado: { texto: 'ok' }, falha: { texto: 'não' } });
  assert.ok(luta.mensagens.some((m) => m.includes('fraqueza')));
});

test('rumores: podem ser falsos e só se confirmam ou caem ao compreender a espécie', () => {
  const { c, h } = novo();
  let rumores = 0;
  for (let i = 0; i < 40; i++) if (ouvirRumor(c, h.mundo)) rumores++;
  assert.ok(rumores > 0);
  const todos = Object.values(c.conhecimentoBestas).flatMap((r) => r.rumores);
  assert.ok(todos.every((r) => r.estado === 'relato'));
  assert.ok(new Set(todos.map((r) => r.tipo)).size >= 2, 'há rumores de tipos diferentes');
  const [id, registro] = Object.entries(c.conhecimentoBestas).find(([, r]) => r.rumores.length);
  const especie = getEspecie(id);
  assert.ok(nivelConhecimento(c, h.mundo, especie) >= 1, 'um rumor já dá o nome da espécie');
  const reputacao = c.reputacao;
  elevarConhecimento(c, especie, 3);
  assert.ok(registro.rumores.every((r) => r.estado === (r.tipo === 'falso' ? 'desmentido' : 'confirmado')));
  assert.equal(c.reputacao - reputacao, registro.rumores.filter((r) => r.tipo !== 'verdadeiro').length);
  const recarregado = interpretarSave(JSON.stringify({ versao: 12, character: c, historia: h }));
  assert.ok(recarregado.character.conhecimentoBestas[id].rumores.every((r) => r.estado !== 'relato'), 'rumor corrigido não volta a ser relato');
});
