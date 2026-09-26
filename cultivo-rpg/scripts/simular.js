// Simula vidas inteiras escolhendo opções aleatórias. Uso: node scripts/simular.js [vidas]
const { createCharacter, idadeAnos } = require('../dist/game/character');
const { ESTILOS, ESTILO_IDS } = require('../dist/game/martialStyles');
const { TRAITS } = require('../dist/game/traits');
const { rollOrigin, descreverOrigem } = require('../dist/game/origin');
const { rollSpiritualRoot } = require('../dist/game/spiritualRoot');
const { createBaseAttributes } = require('../dist/game/attributes');
const { realmLabel } = require('../dist/game/cultivation');
const story = require('../dist/game/story');
const { listarAtividades } = require('../dist/game/activities');
const { listarVagas, contratar, getCargo } = require('../dist/game/occupations');

const { ehDiscipulo, promoverNaSeita } = require('../dist/game/sect');

const { estadoCampanha, resgatarObjetivo } = require('../dist/game/campaign');
const { escolhaDaMissao } = require('../dist/game/bounties');
const { rosterDaSeita } = require('../dist/game/worldState');
const { podeDesafiar, aplicarVitoriaDesafio } = require('../dist/game/sectRoster');
const { inimigoDoNpc } = require('../dist/game/npcs');
const { RECEITAS, refinar, motivoBloqueioReceita } = require('../dist/game/alchemyWorkshop');
const { posicaoJogador } = require('../dist/game/rankings');

const { INTERACOES } = require('../dist/game/relationships');
const { HERANCAS } = require('../dist/game/inheritance');
const { TORRES, andarAtual, escolhaDoAndar } = require('../dist/game/towers');
const { disputarTorneio, torneioAberto } = require('../dist/game/tournaments');
const { PRODUTOS_REGIONAIS, comprarProduto, venderProduto } = require('../dist/game/trade');
const { REGIOES } = require('../dist/game/world');
const torneios = { total: 0, titulos: 0 };
const comercio = { lucro: 0 };
const andaresFinais = [];
const extras = { domadoras: 0, companheiras: 0, herancas: {}, corpos: {}, casados: 0, filhos: 0, maiorBesta: 0 };
const objetivos = {};
const missoes = { total: 0, vitorias: 0 };
const desafios = { total: 0, vitorias: 0 };
let excessos = 0;
const rankingFinal = [];const atividadesFeitas = {};
const postos = {};
const cargosFinais = {};

const vidas = Number(process.argv[2] ?? 20);
const eventos = {};
let lutas = 0;
let vitorias = 0;

