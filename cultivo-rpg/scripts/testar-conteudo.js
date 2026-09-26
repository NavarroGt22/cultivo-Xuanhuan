// Verifica forja, facções e torneio de alquimia. Uso: node scripts/testar-conteudo.js
const { createCharacter } = require('../dist/game/character');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { addItem } = require('../dist/game/inventory');
const story = require('../dist/game/story');
const { RECEITAS_FORJA, forjar, motivoBloqueioForja } = require('../dist/game/forge');
const { fundarFaccao, processarFaccao, recrutarMembros, melhorarInstalacao } = require('../dist/game/faction');
const { ehDiscipulo, fatorCultivoPassivo } = require('../dist/game/sect');
const { disputarTorneioAlquimia } = require('../dist/game/tournaments');
const { HERANCAS } = require('../dist/game/inheritance');
const { TECNICAS } = require('../dist/game/techniques');

function novo() {
  const c = createCharacter({
    nome: 'Teste',
    genero: 'masculino',
    traco: TRAITS[0],
    origem: rollOrigin(8),
    raizEspiritual: rollSpiritualRoot(8),
    atributosDistribuidos: createBaseAttributes({ forca: 3, inteligencia: 3 }),
  });
  return { c, h: story.iniciarHistoria(c) };
}

// Forja
const qualidades = {};
for (let nivel of [1, 3, 5]) {
  for (let i = 0; i < 300; i++) {
    const { c } = novo();
    c.profissoes.refinador.nivel = nivel;
    const receita = RECEITAS_FORJA[0];
    for (const m of receita.materiais) addItem(c.inventario, m.id, m.quantidade);
    c.inventario.pedrasEspirituais += 1000;
    if (motivoBloqueioForja(c, receita)) continue;
    forjar(c, receita);
    const item = c.inventario.equipamentos.find((x) => x.qualidade);
    const chave = `nível ${nivel}: ${item ? item.qualidade : 'falhou'}`;
    qualidades[chave] = (qualidades[chave] ?? 0) + 1;
  }
}
console.log('Forja (receita 0, 300 tentativas por nível):', qualidades);

// Facção
const { c: f } = novo();
f.cultivo.rank = 4;
f.reputacao = 100;
f.inventario.pedrasEspirituais = 2000;
console.log(fundarFaccao(f, 'seita', 'Lótus Celeste'));
console.log('Discípulo?', ehDiscipulo(f), '· passivo', fatorCultivoPassivo(f));
console.log(recrutarMembros(f));
console.log(melhorarInstalacao(f, 'salaCultivo'));
console.log(processarFaccao(f, 1), 'passivo agora', fatorCultivoPassivo(f));

// Torneio de alquimia
for (const [nivel, inteligencia] of [[1, 5], [1, 12], [3, 12], [5, 12], [5, 20]]) {
  let titulos = 0;
  for (let i = 0; i < 300; i++) {
    const { c, h } = novo();
    c.atributosBase.inteligencia = inteligencia;
    c.profissoes.alquimia.nivel = nivel;
    c.inventario.pedrasEspirituais = 100;
    const antes = h.mundo.titulosAlquimia ?? 0;
    disputarTorneioAlquimia(c, h);
    if ((h.mundo.titulosAlquimia ?? 0) > antes) titulos++;
  }
  console.log(`Torneio de alquimia, nível ${nivel}, INT base ${inteligencia}: ${Math.round((titulos / 300) * 100)}% de títulos`);
}

console.log('Heranças:', HERANCAS.length, '· Técnicas:', TECNICAS.length);

// Pílulas: pureza e Ordens
const { getConsumivel } = require('../dist/game/items');
const { RECEITAS, refinar, motivoBloqueioReceita } = require('../dist/game/alchemyWorkshop');
for (const id of ['pilula-chakra', 'pilula-chakra@2', 'pilula-chakra@4', 'pilula-osso-jade@3', 'pilula-divina']) {
  const info = getConsumivel(id);
  console.log(id, '→', info.nome, JSON.stringify(info.efeitosAoUsar), 'valor', info.valor);
}
for (const [ordem, inteligencia] of [[3, 14], [5, 16], [7, 18], [9, 20], [10, 22]]) {
  const receita = RECEITAS.find((r) => r.ordem === ordem && r.oficio === 'alquimia');
  const contagem = {};
  for (let i = 0; i < 300; i++) {
    const { c } = novo();
    c.atributosBase.inteligencia = inteligencia;
    c.profissoes.alquimia.nivel = ordem;
    c.fornalha = 10;
    c.inventario.pedrasEspirituais = 5000;
    for (const ing of receita.ingredientes ?? []) addItem(c.inventario, ing.id, ing.quantidade);
    const bloqueio = motivoBloqueioReceita(c, receita, false);
    if (bloqueio) { contagem[bloqueio] = (contagem[bloqueio] ?? 0) + 1; continue; }
    const msgs = refinar(c, receita, false);
    const pureza = msgs.find((m) => m.includes('pureza'))?.match(/pureza ([^:]+):/)?.[1] ?? 'falhou';
    contagem[pureza] = (contagem[pureza] ?? 0) + 1;
  }
  console.log(`${receita.id} (INT ${inteligencia}, nível ${ordem}):`, contagem);
}
{
  const { c } = novo();
  c.profissoes.alquimia.nivel = 5;
  c.inventario.pedrasEspirituais = 500;
  console.log('Sem fornalha:', motivoBloqueioReceita(c, RECEITAS.find((r) => r.ordem === 5), false));
}

// Mercado
const market = require('../dist/game/market');
{
  const { c } = novo();
  c.cultivo.rank = 4;
  c.inventario.pedrasEspirituais = 5000;
  const antes = fatorCultivoPassivo(c);
  console.log(market.comprarMoradia(c, market.MORADIAS.find((m) => m.id === 'vila-montanha')));
  console.log(market.comprarMontaria(c, market.MONTARIAS.find((m) => m.id === 'barco-voador-seita')));
  console.log('passivo', antes, '→', fatorCultivoPassivo(c), '· emboscada ×', market.fatorEmboscada(c), '· pedras', c.inventario.pedrasEspirituais);
  console.log(market.processarPatrimonio(c, 1), 'pedras após manutenção', c.inventario.pedrasEspirituais);
  c.inventario.pedrasEspirituais = 0;
  console.log(market.processarPatrimonio(c, 1), 'moradia', c.moradia, 'montaria', c.montaria);
}