for (let v = 0; v < vidas; v++) {
  const distribuicao = createBaseAttributes({ forca: 3, constituicao: 3, espirito: 3, sorte: 3 });
  const traco = TRAITS[v % TRAITS.length];
  const character = createCharacter({
    nome: 'Teste',
    genero: v % 2 ? 'feminino' : 'masculino',
    traco,
    origem: rollOrigin(8),
    raizEspiritual: rollSpiritualRoot(8),
    atributosDistribuidos: distribuicao,
  });
  const historia = story.iniciarHistoria(character);

  let passos = 0;
  while (passos < 3000) {
    passos++;

    if (ehDiscipulo(character)) {
      const mensagens = promoverNaSeita(character);
      if (mensagens.length) postos[character.afiliacao.posto] = (postos[character.afiliacao.posto] ?? 0) + 1;
    }
    if (!character.ocupacao && Math.random() < (ehDiscipulo(character) ? 0.03 : 0.3)) {
      const vagas = listarVagas(character).filter((vaga) => !vaga.bloqueio);
      if (vagas.length) {
        const vaga = vagas[Math.floor(Math.random() * vagas.length)];
        contratar(character, vaga.categoria.id, vaga.indice);
      }
    }
    // Campanha
    for (const { objetivo, status } of estadoCampanha(character, historia.mundo)) {
      if (status === 'concluido') {
        resgatarObjetivo(character, historia.mundo, objetivo.id);
        objetivos[objetivo.id] = (objetivos[objetivo.id] ?? 0) + 1;
      }
    }
    // Missão do quadro
    if (historia.mundo.quadro.length && Math.random() < 0.3 && story.gastarEnergia(historia, 2)) {
      const indice = Math.floor(Math.random() * historia.mundo.quadro.length);
      const r = story.executarEscolha(character, escolhaDaMissao(historia.mundo.quadro[indice]));
      missoes.total++;
      if (r.vitoria) {
        missoes.vitorias++;
        historia.mundo.quadro.splice(indice, 1);
      }
      if (r.final) break;
    }
    // Desafio na seita
    const roster = rosterDaSeita(historia.mundo, character);
    if (roster && Math.random() < 0.2 && story.gastarEnergia(historia, 2)) {
      const alvos = roster.membros.filter((m) => podeDesafiar(character, m));
      if (alvos.length) {
        const alvo = alvos[Math.floor(Math.random() * alvos.length)];
        const r = story.executarEscolha(character, { texto: '', combate: inimigoDoNpc(alvo), resultado: { texto: '' }, falha: { texto: '' } });
        desafios.total++;
        if (r.vitoria) {
          desafios.vitorias++;
          aplicarVitoriaDesafio(character, roster, alvo);
        }
      }
    }
    // Alquimia
    if (character.profissoes.alquimia.nivel > 0 && Math.random() < 0.3 && story.gastarEnergia(historia, 1)) {
      const receitas = RECEITAS.filter((rc) => !motivoBloqueioReceita(character, rc, false));
      if (receitas.length) refinar(character, receitas[Math.floor(Math.random() * receitas.length)], false);
    }
    // Torre de Prova
    if (character.flags.raizRevelada && Math.random() < 0.35 && story.gastarEnergia(historia, 1)) {
      const torre = TORRES[character.local.regiao];
      const proximo = andarAtual(historia.mundo, torre.regiao) + 1;
      if (proximo <= torre.andares) {
        const r = story.executarEscolha(character, escolhaDoAndar(character, torre, proximo));
        if (r.sucesso) historia.mundo.torres[torre.regiao] = proximo;
        if (r.final) break;
      }
    }
    // Torneio Regional
    if (torneioAberto(historia) && character.idadeMeses >= 14 * 12 && character.inventario.pedrasEspirituais >= 5 && story.gastarEnergia(historia, 3)) {
      const r = disputarTorneio(character, historia);
      torneios.total++;
      if (r.vitoria) torneios.titulos++;
      if (r.final) break;
    }
    // Comércio: compra local, vende quando estiver em outra região
    if (Math.random() < 0.1) comprarProduto(character, 2);
    for (const p of PRODUTOS_REGIONAIS) {
      if (p.regiao !== character.local.regiao && character.inventario.itens.some((i) => i.id === p.id)) {
        const antes = character.inventario.pedrasEspirituais;
        venderProduto(character, p, Math.random() < 0.3);
        comercio.lucro += character.inventario.pedrasEspirituais - antes;
      }
    }
    // Viagem ocasional (para o comércio fazer sentido)
    if (Math.random() < 0.01) {
      const regioes = Object.keys(REGIOES).filter((r) => r !== character.local.regiao);
      const destino = regioes[Math.floor(Math.random() * regioes.length)];
      character.local = { regiao: destino, cidade: REGIOES[destino].cidades[0] };
    }
    // Relações
    if (character.relacoes.length && Math.random() < 0.3 && historia.energia > 0) {
      const pessoa = character.relacoes[Math.floor(Math.random() * character.relacoes.length)];
      const possiveis = INTERACOES.filter((i) => !i.bloqueio(character, pessoa) && i.id !== 'terminar' && i.id !== 'discutir');
      if (possiveis.length && story.gastarEnergia(historia, 1)) {
        possiveis[Math.floor(Math.random() * possiveis.length)].executar(character, pessoa);
      }
    }
    // Atividades até acabar a energia
    while (historia.energia > 0 && Math.random() < 0.8) {
      const atividades = listarAtividades(character, historia.contagemAtividades).filter(
        (a) => !a.bloqueio && !story.descreverEscolha(character, a.escolha).bloqueio && !a.atividade.id.startsWith('viajar'),
      );
      if (!atividades.length) break;
      const escolhida = atividades[Math.floor(Math.random() * atividades.length)];
      story.gastarEnergia(historia, 1);
      historia.contagemAtividades[escolhida.atividade.id] = escolhida.vezes + 1;
      atividadesFeitas[escolhida.atividade.id] = (atividadesFeitas[escolhida.atividade.id] ?? 0) + 1;
      if (escolhida.emExcesso) excessos++;
      story.executarEscolha(character, escolhida.escolha);
    }
    if (character.vidaAtual <= 0) break;

    const no = historia.noAtual;
    eventos[no.evento] = (eventos[no.evento] ?? 0) + 1;
    const possiveis = no.escolhas
      .map((escolha, indice) => ({ escolha, indice }))
      .filter(({ escolha }) => !story.descreverEscolha(character, escolha).bloqueio);
    const { escolha, indice } = possiveis[Math.floor(Math.random() * possiveis.length)];
    story.resolverEscolha(character, historia, indice);
    if (escolha.combate) {
      lutas++;
      if (historia.desfecho.resumo.startsWith('Vitória')) vitorias++;
    }
    if (historia.desfecho.final) break;
    story.continuarHistoria(character, historia);
  }

  andaresFinais.push(Math.max(0, ...Object.values(historia.mundo.torres)));
  if (character.origem.reencarnacao) extras.reencarnados = (extras.reencarnados ?? 0) + 1;
  if (character.origem.familiaDomadora) extras.domadoras++;
  if (character.companheira) {
    extras.companheiras++;
    extras.maiorBesta = Math.max(extras.maiorBesta, character.companheira.rank);
  }
  if (character.origem.corpoEspecial) extras.corpos[character.origem.corpoEspecial.nome] = (extras.corpos[character.origem.corpoEspecial.nome] ?? 0) + 1;
  for (const h of HERANCAS) if (character.flags[`heranca:${h.id}`]) extras.herancas[h.nome] = (extras.herancas[h.nome] ?? 0) + 1;
  if (character.relacoes.some((r) => r.tipo === 'Cônjuge' || r.tipo === 'Companheiro(a) de Dao')) extras.casados++;
  extras.filhos += character.relacoes.filter((r) => r.tipo === 'Filho(a)').length;
  rankingFinal.push(`forca #${posicaoJogador(historia.mundo, character, 'forca')}`);  const cargo = character.ocupacao ? getCargo(character.ocupacao).nome : 'sem ocupação';
  cargosFinais[cargo] = (cargosFinais[cargo] ?? 0) + 1;

  console.log(
    `${(ESTILO_IDS.filter((id) => character.estilos[id].nivel > 0).map((id) => ESTILOS[id].nome.split(" ")[0] + character.estilos[id].nivel).join(",") || "-").padEnd(24)} | tec ${character.tecnicas.length} | ${descreverOrigem(character.origem).padEnd(70)} | raiz ${character.raizEspiritual.grau} | ` +
      `${realmLabel(character.cultivo).padEnd(34)} | ${idadeAnos(character)} anos | ${passos} eventos | ${character.inventario.pedrasEspirituais} pedras | ` +
      `alq ${character.profissoes.alquimia.nivel} insc ${character.profissoes.inscricao.nivel} | ${historia.noAtual.evento}`,
  );
}

console.log(`\nLutas: ${lutas}, vitórias: ${vitorias} (${Math.round((vitorias / Math.max(1, lutas)) * 100)}%)`);
console.log('Eventos:', eventos);
console.log('Atividades:', atividadesFeitas);
console.log('Cargo ao morrer:', cargosFinais);
console.log('Promoções na seita:', postos);
console.log('Objetivos de campanha resgatados:', objetivos);
console.log('Heranças, bestas e família:', JSON.stringify(extras));
console.log('Torneios:', torneios, '· Lucro do comércio:', comercio.lucro, '· Maior andar de torre por vida:', andaresFinais.join(','));
console.log('Posição no ranking de força ao morrer:', rankingFinal.join(', '));
console.log('Missões do quadro:', missoes, '· Desafios na seita:', desafios, '· Atividades em excesso:', excessos);
