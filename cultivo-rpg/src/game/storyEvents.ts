import type { Desfecho, StoryChoice, StoryNode } from './story';
import { Attributes, ATTRIBUTE_KEYS, formatarBonus } from './attributes';
import {
  Character,
  expectativaDeVidaAnos,
  getCharacterStats,
  getEffectiveAttributes,
  idadeAnos,
} from './character';
import { DerivedStats } from './stats';
import { REGIOES, Regiao, gerarNomePessoa, gerarNomeSeita, gerarNomeCla } from './world';
import { ORIGEM_INFO, isCla } from './origin';
import { REINOS, dificuldadeTribulacao, ganhoCultivo, getRealm, precisaTribulacao } from './cultivation';
import { TIPO_RAIZ_INFO, descreverElementos, grauRaizInfo } from './spiritualRoot';
import { ArquetipoInimigo, InimigoDef, gerarInimigo } from './combat';
import { EQUIPMENT_CATALOG } from './equipment';
import { ORDEM_PILULA, getConsumivel, idComQualidade } from './items';
import { TECNICAS, dificuldadeAprendizado, grauMaximoPorAcesso, idManual, nomeGrau } from './techniques';
import { ESTILOS, ESTILO_IDS, EstiloId } from './martialStyles';
import { influenciaPessoal } from './influence';
import { descreverCultivo, faixaBesta } from './npcs';
import { HERANCAS, achadoDeHeranca, rolarTierHeranca } from './inheritance';
import type { ProfissaoId } from './professions';
import { inimigosJurados } from './coreDestruction';
import { inimigoIntimidado } from './feuds';
import { protecaoFaccao } from './faction';
import { Moradia, fatorEmboscada, fatorSegurancaCasa, getMoradia } from './market';
import { multiplicadorProfecia, verificarProfecia } from './divination';
import { chance, escolher, escolherPonderado, inteiro, percentilComSorte } from './rng';

interface Contexto {
  character: Character;
  atributos: Attributes;
  stats: DerivedStats;
  regiao: Regiao;
  idade: number;
  turno: number;
}

interface ModeloEvento {
  id: string;
  /** 0 = indisponível no contexto atual. */
  peso: (ctx: Contexto) => number;
  gerar: (ctx: Contexto) => StoryNode;
}

function criarContexto(character: Character, turno: number): Contexto {
  return {
    character,
    atributos: getEffectiveAttributes(character),
    stats: getCharacterStats(character),
    regiao: REGIOES[character.local.regiao],
    idade: idadeAnos(character),
    turno,
  };
}

function no(ctx: Contexto, evento: string, titulo: string, texto: string, escolhas: StoryChoice[], meses = 3): StoryNode {
  return { id: `${evento}-${ctx.turno}`, evento, titulo, texto, escolhas, meses };
}

/** Marca quem fala no evento (caixa de diálogo com retrato opcional). */
function falando(node: StoryNode, nome: string, retrato?: string): StoryNode {
  return { ...node, personagem: { nome, retrato } };
}

function g(ctx: Contexto, masculino: string, feminino: string): string {
  return ctx.character.genero === 'feminino' ? feminino : masculino;
}

function rank(ctx: Contexto): number {
  return ctx.character.cultivo.rank;
}

/** Dificuldade de teste escalada pelo rank e pela força da região. */
function dif(ctx: Contexto, base: number): number {
  return Math.round(base + (rank(ctx) - 1) * 3 + (ctx.regiao.fatorPoder - 1) * 4);
}

/** Recompensa em pedras escalada pelo rank e pela região. */
function pedras(ctx: Contexto, base: number): number {
  return Math.max(1, Math.round(base * ctx.regiao.fatorPoder * (1 + (rank(ctx) - 1) * 1.5)));
}

function ganho(ctx: Contexto, meses: number, multiplicador = 1): number {
  return ganhoCultivo(ctx.stats.velocidadeCultivo, meses, multiplicador);
}

function mediaAtributos(ctx: Contexto): number {
  return ATTRIBUTE_KEYS.reduce((soma, chave) => soma + ctx.atributos[chave], 0) / ATTRIBUTE_KEYS.length;
}

/** Inimigo com força relativa ao jogador (`forca` 1 = equivalente). */
function inimigo(
  ctx: Contexto,
  nome: string,
  arquetipo: ArquetipoInimigo,
  forca: number,
  deltaEstagio = 0,
  letal = false,
): InimigoDef {
  const cultivo = ctx.character.cultivo;
  const estagios = getRealm(cultivo).estagios;
  const estagio = Math.max(1, Math.min(estagios, cultivo.estagio + deltaEstagio));
  const acompanhamentoTecnicas = 1 + ctx.character.tecnicas.length * 0.03;
  const acompanhamentoBesta = ctx.character.companheira ? 1.25 : 1;
  const media = mediaAtributos(ctx) * forca * Math.sqrt(ctx.regiao.fatorPoder / 1.2) * acompanhamentoTecnicas * acompanhamentoBesta;
  return gerarInimigo(nome, arquetipo, media, cultivo.rank, estagio, letal);
}

function flag(ctx: Contexto, chave: string): string | number | boolean | undefined {
  return ctx.character.flags[chave];
}

/** GDD 4 — leilões: uma pílula de Ordem alta (até um acima do seu reino), com pureza sorteada. */
function lotesDePilulas(ctx: Contexto): [string, number, Desfecho['efeitos']][] {
  const ordemMaxima = Math.min(10, ctx.character.cultivo.rank + 1);
  const candidatas = Object.entries(ORDEM_PILULA).filter(([, ordem]) => ordem >= 3 && ordem <= ordemMaxima && ordem < 10);
  if (candidatas.length === 0 || !chance(0.7)) return [];
  const [base] = escolher(candidatas);
  const pureza = chance(0.1) ? 3 : chance(0.25) ? 2 : chance(0.4) ? 1 : 0;
  const id = idComQualidade(base, pureza);
  const info = getConsumivel(id);
  if (!info) return [];
  return [[info.nome, Math.round(info.valor * 1.6 * ctx.regiao.fatorPoder), { itens: [{ id, quantidade: 1 }] }]];
}

function nivelProfissao(ctx: Contexto, id: ProfissaoId): number {
  return ctx.character.profissoes[id].nivel;
}

function ocupacao(ctx: Contexto): string | null {
  return ctx.character.ocupacao?.categoria ?? null;
}

function local(ctx: Contexto): string {
  const afiliacao = ctx.character.afiliacao;
  return afiliacao.tipo === 'seita' || afiliacao.tipo === 'seita-suprema' ? `a ${afiliacao.nome}` : ctx.character.local.cidade;
}

function atributoAleatorio(chaves: (keyof Attributes)[]): Partial<Attributes> {
  return { [escolher(chaves)]: 1 };
}

// ---------------------------------------------------------------------------
// Eventos fixos
// ---------------------------------------------------------------------------

export function gerarPrologo(character: Character, turno: number): StoryNode {
  const ctx = criarContexto(character, turno);
  const o = character.origem;
  const r = ctx.regiao;
  const paragrafos: string[] = [`Você nasce ${r.preposicao} ${r.nome} — ${r.descricao}`];

  const ramoTexto =
    o.ramo === 'principal'
      ? 'Você pertence ao ramo principal: os melhores recursos, as maiores expectativas.'
      : 'Mas você nasce num ramo colateral. Recebe sobras, e aprende cedo o gosto do ressentimento.';

  switch (o.tipo) {
    case 'orfao':
      paragrafos.push(
        `Ninguém sabe quem são seus pais. Você é encontrad${g(ctx, 'o', 'a')} ainda bebê na porta de um templo em ${o.cidade}, enrolad${g(ctx, 'o', 'a')} num pano sem brasão nenhum. Os monges te criam com o pouco que têm.`,
      );
      break;
    case 'familia-comum':
      paragrafos.push(
        `Você nasce na ${o.nomeCasa}, uma família de ${escolher(['ferreiros', 'lenhadores', 'pescadores', 'caçadores', 'agricultores', 'comerciantes de tecido'])} de ${o.cidade}. Não há anciões, técnicas secretas nem pílulas — só trabalho duro e a esperança de que um dia algum filho desperte uma raiz espiritual.`,
      );
      break;
    case 'cla-menor':
      paragrafos.push(`Você nasce no ${o.nomeCasa}, um clã menor que controla alguns quarteirões de ${o.cidade}. ${ramoTexto}`);
      break;
    case 'cla-medio':
      paragrafos.push(`Você nasce no ${o.nomeCasa}, um clã médio que domina ${o.cidade} há séculos. ${ramoTexto}`);
      break;
    case 'cla-grande':
      paragrafos.push(`Você nasce no ${o.nomeCasa}, um clã grande cuja influência se estende por boa parte ${r.preposicao === 'na' ? 'da' : 'do'} ${r.nome}. ${ramoTexto}`);
      break;
    case 'super-cla':
      paragrafos.push(`Você nasce no ${o.nomeCasa}, um super clã com mais de mil anos. Até imperadores regionais tratam seus anciões com cautela. ${ramoTexto}`);
      break;
    case 'cla-ancestral':
      paragrafos.push(`Você nasce no ${o.nomeCasa}, um clã ancestral. Dizem que seus patriarcas em reclusão viram com os próprios olhos a Era da Reconstrução. ${ramoTexto}`);
      break;
    case 'seita-menor':
      paragrafos.push(
        `Seus pais são discípulos da ${o.nomeCasa}${o.ortodoxa ? '' : ', uma seita não-ortodoxa temida em toda a região'}. Você cresce entre pátios de treino, incenso e o eco de técnicas sendo praticadas antes do amanhecer.`,
      );
      break;
    case 'seita-suprema':
      paragrafos.push(
        `Seus pais servem à ${o.nomeCasa}, uma das Nove Seitas Supremas${o.ortodoxa ? '' : ' — e a mais temida delas nesta região'}. Nascer dentro de seus muros é um privilégio que milhões de cultivadores jamais terão.`,
      );
      break;
  }

  if (o.familiaDomadora && character.companheira) {
    paragrafos.push(
      `Sua família é de **Domadores de Bestas**. No dia em que você nasce, uma ${character.companheira.especie.replace(' (filhote)', '')} dá à luz no estábulo da casa — e o filhote, ${character.companheira.nome}, não sai do lado do seu berço. Vocês vão crescer juntos.`,
    );
  }

  if (o.reencarnacao) {
    paragrafos.push(
      'Desde bebê, você tem sonhos que não são seus: salões de jade, exércitos ajoelhados, uma traição. Às vezes, acorda sabendo palavras de uma língua que ninguém da família fala.',
    );
  }

  if (o.herancaSelada) {
    paragrafos.push('Pendurado no seu berço aparece um pingente de jade antigo que ninguém da família reconhece. Às vezes, ele parece aquecer sozinho.');
  }

  if (o.corpoEspecial) {
    paragrafos.push(`No dia do seu nascimento, ${o.corpoEspecial.sinal}. Ninguém sabe o que isso significa — ainda.`);
  }

  paragrafos.push('Como você passa a infância?');

  const desfecho = (efeitos: Desfecho['efeitos']): Desfecho => ({
    texto:
      'Seis anos se passam. Chega o dia da Cerimônia do Despertar, quando toda criança toca a Pedra de Teste para revelar sua raiz espiritual.',
    efeitos,
  });

  return no(
    ctx,
    'prologo',
    'Nascimento',
    paragrafos.join('\n\n'),
    [
      {
        texto: 'Socando troncos escondido até as mãos sangrarem. (Punho Marcial)',
        resultado: desfecho({ atributos: { forca: 1 }, aprenderEstilo: 'punho' }),
      },
      {
        texto: 'Brincando de espadachim com um graveto, imitando os guardas. (Caminho da Espada)',
        resultado: desfecho({ atributos: { destreza: 1 }, aprenderEstilo: 'espada' }),
      },
      {
        texto: 'Correndo por telhados e becos, onde ninguém te alcança. (Sombra Veloz)',
        resultado: desfecho({ atributos: { destreza: 1 }, aprenderEstilo: 'sombra' }),
      },
      {
        texto: 'Lendo todo pergaminho que encontra, e copiando os gestos das ilustrações. (Leque do Erudito)',
        resultado: desfecho({ atributos: { inteligencia: 1 }, aprenderEstilo: 'leque' }),
      },
      {
        texto: 'Ouvindo histórias de heróis e imortais, sem treinar nada em especial.',
        resultado: desfecho({ atributos: { espirito: 1, sorte: 1 } }),
      },
    ],
    72,
  );
}

function gerarDespertar(ctx: Contexto): StoryNode {
  const c = ctx.character;
  const o = c.origem;
  const raiz = c.raizEspiritual;
  const grau = grauRaizInfo(raiz.grau);
  const prestigio = ORIGEM_INFO[o.tipo].prestigio;

  const onde = isCla(o.tipo)
    ? `ao salão ancestral do ${o.nomeCasa}`
    : o.tipo === 'seita-menor' || o.tipo === 'seita-suprema'
      ? `ao pátio central da ${o.nomeCasa}`
      : `ao templo de ${o.cidade}`;

  let brilho: string;
  if (raiz.tipo === 'vazio') brilho = 'A luz que surge não tem cor nenhuma — é como olhar para um buraco no mundo.';
  else if (raiz.grau <= 1) brilho = 'A pedra permanece quase apagada. Um brilho fraco, cinzento, que some em segundos.';
  else if (raiz.grau <= 3) brilho = 'A pedra acende com uma luz tímida e estável.';
  else if (raiz.grau <= 5) brilho = 'A pedra se ilumina com força, e um murmúrio corre entre os presentes.';
  else if (raiz.grau <= 7) brilho = 'Uma coluna de luz sobe da pedra até o teto. Os anciões se levantam de seus assentos.';
  else brilho = 'A Pedra de Teste racha ao meio. Por um instante o céu escurece — e todos no salão se ajoelham sem saber por quê.';

  let reacao: string;
  if (raiz.grau <= 1) {
    if (isCla(o.tipo)) {
      reacao =
        o.ramo === 'principal'
          ? 'O patriarca desvia o olhar. Um herdeiro do ramo principal com Raiz Mundana é uma vergonha que o clã não vai esquecer.'
          : '"Sangue colateral", alguém murmura. Ninguém se surpreende.';
    } else if (o.tipo === 'seita-menor' || o.tipo === 'seita-suprema') {
      reacao = 'Os instrutores anotam seu nome na lista dos que servirão como criados.';
    } else if (o.tipo === 'familia-comum') {
      reacao = 'Seus pais te abraçam mesmo assim — mas você vê a esperança morrer nos olhos deles.';
    } else {
      reacao = 'O monge apenas suspira e te devolve a vassoura.';
    }
  } else if (raiz.grau <= 3) {
    reacao = 'É o suficiente para cultivar. Não o suficiente para que alguém espere grandes coisas de você.';
  } else if (raiz.grau <= 5) {
    reacao =
      prestigio <= 1
        ? 'Numa origem humilde como a sua, isso é um acontecimento. Não vai demorar até que alguém de fora venha bater à porta.'
        : `Você passa a ser tratad${g(ctx, 'o', 'a')} como promessa.`;
  } else if (raiz.grau <= 7) {
    reacao = 'Os anciões já discutem que recursos investir em você — e quem mais pode estar de olho.';
  } else {
    reacao = 'A notícia vai correr pela região inteira antes do anoitecer. A partir de hoje, você nunca mais estará em segurança.';
  }

  const paragrafos = [
    `Aos seis anos, você é levad${g(ctx, 'o', 'a')} ${onde}. Pousa a mão na superfície fria da Pedra de Teste...`,
    brilho,
    `**Grau ${raiz.grau} — ${grau.nome}** · ${TIPO_RAIZ_INFO[raiz.tipo].nome} · ${descreverElementos(raiz)}`,
    reacao,
  ];

  if (o.corpoEspecial) {
    paragrafos.push(
      `Os anciões notam algo mais: seu corpo reage à pedra de um jeito estranho. Você possui um **${o.corpoEspecial.nome}** — ${o.corpoEspecial.descricao}`,
    );
  }

  const desfecho = (efeitos: Desfecho['efeitos']): Desfecho => ({
    texto:
      'Seis anos se passam entre treinos, tarefas e as primeiras tentativas de sentir o Chakra circulando pelo corpo. Aos doze anos, sua jornada de verdade começa.',
    efeitos: { ...efeitos, flags: { raizRevelada: true } },
  });

  return no(
    ctx,
    'despertar',
    'A Cerimônia do Despertar',
    paragrafos.join('\n\n'),
    [
      { texto: 'Jurar em silêncio que vai superar qualquer limite.', resultado: desfecho({ atributos: { espirito: 1 } }) },
      { texto: 'Aceitar o resultado com serenidade.', resultado: desfecho({ alinhamento: 5, progresso: 20 }) },
      {
        texto: `Prometer a si mesm${g(ctx, 'o', 'a')} que ninguém nunca mais vai te olhar de cima.`,
        resultado: desfecho({ atributos: { forca: 1 }, alinhamento: -5 }),
      },
    ],
    72,
  );
}

function gerarTribulacao(ctx: Contexto): StoryNode {
  const cultivo = ctx.character.cultivo;
  const reinoAtual = getRealm(cultivo);
  const proximo = REINOS[cultivo.rank] ?? reinoAtual;
  const dificuldade = dificuldadeTribulacao(cultivo);

  const texto =
    cultivo.rank === 1
      ? 'Seu Chakra está no limite. Para romper para o First Origin Realm, você precisa comprimir essa energia bruta até ela se condensar em Star — e o céu vai testar se você é dign' +
        g(ctx, 'o', 'a') +
        '.\n\nNuvens negras se reúnem sobre sua cabeça. O primeiro trovão ecoa.'
      : `Você atingiu o ápice do ${reinoAtual.nome}. Nuvens de tribulação se acumulam por quilômetros, e cultivadores ao redor fogem para não serem pegos no fogo cruzado.\n\nDo outro lado dos raios está o ${proximo.nome}.`;

  const sucesso: Desfecho = {
    texto:
      cultivo.rank === 1
        ? 'O Chakra se comprime em pontos de luz dentro do seu dantian — sua primeira Star. Você deixou de ser um mero praticante de artes marciais.'
        : `O último raio se desfaz contra você. Seu corpo se reconstrói, mais denso, mais puro. Bem-vind${g(ctx, 'o', 'a')} ao ${proximo.nome}.`,
    efeitos: { avancarRank: true, reputacao: 5 * cultivo.rank },
  };

  const falha: Desfecho = {
    texto: 'O último raio te lança ao chão. Você sobrevive, mas sua base de cultivo racha. Vai precisar se recuperar antes de tentar de novo.',
    efeitos: { progresso: -40, danoPercentual: 60, flags: { adiarTribulacaoAte: ctx.turno + 3 } },
  };

  const morte: Desfecho = {
    texto: 'O céu não perdoa. O raio atravessa seu dantian, e sua consciência se dispersa como fumaça ao vento.',
    final: true,
  };

  return no(
    ctx,
    'tribulacao',
    'Tribulação Celestial',
    texto,
    [
      {
        texto: 'Resistir aos raios com o corpo.',
        teste: { atributo: 'constituicao', dificuldade },
        resultado: sucesso,
        falha,
        falhaCritica: morte,
      },
      {
        texto: 'Guiar os raios com a mente e o espírito.',
        teste: { atributo: 'espirito', dificuldade },
        resultado: sucesso,
        falha,
        falhaCritica: morte,
      },
      {
        texto: 'Engolir uma Pílula Dourada Universal antes do trovão.',
        requisito: { item: 'pilula-dourada' },
        teste: { atributo: 'espirito', dificuldade: dificuldade - 6 },
        resultado: { ...sucesso, efeitos: { ...sucesso.efeitos, removerItens: [{ id: 'pilula-dourada', quantidade: 1 }] } },
        falha: { ...falha, efeitos: { ...falha.efeitos, removerItens: [{ id: 'pilula-dourada', quantidade: 1 }] } },
      },
      {
        texto: 'Suprimir o avanço e fortalecer a base por mais tempo.',
        resultado: {
          texto: 'Você dispersa as nuvens com esforço. O céu vai esperar — mas não para sempre.',
          efeitos: { flags: { adiarTribulacaoAte: ctx.turno + 4 } },
        },
      },
    ],
    1,
  );
}

function gerarVelhice(ctx: Contexto): StoryNode {
  const reino = getRealm(ctx.character.cultivo);
  return no(
    ctx,
    'velhice',
    'O Fim do Caminho',
    `Aos ${ctx.idade} anos, você sente o fim chegar. O ${reino.nome} não é capaz de sustentar sua vida por mais tempo.\n\nVocê olha para trás e pesa tudo que fez — e tudo que não teve tempo de fazer.`,
    [
      {
        texto: 'Fechar os olhos em paz.',
        resultado: { texto: 'Sua história termina aqui. Talvez algum dia alguém encontre o que você deixou para trás.', final: true },
      },
    ],
    0,
  );
}

// ---------------------------------------------------------------------------
// Eventos aleatórios
// ---------------------------------------------------------------------------

const EVENTOS: ModeloEvento[] = [
  {
    id: 'periodo-tranquilo',
    peso: () => 4,
    gerar: (ctx) => {
      const custo = 3;
      return no(
        ctx,
        'periodo-tranquilo',
        'Dias Tranquilos',
        `As estações passam em ${local(ctx)}. Não há grandes acontecimentos — só você e o tempo. Como você o usa?`,
        [
          {
            texto: 'Cultivar em reclusão.',
            resultado: { texto: 'Você medita dia e noite, guiando a energia pelos meridianos.', efeitos: { progresso: ganho(ctx, 3) } },
          },
          {
            texto: `Cultivar consumindo pedras espirituais (${custo} pedras).`,
            requisito: { pedras: custo },
            resultado: {
              texto: 'As pedras se desfazem em pó enquanto você absorve a energia pura que guardavam.',
              efeitos: { pedras: -custo, progresso: ganho(ctx, 3, 1.8) },
            },
          },
          {
            texto: 'Treinar o corpo até a exaustão.',
            teste: { atributo: 'constituicao', dificuldade: dif(ctx, 14) },
            resultado: {
              texto: 'Ossos e músculos se reconstroem mais fortes a cada dia.',
              efeitos: { atributos: atributoAleatorio(['forca', 'constituicao']) },
            },
            falha: { texto: 'Você exagera e passa semanas se recuperando.', efeitos: { danoPercentual: 20 } },
          },
          {
            texto: 'Estudar manuais e pergaminhos.',
            teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 15) },
            resultado: { texto: 'Um trecho obscuro finalmente faz sentido.', efeitos: { atributos: { inteligencia: 1 } } },
            falha: { texto: 'As palavras dançam na página sem revelar nada.' },
          },
          {
            texto: 'Trabalhar e caçar em troca de pedras espirituais.',
            resultado: { texto: 'Trabalho honesto, pagamento modesto.', efeitos: { pedras: pedras(ctx, inteiro(2, 5)) } },
          },
        ],
      );
    },
  },
  {
    id: 'mercador',
    peso: () => 2,
    gerar: (ctx) => {
      const c = ctx.character;
      const possuidos = new Set([...c.equipamentos, ...c.inventario.equipamentos].map((e) => e.id));
      const opcoes = EQUIPMENT_CATALOG.filter((e) => !possuidos.has(e.id));
      const oferta = opcoes.length > 0 ? escolher(opcoes) : null;
      const escolhas: StoryChoice[] = [];

      if (oferta) {
        const preco = Math.round(oferta.grau * 12 * ctx.regiao.fatorPoder);
        escolhas.push({
          texto: `Comprar ${oferta.nome} (${formatarBonus(oferta.bonusAtributos)}) — ${preco} pedras.`,
          requisito: { pedras: preco },
          resultado: { texto: 'O mercador embrulha a peça com um sorriso largo.', efeitos: { pedras: -preco, equipamentos: [oferta.id] } },
        });
      }

      const manuaisAmarelos = TECNICAS.filter((t) => t.grau === 1 && !c.tecnicas.includes(t.id));
      if (manuaisAmarelos.length > 0 && chance(0.6)) {
        const manual = escolher(manuaisAmarelos);
        const preco = Math.round(15 * ctx.regiao.fatorPoder);
        escolhas.push({
          texto: `Comprar o manual "${manual.nome}" (${nomeGrau(manual)}) — ${preco} pedras.`,
          requisito: { pedras: preco },
          resultado: { texto: 'Um manual gasto, mas completo. Estude-o pelo inventário.', efeitos: { pedras: -preco, itens: [{ id: idManual(manual.id), quantidade: 1 }] } },
        });
      }

      for (const [id, preco] of [['pilula-chakra', 7], ['pilula-purificacao', 8], ['pilula-cura', 4]] as const) {
        escolhas.push({
          texto: `Comprar ${getConsumivel(id)?.nome} — ${preco} pedras.`,
          requisito: { pedras: preco },
          resultado: { texto: 'Negócio fechado.', efeitos: { pedras: -preco, itens: [{ id, quantidade: 1 }] } },
        });
      }

      const vendaveis = c.inventario.itens.filter((item) => !getConsumivel(item.id)?.efeitosAoUsar && (getConsumivel(item.id)?.valor ?? 0) > 0);
      if (vendaveis.length > 0) {
        const total = vendaveis.reduce((soma, item) => soma + (getConsumivel(item.id)?.valor ?? 0) * item.quantidade, 0);
        escolhas.push({
          texto: `Vender núcleos, ervas e talismãs — ${total} pedras.`,
          resultado: {
            texto: 'O mercador examina cada peça antes de pagar.',
            efeitos: { pedras: total, removerItens: vendaveis.map((item) => ({ id: item.id, quantidade: item.quantidade })) },
          },
        });
      }

      escolhas.push({ texto: 'Seguir seu caminho.', resultado: { texto: 'O mercador dá de ombros e segue viagem.' } });

      return no(
        ctx,
        'mercador',
        'Mercador Ambulante',
        `Um mercador de ${escolher(['barba trançada', 'olhos astutos', 'sorriso dourado'])} abre sua carroça na praça de ${ctx.character.local.cidade}.`,
        escolhas,
        1,
      );
    },
  },
  {
    id: 'rival',
    peso: (ctx) => (ctx.idade >= 12 && !flag(ctx, 'rivalDestruido') ? 2 : 0),
    gerar: (ctx) => {
      const c = ctx.character;
      let rival = flag(ctx, 'rival') as string | undefined;
      if (!rival) {
        rival = gerarNomePessoa();
        c.flags.rival = rival;
      }
      const relacao = isCla(c.origem.tipo)
        ? 'seu primo do ramo principal'
        : c.afiliacao.tipo === 'seita' || c.afiliacao.tipo === 'seita-suprema'
          ? 'um discípulo veterano'
          : 'filho de um mercador rico da cidade';
      const vitorias = Number(flag(ctx, 'vitoriasRival') ?? 0);

      return falando(no(ctx, 'rival', 'O Rival', `${rival}, ${relacao}, bloqueia seu caminho e zomba da sua raiz espiritual diante de todos.`, [
        {
          texto: 'Desafiá-lo para um duelo.',
          combate: inimigo(ctx, rival, 'guerreiro', 0.9 + vitorias * 0.08),
          resultado: {
            texto: `${rival} cai de joelhos diante da multidão. Ele vai se lembrar disso.`,
            efeitos: { reputacao: 6, pedras: pedras(ctx, 3), flags: { vitoriasRival: vitorias + 1 } },
          },
          falha: { texto: 'Você termina no chão, com o riso dele nos ouvidos.', efeitos: { reputacao: -3 } },
        },
        ...(vitorias >= 1
          ? [
              {
                texto: 'Duelo sem piedade: destruir o núcleo dele (caminho demoníaco — gera um Inimigo Jurado).',
                combate: inimigo(ctx, rival, 'guerreiro', 0.9 + vitorias * 0.08),
                resultado: {
                  texto: `${rival} nunca mais vai cultivar. A multidão se cala — alguns de medo, outros de nojo.`,
                  efeitos: {
                    destruirNucleo: { nome: rival, afiliacao: isCla(c.origem.tipo) ? c.origem.nomeCasa : `Família de ${rival}` },
                    flags: { rivalDestruido: true },
                  },
                },
                falha: { texto: 'Ele percebe sua intenção assassina e luta como um animal acuado. Você perde.', efeitos: { reputacao: -5, danoPercentual: 20 } },
              } satisfies StoryChoice,
            ]
          : []),
        {
          texto: 'Engolir a humilhação e treinar em silêncio.',
          resultado: { texto: 'A raiva vira combustível.', efeitos: { progresso: ganho(ctx, 2, 1.2), alinhamento: 3 } },
        },
        {
          texto: 'Armar uma cilada para ele mais tarde.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'Ninguém consegue provar que foi você.', efeitos: { alinhamento: -10, pedras: pedras(ctx, 5), reputacao: 2 } },
          falha: { texto: 'O plano é descoberto. Agora todos sabem o que você tentou.', efeitos: { alinhamento: -10, reputacao: -6 } },
        },
      ], 2), rival, 'rival.png');
    },
  },
  {
    id: 'besta',
    peso: (ctx) => (ctx.idade >= 12 ? 2 : 0),
    gerar: (ctx) => {
      const fera = escolher(ctx.regiao.fauna);
      const atual = ctx.character.companheira;
      const nivelDomador = nivelProfissao(ctx, 'domador');
      const def = inimigo(ctx, fera, 'besta', 0.95);
      const escolhas: StoryChoice[] = [
        {
          texto: 'Lutar contra ela.',
          combate: def,
          resultado: {
            texto: 'A besta tomba. Do peito dela você arranca um núcleo ainda quente.',
            efeitos: { itens: [{ id: 'nucleo-besta', quantidade: 1 }], reputacao: 3 },
          },
          falha: { texto: 'Você foge sangrando, deixando a besta com a vitória.' },
        },
        {
          texto: 'Recuar em silêncio.',
          teste: { atributo: 'destreza', dificuldade: dif(ctx, 10) },
          resultado: { texto: 'Você some entre as árvores antes que ela perceba.' },
          falha: { texto: 'Ela te persegue por um bom trecho antes de desistir.', efeitos: { danoPercentual: 25 } },
        },
      ];
      const contrato: Desfecho = {
        texto: `A ${fera} baixa a cabeça e toca sua mão. Um fio de alma liga vocês dois.${atual ? ` ${atual.nome} volta para a natureza.` : ''}`,
        efeitos: {
          novaCompanheira: { especie: fera, rank: def.rank, estagio: def.estagio, atributoMedio: mediaAtributos(ctx) * 0.85 },
          reputacao: 5,
          xpProfissao: { domador: 40 },
        },
      };
      if (!atual || nivelDomador > 0) {
        escolhas.splice(1, 0, {
          texto: atual ? `Tentar trocar ${atual.nome} por esta besta (contrato de alma).` : 'Tentar formar um contrato de alma com ela.',
          teste: { atributo: 'espirito', dificuldade: dif(ctx, 18) - nivelDomador * 3 },
          resultado: contrato,
          falha: { texto: 'Ela rejeita sua alma com um rugido e ataca.', efeitos: { danoPercentual: 35 } },
        });
      }
      return no(
        ctx,
        'besta',
        'Besta Espiritual',
        `Nas matas perto de ${ctx.character.local.cidade}, você dá de cara com uma ${fera} jovem. Ela ainda não te viu.\n\n**${faixaBesta(def.rank)}** — cultivo equivalente a ${descreverCultivo(def.rank, def.estagio)}.`,
        escolhas,
        2,
      );
    },
  },
  {
    id: 'bandidos',
    peso: (ctx) => (ctx.idade >= 13 ? 0.9 * protecaoFaccao(ctx.character) * fatorEmboscada(ctx.character) : 0),
    gerar: (ctx) => {
      const chefe = `${gerarNomePessoa()}, o ${escolher(['Cicatriz', 'Lâmina Torta', 'Sem Orelha', 'Lobo Cinzento'])}`;
      return no(ctx, 'bandidos', 'Emboscada na Estrada', `Na estrada para ${escolher(ctx.regiao.cidades)}, três bandidos saem do mato. O líder, ${chefe}, estende a mão: "Pedras ou sangue."`, [
        {
          texto: 'Lutar até a morte.',
          combate: inimigo(ctx, chefe, 'guerreiro', 0.75, 0, true),
          resultado: {
            texto: 'Os bandidos jazem na estrada. A bolsa do líder estava cheia.',
            efeitos: { pedras: pedras(ctx, 8), reputacao: 5, alinhamento: 3 },
          },
        },
        {
          texto: `Entregar metade das suas pedras (${Math.floor(ctx.character.inventario.pedrasEspirituais / 2)}).`,
          resultado: {
            texto: 'Eles riem e somem no mato. Seu orgulho dói mais que o bolso.',
            efeitos: { pedras: -Math.floor(ctx.character.inventario.pedrasEspirituais / 2), reputacao: -2 },
          },
        },
        {
          texto: 'Fugir pela mata.',
          teste: { atributo: 'destreza', dificuldade: dif(ctx, 13) },
          resultado: { texto: 'Você desaparece antes que eles consigam reagir.' },
          falha: {
            texto: 'Uma flecha te acerta nas costas, e eles levam o que você carregava.',
            efeitos: { danoPercentual: 40, pedras: -Math.floor(ctx.character.inventario.pedrasEspirituais / 3) },
          },
        },
      ], 2);
    },
  },
  {
    id: 'ruina',
    peso: (ctx) =>
      ctx.idade >= 14 ? 0.8 + Math.max(0, ctx.atributos.sorte - 5) * 0.1 + (flag(ctx, 'rumorRuina') ? 3 : 0) : 0,
    gerar: (ctx) => {
      ctx.character.flags.rumorRuina = false;
      const tesouro = escolherPonderado<Desfecho>([
        {
          valor: {
            texto: 'Numa câmara selada, um manual da Era Dourada ainda está legível. Seu entendimento do Dao se aprofunda.',
            efeitos: { atributos: { espirito: 1, inteligencia: 1 }, progresso: ganho(ctx, 3, 1.5) },
          },
          peso: 3,
        },
        {
          valor: { texto: 'Um cofre de pedra guarda pedras espirituais que ninguém tocou em milênios.', efeitos: { pedras: pedras(ctx, 25) } },
          peso: 3,
        },
        {
          valor: { texto: 'Sobre um altar, uma pílula antiga brilha num frasco intacto.', efeitos: { itens: [{ id: 'pilula-dourada', quantidade: 1 }] } },
          peso: 2,
        },
        {
          valor: {
            texto: 'Um artefato repousa ao lado dos ossos do antigo dono.',
            efeitos: {
              equipamentos: [
                escolher(rank(ctx) >= 3 ? ['lanca-trovao', 'cajado-lua', 'adagas-sombra', 'armadura-escamas-dragao', 'anel-sol'] : ['manto-vento', 'anel-jade', 'colete-escamas']),
              ],
            },
          },
          peso: 2,
        },
        {
          valor: {
            texto: 'Gravado numa placa de jade, um manual de técnica de Grau Terra, inteiro.',
            efeitos: { itens: [{ id: idManual('escudo-qi-dourado'), quantidade: 1 }] },
          },
          peso: ctx.character.tecnicas.includes('escudo-qi-dourado') ? 0 : 2,
        },
      ]);
      return no(ctx, 'ruina', 'Ruína da Era Dourada', 'Depois de um deslizamento, uma entrada de pedra antiga surge na encosta. As inscrições são de antes do Grande Cataclismo.', [
        {
          texto: 'Decifrar as inscrições e desarmar os selos.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 16) },
          resultado: tesouro,
          falha: { texto: 'Um selo antigo explode na sua cara.', efeitos: { danoPercentual: 40 } },
          falhaCritica: { texto: 'A câmara desaba. Você escapa por pouco, muito ferid' + g(ctx, 'o', 'a') + '.', efeitos: { danoPercentual: 80, flags: { quaseMorte: true } } },
        },
        {
          texto: 'Enfrentar o guardião de pedra que desperta na entrada.',
          combate: inimigo(ctx, 'Guardião de Pedra Ancestral', 'besta', 1.05, 1),
          resultado: tesouro,
          falha: { texto: 'O guardião te arremessa para fora da ruína, que se fecha de novo.', efeitos: { flags: { quaseMorte: true } } },
        },
        {
          texto: 'Vender a localização para um clã local.',
          resultado: { texto: 'Pagam bem — e ninguém precisa saber que foi você.', efeitos: { pedras: pedras(ctx, 10), alinhamento: -5 } },
        },
      ], 3);
    },
  },
  {
    id: 'mestre-errante',
    peso: (ctx) => {
      if (flag(ctx, 'mestre') || ctx.idade < 12) return 0;
      const origemHumilde = ORIGEM_INFO[ctx.character.origem.tipo].prestigio <= 1;
      return 0.4 + (origemHumilde && ctx.character.raizEspiritual.grau >= 4 ? 1.5 : 0) + Math.max(0, ctx.atributos.sorte - 5) * 0.05;
    },
    gerar: (ctx) => {
      const mestre = gerarNomePessoa();
      const ensinamento = { progresso: ganho(ctx, 6, 2), atributos: atributoAleatorio(['forca', 'destreza', 'espirito', 'inteligencia']) };
      return falando(no(ctx, 'mestre-errante', 'O Velho de Roupas Gastas', 'Um velho maltrapilho te observa treinar há dias. Hoje ele finalmente fala: "Seu qi circula errado. Quer que eu mostre por quê?"', [
        {
          texto: 'Ajoelhar e pedir para ser discípul' + g(ctx, 'o', 'a') + '.',
          teste: { atributo: 'espirito', dificuldade: dif(ctx, 12) },
          resultado: {
            texto: `O velho diz se chamar ${mestre}. Os meses seguintes mudam tudo que você achava saber sobre cultivo.`,
            efeitos: { ...ensinamento, flags: { mestre } },
          },
          falha: { texto: '"Ainda não", ele diz, e some na multidão.', efeitos: { flags: { mestre: 'recusou' } } },
        },
        {
          texto: 'Oferecer-lhe comida e 2 pedras espirituais.',
          requisito: { pedras: 2 },
          resultado: {
            texto: `${mestre} come em silêncio. Depois, corrige sua postura com dois toques de bastão — e o mundo parece diferente.`,
            efeitos: { pedras: -2, alinhamento: 5, progresso: ganho(ctx, 3, 1.5), flags: { mestre } },
          },
        },
        { texto: 'Ignorar o velho.', resultado: { texto: 'Quando você olha de novo, ele não está mais lá.', efeitos: { flags: { mestre: 'recusou' } } } },
      ], 6), 'Velho de Roupas Gastas', 'mestre-errante.png');
    },
  },
  {
    id: 'recrutamento',
    peso: (ctx) => {
      const c = ctx.character;
      if (c.faccao || c.afiliacao.tipo === 'seita' || c.afiliacao.tipo === 'seita-suprema' || ctx.idade < 12 || ctx.idade > 30) return 0;
      if (ctx.turno < Number(flag(ctx, 'recrutamentoProximo') ?? 0)) return 0;
      const talento = c.raizEspiritual.grau >= 4 || Boolean(c.origem.corpoEspecial) || influenciaPessoal(c).nivel >= 3;
      return talento ? 3 : 0.3;
    },
    gerar: (ctx) => {
      const c = ctx.character;
      const suprema = c.raizEspiritual.grau >= 7 || c.reputacao >= 40;
      const seitaSuprema = escolher(ctx.regiao.seitasSupremas);
      const ortodoxa = suprema ? seitaSuprema.ortodoxa : chance(0.7);
      const nome = suprema ? seitaSuprema.nome : gerarNomeSeita(ortodoxa);
      const estipendio = suprema ? 5 : 2;
      const saindoDeCla = c.afiliacao.tipo === 'cla';

      const aceitar: Desfecho = {
        texto: `Você atravessa os portões da ${nome} como Discípul${g(ctx, 'o', 'a')} Externo.${saindoDeCla ? ' Seu clã não esconde o descontentamento.' : ''}`,
        efeitos: {
          afiliacao: { tipo: suprema ? 'seita-suprema' : 'seita', nome, ortodoxa, posto: 'Discípulo Externo', estipendio },
          alinhamento: ortodoxa ? 10 : -15,
          reputacao: suprema ? 10 : 4,
        },
      };

      const texto = suprema
        ? `Um emissário da ${nome}, uma das Nove Seitas Supremas, chega em pessoa. Os mais velhos empalidecem. "Recusar", alguém sussurra, "nunca é realmente uma opção."`
        : `Um recrutador da ${nome}${ortodoxa ? '' : ' — uma seita não-ortodoxa, de métodos cruéis e resultados rápidos'} ouviu falar de você e oferece uma vaga de discípulo.`;

      return no(ctx, 'recrutamento', 'O Convite de uma Seita', texto, [
        { texto: 'Aceitar.', resultado: aceitar },
        suprema
          ? {
              texto: 'Tentar recusar com educação.',
              teste: { atributo: 'espirito', dificuldade: dif(ctx, 20) },
              resultado: { texto: 'O emissário estreita os olhos — mas aceita. Por enquanto.', efeitos: { reputacao: 3, flags: { recrutamentoProximo: ctx.turno + 8 } } },
              falha: { ...aceitar, texto: 'O emissário nem responde. No dia seguinte, você está a caminho da seita.' },
            }
          : {
              texto: 'Recusar.',
              resultado: { texto: 'O recrutador dá de ombros. "Outros vão aceitar."', efeitos: { flags: { recrutamentoProximo: ctx.turno + 8 } } },
            },
      ], 1);
    },
  },
  {
    id: 'missao-seita',
    peso: (ctx) => (ctx.character.afiliacao.tipo === 'seita' || ctx.character.afiliacao.tipo === 'seita-suprema' ? 2.5 : 0),
    gerar: (ctx) => {
      const afiliacao = ctx.character.afiliacao;
      const contribuicao = 20 + rank(ctx) * 10;
      const recompensa: Desfecho['efeitos'] = {
        pedras: pedras(ctx, afiliacao.tipo === 'seita-suprema' ? 6 : 3),
        reputacao: 5,
        contribuicao,
      };
      const alvo = escolher(ctx.regiao.fauna);
      return no(ctx, 'missao-seita', 'Missão da Seita', `O Salão de Missões da ${afiliacao.nome} afixa um pedido: uma ${alvo} está atacando vilarejos sob proteção da seita. Recompensa: ${contribuicao} pontos de contribuição.`, [
        {
          texto: 'Caçar a besta.',
          combate: inimigo(ctx, alvo, 'besta', 1.0),
          resultado: { texto: 'A besta está morta, e os vilarejos em paz.', efeitos: { ...recompensa, itens: [{ id: 'nucleo-besta', quantidade: 1 }] } },
          falha: { texto: 'Você volta ao Salão de Missões de mãos vazias.', efeitos: { reputacao: -2, contribuicao: -5 } },
        },
        {
          texto: 'Rastrear o covil e montar uma armadilha.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'A armadilha funciona perfeitamente.', efeitos: recompensa },
          falha: { texto: 'A besta foge para as montanhas. Missão fracassada.' },
        },
        { texto: 'Deixar para outro discípulo.', resultado: { texto: 'Há sempre outra missão.' } },
      ], 2);
    },
  },
  {
    id: 'politica-cla',
    peso: (ctx) => (ctx.character.afiliacao.tipo === 'cla' && !ctx.character.faccao && ctx.idade >= 14 ? 2 : 0),
    gerar: (ctx) => {
      const c = ctx.character;
      if (ctx.idade >= 16 && !flag(ctx, 'casamentoAlianca') && chance(0.5)) {
        const outroCla = gerarNomeCla();
        const noivo = gerarNomePessoa();
        return no(ctx, 'politica-cla', 'Casamento de Aliança', `Os anciões do ${c.afiliacao.nome} anunciam: para selar uma aliança com o ${outroCla}, você vai se casar com ${noivo}. Ninguém perguntou sua opinião.`, [
          {
            texto: 'Aceitar o dever.',
            resultado: { texto: 'A cerimônia é suntuosa. A aliança traz recursos — e um estranho para dividir a vida.', efeitos: { pedras: pedras(ctx, 20), reputacao: 5, alinhamento: 5, flags: { casamentoAlianca: noivo } } },
          },
          {
            texto: 'Recusar diante do conselho.',
            teste: { atributo: 'espirito', dificuldade: dif(ctx, 16) },
            resultado: { texto: 'Sua firmeza impressiona até os anciões. O casamento é adiado indefinidamente.', efeitos: { reputacao: 4, flags: { casamentoAlianca: 'recusado' } } },
            falha: { texto: 'O conselho corta seus recursos como punição.', efeitos: { afiliacao: { ...c.afiliacao, estipendio: 0 }, flags: { casamentoAlianca: 'recusado' } } },
          },
          {
            texto: 'Fugir do clã na calada da noite.',
            resultado: {
              texto: 'Você deixa para trás o nome, os recursos e as correntes.',
              efeitos: { afiliacao: { tipo: 'nenhuma', nome: 'Sem vínculo', ortodoxa: true, posto: 'Andarilho', estipendio: 0 }, alinhamento: -5, flags: { casamentoAlianca: 'fugiu' } },
            },
          },
        ], 3);
      }

      const colateral = c.origem.ramo === 'colateral';
      return no(ctx, 'politica-cla', 'Intrigas no Clã', colateral
        ? 'Os recursos da estação foram desviados para os jovens do ramo principal. Mais uma vez.'
        : 'Um ancião do ramo colateral começa a espalhar que você não merece os recursos que recebe.', [
        {
          texto: 'Levar o caso ao Conselho de Anciões.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'Seus argumentos são impecáveis. O conselho decide a seu favor.', efeitos: { pedras: pedras(ctx, 8), reputacao: 3 } },
          falha: { texto: 'O conselho te ignora.', efeitos: { reputacao: -2 } },
        },
        {
          texto: 'Tomar o que é seu do depósito do clã, às escondidas.',
          teste: { atributo: 'destreza', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'Ninguém percebe a falta.', efeitos: { pedras: pedras(ctx, 12), alinhamento: -10 } },
          falha: { texto: 'Você é pego. A punição é pública.', efeitos: { alinhamento: -10, reputacao: -8, danoPercentual: 30 } },
        },
        { texto: 'Ignorar e cultivar.', resultado: { texto: 'A melhor resposta é ficar mais forte.', efeitos: { progresso: ganho(ctx, 3) } } },
      ], 3);
    },
  },
  {
    id: 'aprender-alquimia',
    peso: (ctx) => (nivelProfissao(ctx, 'alquimia') === 0 && ctx.idade >= 12 ? 0.8 + (ctx.atributos.inteligencia >= 10 ? 0.8 : 0) : 0),
    gerar: (ctx) => {
      const mestre = gerarNomePessoa();
      const aprender: Desfecho['efeitos'] = { aprenderProfissao: 'alquimia', equipamentos: ['fornalha-bronze'] };
      return falando(no(ctx, 'aprender-alquimia', 'O Alquimista da Guilda', `${mestre}, um alquimista de 1ª Ordem da Guilda de Alquimistas, procura um aprendiz com boa percepção para cuidar da fornalha. "Artistas marciais também podem controlar a chama", ele diz, "se tiverem cabeça para isso."`, [
        {
          texto: 'Pedir para ser aprendiz.',
          teste: { atributo: 'inteligencia', dificuldade: 13 },
          resultado: { texto: `${mestre} te ensina a sentir o calor da chama espiritual. Você recebe uma fornalha velha.`, efeitos: aprender },
          falha: { texto: '"Mãos de açougueiro", ele resmunga, e fecha a porta.' },
        },
        {
          texto: 'Pagar pelas lições (15 pedras).',
          requisito: { pedras: 15 },
          resultado: { texto: 'Pedras abrem portas. As lições são duras, mas você aprende.', efeitos: { ...aprender, pedras: -15 } },
        },
        { texto: 'Não tenho interesse.', resultado: { texto: 'Seu caminho é outro.', efeitos: { flags: { recusouAlquimia: true } } } },
      ], 6), mestre, 'alquimista.png');
    },
  },
  {
    id: 'aprender-inscricao',
    peso: (ctx) => (nivelProfissao(ctx, 'inscricao') === 0 && ctx.idade >= 12 ? 0.8 + (ctx.atributos.inteligencia >= 10 ? 0.8 : 0) : 0),
    gerar: (ctx) => {
      const aprender: Desfecho['efeitos'] = { aprenderProfissao: 'inscricao', equipamentos: ['pincel-jade'] };
      return no(ctx, 'aprender-inscricao', 'Pergaminho de Padrões Fundamentais', `Numa banca de livros velhos de ${ctx.character.local.cidade}, você encontra um pergaminho sobre Padrões Fundamentais de inscrição, junto de um pincel de jade rachado.`, [
        {
          texto: 'Estudar ali mesmo, noite adentro.',
          teste: { atributo: 'inteligencia', dificuldade: 14 },
          resultado: { texto: 'Os traços começam a fazer sentido — letras de uma língua que o mundo fala em silêncio.', efeitos: aprender },
          falha: { texto: 'O vendedor te expulsa antes que você entenda qualquer coisa.' },
        },
        {
          texto: 'Comprar tudo (8 pedras) e estudar com calma.',
          requisito: { pedras: 8 },
          resultado: { texto: 'Meses de estudo depois, você grava seu primeiro padrão.', efeitos: { ...aprender, pedras: -8 } },
        },
        { texto: 'Deixar para lá.', resultado: { texto: 'Rabiscos de papel não vencem lutas.' } },
      ], 4);
    },
  },
  {
    id: 'refinar-pilulas',
    peso: (ctx) => (nivelProfissao(ctx, 'alquimia') > 0 ? 2.5 : 0),
    gerar: (ctx) => {
      const nivel = nivelProfissao(ctx, 'alquimia');
      const bonus = nivel * 2;
      const escolhas: StoryChoice[] = [
        {
          texto: 'Refinar Pílulas de Reunião de Chakra (3 pedras em ervas).',
          requisito: { pedras: 3 },
          teste: { atributo: 'inteligencia', dificuldade: 13 - bonus },
          resultado: { texto: 'Duas pílulas perfumadas rolam para fora da fornalha.', efeitos: { pedras: -3, itens: [{ id: 'pilula-chakra', quantidade: 2 }], xpProfissao: { alquimia: 30 } } },
          falha: { texto: 'A mistura vira carvão.', efeitos: { pedras: -3, xpProfissao: { alquimia: 10 } } },
        },
        {
          texto: 'Refinar uma Pílula de Purificação (4 pedras).',
          requisito: { pedras: 4 },
          teste: { atributo: 'inteligencia', dificuldade: 15 - bonus },
          resultado: { texto: 'Uma pílula translúcida, fria ao toque.', efeitos: { pedras: -4, itens: [{ id: 'pilula-purificacao', quantidade: 1 }], xpProfissao: { alquimia: 40 } } },
          falha: { texto: 'A fornalha solta fumaça preta.', efeitos: { pedras: -4, xpProfissao: { alquimia: 15 } } },
          falhaCritica: { texto: 'A fornalha explode.', efeitos: { pedras: -4, danoPercentual: 30, xpProfissao: { alquimia: 15 } } },
        },
      ];
      if (nivel >= 2) {
        escolhas.push({
          texto: 'Tentar a Pílula Dourada Universal (12 pedras).',
          requisito: { pedras: 12 },
          teste: { atributo: 'inteligencia', dificuldade: 20 - bonus },
          resultado: { texto: 'Três anéis dourados giram ao redor do núcleo da pílula. Obra-prima.', efeitos: { pedras: -12, itens: [{ id: 'pilula-dourada', quantidade: 1 }], xpProfissao: { alquimia: 90 }, reputacao: 5 } },
          falha: { texto: 'Faltou controle de chama no final.', efeitos: { pedras: -12, xpProfissao: { alquimia: 30 } } },
        });
      }
      escolhas.push({ texto: 'Descansar a fornalha por agora.', resultado: { texto: 'A chama pode esperar.' } });
      return no(ctx, 'refinar-pilulas', 'A Fornalha Chama', 'Você tem ervas, tempo e uma fornalha. O controle de chama é o coração da alquimia — e só a prática o aperfeiçoa.', escolhas, 2);
    },
  },
  {
    id: 'gravar-talismas',
    peso: (ctx) => (nivelProfissao(ctx, 'inscricao') > 0 ? 2.5 : 0),
    gerar: (ctx) => {
      const bonus = nivelProfissao(ctx, 'inscricao') * 2;
      return no(ctx, 'gravar-talismas', 'Tinta e Padrões', 'Papel espiritual, tinta de sangue de besta e o pincel na mão. Cada traço precisa carregar intenção.', [
        {
          texto: 'Gravar Talismãs de Combate (2 pedras em tinta).',
          requisito: { pedras: 2 },
          teste: { atributo: 'inteligencia', dificuldade: 13 - bonus },
          resultado: { texto: 'Dois talismãs brilham quando a tinta seca. Serão usados na próxima luta.', efeitos: { pedras: -2, itens: [{ id: 'talisma-combate', quantidade: 2 }], xpProfissao: { inscricao: 30 } } },
          falha: { texto: 'Um traço torto, e o papel vira cinza.', efeitos: { pedras: -2, xpProfissao: { inscricao: 10 } } },
        },
        {
          texto: 'Tentar combinar padrões de um jeito que nenhum manual descreve.',
          teste: { atributo: 'inteligencia', dificuldade: 19 - bonus },
          resultado: { texto: 'Um padrão novo nasce sob seu pincel. Você entende o "porquê", não só o "como".', efeitos: { atributos: { inteligencia: 1 }, xpProfissao: { inscricao: 70 }, reputacao: 3 } },
          falha: { texto: 'A energia volta pelo pincel e queima sua mão.', efeitos: { danoPercentual: 20, xpProfissao: { inscricao: 20 } } },
        },
        { texto: 'Guardar o pincel.', resultado: { texto: 'Outro dia.' } },
      ], 2);
    },
  },
  {
    id: 'arte-proibida',
    peso: (ctx) => (ctx.idade >= 14 && !flag(ctx, 'arteProibida') ? 0.8 : 0),
    gerar: (ctx) => {
      const estranho = 'Estranho de Manto Carmesim';
      return no(ctx, 'arte-proibida', 'Uma Oferta Proibida', 'Um estranho de manto carmesim te encontra num beco. Ele oferece um fragmento de Arte Proibida: poder imediato, pago com sangue e anos de vida.', [
        {
          texto: 'Aceitar o fragmento.',
          resultado: {
            texto: 'A Arte Proibida do Sangue Fervente se grava na sua alma. Você se sente mais forte — e menos humano.',
            efeitos: { atributos: { forca: 1 }, alinhamento: -25, aprenderTecnica: 'sangue-fervente', flags: { arteProibida: true } },
          },
        },
        { texto: 'Recusar e ir embora.', resultado: { texto: 'Ele sorri como quem sabe que vai te ver de novo.', efeitos: { alinhamento: 5 } } },
        {
          texto: 'Atacá-lo e entregá-lo às autoridades.',
          combate: inimigo(ctx, estranho, 'mistico', 1.05, 1),
          resultado: { texto: 'O cultivador demoníaco é capturado. Sua fama de justiceiro corre a cidade.', efeitos: { alinhamento: 12, reputacao: 8, pedras: pedras(ctx, 6) } },
          falha: { texto: 'Ele some numa névoa vermelha, rindo.', efeitos: { danoPercentual: 20 } },
        },
      ], 1);
    },
  },
  {
    id: 'viajante-ferido',
    peso: () => 1.8,
    gerar: (ctx) => {
      const secreto = percentilComSorte(ctx.atributos.sorte) > 85;
      return no(ctx, 'viajante-ferido', 'Um Viajante Ferido', 'Na beira da estrada, um viajante ensanguentado estende a mão. "Por favor... qualquer coisa."', [
        {
          texto: 'Ajudá-lo (2 pedras em remédios).',
          requisito: { pedras: 2 },
          resultado: secreto
            ? {
                texto: 'Quando ele se recupera, a aura dele muda: era um cultivador poderoso, testando corações. Ele te deixa um presente antes de sumir.',
                efeitos: { pedras: pedras(ctx, 15), alinhamento: 10, progresso: ganho(ctx, 3, 2), reputacao: 3 },
              }
            : { texto: 'Ele agradece com lágrimas nos olhos e segue viagem.', efeitos: { pedras: -2, alinhamento: 8 } },
        },
        { texto: 'Passar reto.', resultado: { texto: 'Você não olha para trás.', efeitos: { alinhamento: -2 } } },
        {
          texto: 'Revistar os bolsos dele.',
          resultado: secreto
            ? { texto: 'Sua mão mal toca o bolso e você voa três metros. Quando levanta, ele não está mais lá.', efeitos: { alinhamento: -15, danoPercentual: 50 } }
            : { texto: 'Algumas pedras, um amuleto barato. Ele está fraco demais para reagir.', efeitos: { alinhamento: -15, pedras: pedras(ctx, 4) } },
        },
      ], 1);
    },
  },
  {
    id: 'torneio',
    peso: (ctx) => (ctx.idade >= 13 ? 1.2 : 0),
    gerar: (ctx) => {
      const cidade = escolher(ctx.regiao.cidades);
      const campeao = gerarNomePessoa();
      return no(ctx, 'torneio', `Torneio de ${cidade}`, `O torneio anual de ${cidade} reúne jovens cultivadores de toda a região. O favorito é ${campeao}, invicto há três edições. A inscrição custa 3 pedras.`, [
        {
          texto: 'Inscrever-se e lutar (3 pedras).',
          requisito: { pedras: 3 },
          combate: inimigo(ctx, campeao, escolher<ArquetipoInimigo>(['guerreiro', 'agil', 'mistico']), 1.05, 1),
          resultado: {
            texto: `${campeao} cai. A multidão grita seu nome.`,
            efeitos: { pedras: pedras(ctx, 20) - 3, reputacao: 12, itens: [{ id: 'pilula-chakra', quantidade: 1 }] },
          },
          falha: { texto: 'Você perde, mas luta bem o bastante para ser notad' + g(ctx, 'o', 'a') + '.', efeitos: { pedras: -3, reputacao: 2 } },
        },
        {
          texto: 'Assistir e estudar os lutadores.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 13) },
          resultado: { texto: 'Cada luta é uma aula.', efeitos: { atributos: atributoAleatorio(['destreza', 'inteligencia']) } },
          falha: { texto: 'Foi divertido, pelo menos.' },
        },
        {
          texto: 'Apostar 5 pedras no azarão.',
          requisito: { pedras: 5 },
          teste: { atributo: 'sorte', dificuldade: 16 },
          resultado: { texto: 'O azarão vence! Você recolhe o prêmio.', efeitos: { pedras: 15 } },
          falha: { texto: 'O azarão perde, como todo azarão.', efeitos: { pedras: -5 } },
        },
      ], 1);
    },
  },
  {
    id: 'despertar-tardio',
    peso: (ctx) => {
      if (flag(ctx, 'despertou') || ctx.character.raizEspiritual.grau > 3 || !flag(ctx, 'raizRevelada')) return 0;
      return flag(ctx, 'quaseMorte') ? 3 : 0.1 + Math.max(0, ctx.atributos.sorte - 5) * 0.03;
    },
    gerar: (ctx) => {
      const salto = percentilComSorte(ctx.atributos.sorte) > 80 ? 3 : 2;
      return no(ctx, 'despertar-tardio', 'Algo se Parte por Dentro', 'Numa noite sem lua, uma dor aguda atravessa seu dantian. Não é ferimento — é algo preso há anos tentando sair.', [
        {
          texto: 'Deixar a energia fluir, custe o que custar.',
          teste: { atributo: 'espirito', dificuldade: 12 },
          resultado: {
            texto: 'Sua raiz espiritual se reorganiza. Aquilo que chamavam de lixo era apenas uma casca.',
            efeitos: { grauRaiz: salto, flags: { despertou: true, quaseMorte: false } },
          },
          falha: {
            texto: 'A energia foge antes que você consiga agarrá-la. Ainda assim, algo mudou.',
            efeitos: { grauRaiz: 1, danoPercentual: 40, flags: { despertou: true, quaseMorte: false } },
          },
        },
        { texto: 'Suprimir a dor e esperar passar.', resultado: { texto: 'A dor passa. A oportunidade também.', efeitos: { flags: { quaseMorte: false } } } },
      ], 3);
    },
  },
  {
    id: 'leilao',
    peso: (ctx) => (ctx.character.inventario.pedrasEspirituais >= 30 && ctx.idade >= 15 ? 1 : 0),
    gerar: (ctx) => {
      const fator = ctx.regiao.fatorPoder;
      const lotes: [string, number, Desfecho['efeitos']][] = [
        ['Pílula Dourada Universal', Math.round(35 * fator), { itens: [{ id: 'pilula-dourada', quantidade: 1 }] }],
        ['Lança de Osso de Besta', Math.round(40 * fator), { equipamentos: ['lanca-besta'] }],
        ['Anel de Jade do Espírito Calmo', Math.round(35 * fator), { equipamentos: ['anel-jade'] }],
        ...(ctx.character.flags.nucleoRachado || ctx.character.flags.sequela
          ? ([['Pílula da Medula Celestial', Math.round(70 * fator), { itens: [{ id: 'pilula-medula-celestial', quantidade: 1 }] }]] as [string, number, Desfecho['efeitos']][])
          : []),
        ...lotesDePilulas(ctx),
      ];
      return no(ctx, 'leilao', 'A Casa de Leilões', `A casa de leilões de ${ctx.character.local.cidade} está lotada. Herdeiros de clãs trocam olhares de desprezo por cima dos lances.`, [
        ...lotes.map(([nome, preco, efeitos]): StoryChoice => ({
          texto: `Dar um lance em ${nome} — ${preco} pedras.`,
          requisito: { pedras: preco },
          resultado: { texto: `O martelo bate. ${nome} é seu.`, efeitos: { ...efeitos, pedras: -preco, reputacao: 2 } },
        })),
        { texto: 'Só observar.', resultado: { texto: 'Você aprende muito sobre quem é quem na região.' } },
      ], 1);
    },
  },
  {
    id: 'chuva-espiritual',
    peso: () => 0.8,
    gerar: (ctx) =>
      no(ctx, 'chuva-espiritual', 'Chuva Espiritual', `Uma rara chuva de energia espiritual cai sobre ${ctx.regiao.preposicao === 'na' ? 'a' : 'o'} ${ctx.regiao.nome}. Cultivadores de toda parte correm para as montanhas.`, [
        { texto: 'Absorver o máximo possível.', resultado: { texto: 'Cada gota é um sopro de energia pura.', efeitos: { progresso: ganho(ctx, 3, 2.5) } } },
        { texto: 'Coletar as gotas que cristalizam no chão.', resultado: { texto: 'Cristais que valem como pedras espirituais.', efeitos: { pedras: pedras(ctx, 8) } } },
      ], 1),
  },
  {
    id: 'rumor-dragao-duplo',
    peso: (ctx) => (ctx.idade >= 15 && !flag(ctx, 'ouviuDragaoDuplo') ? 0.5 : 0),
    gerar: (ctx) => {
      const seitas = ctx.regiao.seitasSupremas.map((s) => s.nome).join(', ');
      return no(ctx, 'rumor-dragao-duplo', 'O Torneio do Dragão Duplo', `Numa casa de chá, um velho conta que o próximo Torneio do Dragão Duplo se aproxima — o evento de cem em cem anos em que as Nove Seitas Supremas disputam seu ranking. Nesta região, as esperanças estão em ${seitas}.`, [
        { texto: 'Ouvir com atenção.', resultado: { texto: 'Um sonho distante — mas um sonho.', efeitos: { atributos: { espirito: 1 }, flags: { ouviuDragaoDuplo: true } } } },
        { texto: 'Rir. Isso é coisa de lenda.', resultado: { texto: 'O velho só sorri.', efeitos: { flags: { ouviuDragaoDuplo: true } } } },
      ], 1);
    },
  },
  {
    id: 'memoria-vida-passada',
    /** GDD 14.3: memórias despertam aos 12, 20 e 30 anos. */
    peso: (ctx) => {
      const vida = ctx.character.origem.reencarnacao;
      if (!vida) return 0;
      const despertadas = Number(flag(ctx, 'memoriasDespertadas') ?? 0);
      const idades = [12, 20, 30];
      return despertadas < idades.length && ctx.idade >= idades[despertadas] ? 40 : 0;
    },
    gerar: (ctx) => {
      const vida = ctx.character.origem.reencarnacao as NonNullable<typeof ctx.character.origem.reencarnacao>;
      const despertadas = Number(flag(ctx, 'memoriasDespertadas') ?? 0);
      const conhece = (id: string): boolean => ctx.character.tecnicas.includes(id);
      const efeitosPorMemoria: Desfecho['efeitos'][] = [
        { atributos: { inteligencia: 2 }, itens: [{ id: idManual(conhece('escudo-qi-dourado') ? 'passos-nuvem' : 'escudo-qi-dourado'), quantidade: 1 }] },
        { progresso: 150, atributos: { espirito: 2 }, itens: [{ id: 'pilula-dourada', quantidade: 2 }] },
        { itens: [{ id: idManual(conhece('sutra-imperador-estelar') ? 'punho-imperador-estelar' : 'sutra-imperador-estelar'), quantidade: 1 }], reputacao: 10 },
      ];
      const textos = [
        `Uma dor de cabeça te derruba — e quando passa, você se lembra: seu nome era **${vida.nomeAntigo}**, ${vida.titulo}. Fragmentos de técnica voltam junto.`,
        `Mais memórias: você se vê ${vida.comoMorreu}. O corpo atual ainda não aguenta o que a alma sabe, mas o cultivo acelera.`,
        `A última memória se encaixa. Você sabe exatamente onde escondeu seu manual mais precioso, séculos atrás — e ele ainda está lá.`,
      ];
      return no(ctx, 'memoria-vida-passada', 'Memórias de Outra Vida', textos[despertadas] ?? textos[0], [
        {
          texto: 'Aceitar quem você foi.',
          resultado: {
            texto: 'Duas vidas agora habitam uma só alma. Alguém, em algum lugar, sentiu o eco despertar.',
            efeitos: { ...efeitosPorMemoria[despertadas], flags: { memoriasDespertadas: despertadas + 1 } },
          },
        },
      ], 1);
    },
  },
  {
    id: 'cacadores-de-ecos',
    peso: (ctx) => (Number(flag(ctx, 'memoriasDespertadas') ?? 0) >= 1 ? 0.9 : 0),
    gerar: (ctx) => {
      const vida = ctx.character.origem.reencarnacao;
      const seita = gerarNomeSeita(false);
      return no(ctx, 'cacadores-de-ecos', 'Caçadores de Ecos', `Cultivadores de mantos negros da ${seita} te cercam. "Nós reconhecemos o eco de ${vida?.nomeAntigo ?? 'um Sábio perdido'}. Ele nos deve uma vida inteira."`, [
        {
          texto: 'Lutar.',
          combate: inimigo(ctx, `Caçador de Ecos da ${seita}`, 'mistico', 1.15, 1),
          resultado: { texto: 'Os caçadores recuam — mas agora sabem quem você é.', efeitos: { reputacao: 4, pedras: pedras(ctx, 8) } },
          falha: { texto: 'Você escapa por pouco, com a alma ferida.', efeitos: { danoPercentual: 35, flags: { quaseMorte: true } } },
        },
        {
          texto: 'Negar tudo e fingir ser só mais um jovem cultivador.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'Eles hesitam, e vão embora resmungando. Por enquanto.' },
          falha: { texto: 'Eles não acreditam.', efeitos: { danoPercentual: 25 } },
        },
      ], 1);
    },
  },
  {
    id: 'adivinho-cego',
    peso: (ctx) => (nivelProfissao(ctx, 'adivinhacao') === 0 && ctx.idade >= 12 ? 0.6 : 0),
    gerar: (ctx) => {
      const nome = gerarNomePessoa();
      return falando(
        no(ctx, 'adivinho-cego', 'O Adivinho Cego', `Um velho cego, com ossos de tartaruga rachados no colo, segura seu pulso quando você passa. "Seu destino é barulhento, criança. Quer aprender a ouvi-lo?"`, [
          {
            texto: 'Aprender a ler sinais (Espírito).',
            teste: { atributo: 'espirito', dificuldade: 13 },
            resultado: { texto: 'Estrelas, rachaduras, sonhos: tudo passa a sussurrar para você.', efeitos: { aprenderProfissao: 'adivinhacao', lerDestino: 'proprio' } },
            falha: { texto: '"Ainda está surdo para o céu", ele ri.' },
          },
          {
            texto: 'Pedir que ele leia seu destino (3 pedras).',
            requisito: { pedras: 3 },
            resultado: { texto: 'Ele joga os ossos e fica muito tempo em silêncio.', efeitos: { pedras: -3, lerDestino: 'pago' } },
          },
          { texto: 'Soltar o braço e seguir.', resultado: { texto: 'Destino é coisa de quem não treina.' } },
        ], 2),
        nome,
        'adivinho.png',
      );
    },
  },
  {
    id: 'achado-de-sorte',
    /** GDD 12: explorar ou sobreviver a uma quase-morte pode render uma Rolagem de Herança. */
    peso: (ctx) => (ctx.idade < 12 ? 0 : 0.2 + (flag(ctx, 'quaseMorte') ? 2 : 0)),
    gerar: (ctx) => {
      const quaseMorte = Boolean(flag(ctx, 'quaseMorte'));
      const tier = rolarTierHeranca(ctx.atributos.sorte);
      const achado = achadoDeHeranca(ctx.character, tier);
      const abertura = quaseMorte
        ? 'Ainda tonto depois de quase morrer, você rola por uma encosta e para diante de uma fenda que ninguém tinha visto.'
        : `Explorando os arredores de ${ctx.character.local.cidade}, algo brilha entre raízes e pedras.`;
      return no(ctx, 'achado-de-sorte', `Um Golpe de Sorte — ${tier}`, `${abertura}\n\n**Rolagem de Herança: ${tier}.** ${achado.texto}`, [
        {
          texto: 'Pegar o que o destino colocou no seu caminho.',
          resultado: { texto: 'Você guarda o achado com cuidado.', efeitos: { ...achado.efeitos, flags: { ...(achado.efeitos.flags ?? {}), quaseMorte: false } } },
        },
      ], 1);
    },
  },
  {
    id: 'vinganca',
    peso: (ctx) => {
      const inimigos = inimigosJurados(ctx.character);
      if (!inimigos.length) return 0;
      return (inimigos.some((r) => !inimigoIntimidado(ctx.character, r)) ? 1.6 : 0.5) * protecaoFaccao(ctx.character) * fatorSegurancaCasa(ctx.character);
    },
    gerar: (ctx) => {
      const ativos = inimigosJurados(ctx.character).filter((r) => !inimigoIntimidado(ctx.character, r));
      if (!ativos.length) {
        const intimidado = escolher(inimigosJurados(ctx.character));
        return no(ctx, 'vinganca', 'Eles Não Ousam', `Espiões da **${intimidado.nome.split(' (')[0]}** rondam sua casa por semanas — e vão embora. Seu poder cresceu tanto que eles não têm coragem de agir.\n\nA rixa continua no papel, mas só você decide quando ela acaba (Relações → Pessoas).`, [
          { texto: 'Deixar que tremam.', resultado: { texto: 'O medo deles é um aviso para todos os outros.', efeitos: { reputacao: 2 } } },
        ], 1);
      }
      const inimigoJurado = escolher(ativos);
      const assassino = `Vingador de ${inimigoJurado.nome.split(' (')[0]}`;
      const rankVingador = Math.max(1, Math.min(inimigoJurado.rank - 1, ctx.character.cultivo.rank + 1));
      const vingador = gerarInimigo(assassino, 'agil', mediaAtributos(ctx) * 1.05, rankVingador, ctx.character.cultivo.estagio);
      return no(ctx, 'vinganca', 'Rixa de Sangue', `Uma lâmina surge da escuridão. **${inimigoJurado.nome}** não esqueceu o núcleo que você destruiu — e mandou alguém cobrar a dívida.\n\nO vingador está no **${descreverCultivo(vingador.rank, vingador.estagio)}**.`, [
        {
          texto: 'Lutar pela própria vida.',
          combate: vingador,
          resultado: { texto: 'O vingador cai. Outros virão.', efeitos: { reputacao: 3 } },
          falha: { texto: 'Você escapa por um triz, sangrando muito.', efeitos: { danoPercentual: 40, flags: { quaseMorte: true } } },
        },
        {
          texto: 'Fugir e se esconder.',
          teste: { atributo: 'destreza', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'Você despista o vingador — por enquanto.' },
          falha: { texto: 'Ele te alcança num beco.', efeitos: { danoPercentual: 35 } },
        },
      ], 1);
    },
  },
  {
    id: 'tumulo-ancestral',
    /** Herança por sorte: raríssima, e mais provável com Sorte alta. */
    peso: (ctx) => {
      if (ctx.idade < 14 || flag(ctx, 'tumuloConquistado') || Number(flag(ctx, 'tumulosVistos') ?? 0) >= 2) return 0;
      return 0.006 + Math.max(0, ctx.atributos.sorte - 5) * 0.004;
    },
    gerar: (ctx) => {
      ctx.character.flags.tumulosVistos = Number(flag(ctx, 'tumulosVistos') ?? 0) + 1;
      const restantes = HERANCAS.filter((h) => !flag(ctx, `heranca:${h.id}`));
      const heranca = escolher(restantes.length ? restantes : HERANCAS);
      const eco = inimigo(ctx, `Eco de Memória de ${heranca.dono.split(',')[0]}`, 'mistico', 1.1, 1);
      const recebe: Desfecho = {
        texto: `O eco sorri e se desfaz em luz. "Que meu caminho continue em você." ${heranca.textoRecompensa}.`,
        efeitos: { heranca: heranca.id, flags: { tumuloConquistado: true } },
      };
      return no(ctx, 'tumulo-ancestral', 'Túmulo Ancestral', `Perseguindo um brilho estranho numa encosta, você cai numa fenda — e desperta diante de um túmulo selado desde a Era Dourada.\n\nÉ o túmulo de **${heranca.dono}**. ${heranca.descricao}\n\nUm eco de memória do antigo dono se ergue: "Só um herdeiro digno levará meu legado. Escolha sua prova."`, [
        {
          texto: 'Prova do Coração: encarar as ilusões do eco.',
          teste: { atributo: 'espirito', dificuldade: dif(ctx, 16) },
          resultado: recebe,
          falha: { texto: 'As ilusões te engolem. Quando você acorda, está do lado de fora e a fenda se fechou.', efeitos: { danoPercentual: 30 } },
        },
        {
          texto: 'Prova da Força: lutar contra o eco.',
          combate: eco,
          resultado: recebe,
          falha: { texto: 'O eco te lança para fora do túmulo. "Ainda não."', efeitos: { flags: { quaseMorte: true } } },
        },
        {
          texto: 'Prova da Sabedoria: decifrar o enigma gravado no selo.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 16) },
          resultado: recebe,
          falha: { texto: 'O enigma se reescreve toda vez que você acha que entendeu. O túmulo te expulsa.' },
        },
      ], 3);
    },
  },
  {
    id: 'pingente-desperta',
    peso: (ctx) => (flag(ctx, 'herancaSelada') && ctx.idade >= 16 ? 50 : 0),
    gerar: (ctx) => {
      const restantes = HERANCAS.filter((h) => !flag(ctx, `heranca:${h.id}`));
      const heranca = escolher(restantes.length ? restantes : HERANCAS);
      return no(ctx, 'pingente-desperta', 'O Pingente Desperta', `Numa noite de lua cheia, o pingente de jade do seu berço racha. De dentro dele sai uma voz antiga: é o eco de **${heranca.dono}**, selado ali para esperar um herdeiro de sangue.\n\n"Você cresceu. Agora está pront${g(ctx, 'o', 'a')}."`, [
        {
          texto: 'Aceitar a herança.',
          resultado: { texto: `O conhecimento de uma era inteira flui para dentro de você. ${heranca.textoRecompensa}.`, efeitos: { heranca: heranca.id, flags: { herancaSelada: false } } },
        },
      ], 1);
    },
  },
  {
    id: 'ovo-besta',
    peso: (ctx) => (flag(ctx, 'ovoBestaAncestral') ? 30 : 0),
    gerar: (ctx) => {
      const especie = `${escolher(ctx.regiao.fauna)} de Sangue Ancestral`;
      return no(ctx, 'ovo-besta', 'O Ovo Racha', `O ovo que você trouxe do túmulo começa a rachar. Dele sai uma **${especie}**, que olha para você como se já te conhecesse.`, [
        {
          texto: 'Formar o contrato de alma com o filhote.',
          resultado: {
            texto: 'O vínculo se forma no mesmo instante. Esta besta vai crescer muito além do comum.',
            efeitos: { novaCompanheira: { especie, rank: 1, estagio: 1, atributoMedio: mediaAtributos(ctx) * 1.2 }, flags: { ovoBestaAncestral: false } },
          },
        },
      ], 1);
    },
  },
  {
    id: 'mestre-ferreiro',
    peso: (ctx) => (nivelProfissao(ctx, 'refinador') === 0 && ctx.idade >= 12 ? 0.8 : 0),
    gerar: (ctx) => {
      const mestre = gerarNomePessoa();
      return falando(
        no(ctx, 'mestre-ferreiro', 'A Forja do Velho Refinador', `${mestre}, um refinador de braços grossos e olhos queimados pelo fogo espiritual, bate o martelo sem olhar para você. "Pílulas curam um. Uma boa espada protege uma família inteira por gerações. Quer aprender?"`, [
          {
            texto: 'Pegar o martelo e tentar (média de Força e Inteligência).',
            teste: { atributo: 'forca', dificuldade: 12 },
            resultado: { texto: 'O metal canta sob o seu martelo. O velho sorri pela primeira vez.', efeitos: { aprenderProfissao: 'refinador', itens: [{ id: 'minerio-estelar', quantidade: 1 }] } },
            falha: { texto: 'Você quase amassa o próprio dedo. "Volte com mais braço."' },
          },
          {
            texto: 'Pagar pelas lições (12 pedras).',
            requisito: { pedras: 12 },
            resultado: { texto: 'Semanas de calor, fuligem e aprendizado.', efeitos: { pedras: -12, aprenderProfissao: 'refinador' } },
          },
          { texto: 'Recusar.', resultado: { texto: 'Espadas se compram.' } },
        ], 3),
        mestre,
        'ferreiro.png',
      );
    },
  },
  {
    id: 'moradia-formacao',
    peso: (ctx) => (getMoradia(ctx.character.moradia) ? 0.5 : 0),
    gerar: (ctx) => {
      const casa = getMoradia(ctx.character.moradia) as Moradia;
      const reparo = Math.max(5, casa.manutencao * 4);
      return no(ctx, 'moradia-formacao', 'Formação Rompida', `Uma rachadura na formação espiritual de ${casa.nome}: a energia da casa está vazando pelo telhado como fumaça azul.`, [
        {
          texto: `Chamar um mestre de formações (${reparo} pedras).`,
          requisito: { pedras: reparo },
          resultado: { texto: 'Em dois dias a formação brilha de novo, mais firme que antes.', efeitos: { pedras: -reparo, progresso: ganho(ctx, 0.5) } },
        },
        {
          texto: 'Consertar você mesmo (Inteligência).',
          teste: { atributo: 'inteligencia', dificuldade: 14 },
          resultado: { texto: 'Traço por traço, você fecha a rachadura. E aprende algo sobre formações.', efeitos: { atributos: { inteligencia: 1 } } },
          falha: { texto: 'A formação estoura na sua cara. Vai ter que pagar o conserto de qualquer jeito.', efeitos: { danoPercentual: 15, pedras: -Math.min(reparo, ctx.character.inventario.pedrasEspirituais) } },
        },
        { texto: 'Deixar vazar por enquanto.', resultado: { texto: 'A casa fica fria e o cultivo, lento.', efeitos: { progresso: -ganho(ctx, 0.5) } } },
      ], 1);
    },
  },
  {
    id: 'moradia-valorizacao',
    peso: (ctx) => (getMoradia(ctx.character.moradia) ? 0.3 : 0),
    gerar: (ctx) => {
      const casa = getMoradia(ctx.character.moradia) as Moradia;
      const oferta = Math.round(casa.preco * (1.1 + Math.random() * 0.3));
      return no(ctx, 'moradia-valorizacao', 'Uma Oferta pela Sua Casa', `Uma seita abriu um pavilhão perto de ${casa.nome} e os preços dispararam. Um comerciante bate à porta oferecendo ${oferta} pedras (você pagou ${casa.preco}).`, [
        {
          texto: `Vender por ${oferta} pedras.`,
          resultado: { texto: 'Negócio fechado. Você volta a viver em estalagens — com a bolsa bem mais pesada.', efeitos: { pedras: oferta, perderMoradia: true } },
        },
        { texto: 'Recusar. Esta casa é sua.', resultado: { texto: 'O comerciante vai embora resmungando.' } },
      ], 1);
    },
  },
  {
    id: 'aprender-domador',
    peso: (ctx) => (nivelProfissao(ctx, 'domador') === 0 && ctx.idade >= 12 ? (ctx.character.companheira ? 2 : 0.7) : 0),
    gerar: (ctx) => {
      const mestre = gerarNomePessoa();
      return falando(no(ctx, 'aprender-domador', 'O Domador Itinerante', `${mestre}, um domador de bestas com um tigre espiritual deitado aos pés, observa você na praça. "Bestas não obedecem a quem manda. Obedecem a quem entendem. Quer aprender?"`, [
        {
          texto: 'Aprender com ele (Espírito).',
          teste: { atributo: 'espirito', dificuldade: 12 },
          resultado: { texto: 'Semanas depois, você entende a linguagem sem palavras das bestas.', efeitos: { aprenderProfissao: 'domador', xpProfissao: { domador: 20 } } },
          falha: { texto: 'O tigre rosna para você. "Volte quando tiver paciência."' },
        },
        {
          texto: 'Pagar pelas lições (10 pedras).',
          requisito: { pedras: 10 },
          resultado: { texto: 'Lições práticas, mordidas incluídas.', efeitos: { pedras: -10, aprenderProfissao: 'domador' } },
        },
        { texto: 'Recusar.', resultado: { texto: 'Bestas são para caçar, não para criar.' } },
      ], 3), mestre, 'domador.png');
    },
  },
  {
    id: 'escola-estilo',
    peso: (ctx) => (ctx.idade >= 12 && ESTILO_IDS.some((id) => ctx.character.estilos[id].nivel === 0) ? 0.9 : 0),
    gerar: (ctx) => {
      const desconhecidos = ESTILO_IDS.filter((id) => ctx.character.estilos[id].nivel === 0);
      const id: EstiloId = escolher(desconhecidos);
      const estilo = ESTILOS[id];
      const mestre = gerarNomePessoa();
      const preco = pedras(ctx, 6);
      return no(ctx, 'escola-estilo', 'Uma Escola de Artes Marciais', `Em ${ctx.character.local.cidade}, o mestre ${mestre} ensina o **${estilo.nome}** — ${estilo.descricao.charAt(0).toLowerCase()}${estilo.descricao.slice(1)}`, [
        {
          texto: `Pedir para ser aceit${g(ctx, 'o', 'a')} como alun${g(ctx, 'o', 'a')} (Compreensão).`,
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 12) },
          resultado: { texto: `${mestre} observa seus movimentos e acena. As aulas começam amanhã, antes do sol.`, efeitos: { aprenderEstilo: id } },
          falha: { texto: '"Volte quando entender por que quer aprender."' },
        },
        {
          texto: `Pagar a mensalidade da escola (${preco} pedras).`,
          requisito: { pedras: preco },
          resultado: { texto: 'Pedras abrem portas de escola também.', efeitos: { pedras: -preco, aprenderEstilo: id } },
        },
        { texto: 'Seguir com os estilos que já conhece.', resultado: { texto: 'Um estilo dominado vale mais que dez pela metade.' } },
      ], 3);
    },
  },
  {
    id: 'pavilhao-tecnicas',
    peso: (ctx) => {
      if (ctx.idade < 12) return 0;
      const grauMax = grauMaximoPorAcesso(ctx.character.afiliacao.tipo, ctx.character.afiliacao.posto, ORIGEM_INFO[ctx.character.origem.tipo].prestigio);
      const disponiveis = TECNICAS.filter((t) => t.grau <= grauMax && t.categoria !== 'proibida' && !t.heranca && !ctx.character.tecnicas.includes(t.id));
      return disponiveis.length > 0 ? 1.5 : 0;
    },
    gerar: (ctx) => {
      const c = ctx.character;
      const grauMax = grauMaximoPorAcesso(c.afiliacao.tipo, c.afiliacao.posto, ORIGEM_INFO[c.origem.tipo].prestigio);
      const disponiveis = TECNICAS.filter((t) => t.grau <= grauMax && t.categoria !== 'proibida' && !t.heranca && !c.tecnicas.includes(t.id));
      const oferta = [...disponiveis].sort(() => Math.random() - 0.5).slice(0, 2);
      const lugar =
        c.afiliacao.tipo === 'seita' || c.afiliacao.tipo === 'seita-suprema'
          ? `o Pavilhão de Manuais da ${c.afiliacao.nome}`
          : c.afiliacao.tipo === 'cla'
            ? `a biblioteca do ${c.afiliacao.nome}`
            : `um sebo empoeirado de ${c.local.cidade}`;
      const contribuicao = pedras(ctx, 4);

      return no(ctx, 'pavilhao-tecnicas', 'Manuais de Técnicas', `Você tem acesso a ${lugar}. Seu acesso permite técnicas até o Grau ${['Amarelo', 'Xuan', 'Terra', 'Céu', 'Divino'][grauMax - 1]}. Qual você estuda?`, [
        ...oferta.map((tecnica): StoryChoice => ({
          texto: `Estudar ${tecnica.nome} — ${nomeGrau(tecnica)} (contribuição de ${contribuicao} pedras).`,
          requisito: { pedras: contribuicao },
          teste: { atributo: 'inteligencia', dificuldade: dificuldadeAprendizado(tecnica) },
          resultado: { texto: `Depois de semanas, ${tecnica.nome} flui por você como se sempre tivesse estado lá. ${tecnica.descricao}`, efeitos: { pedras: -contribuicao, aprenderTecnica: tecnica.id } },
          falha: { texto: 'As palavras estão ali, mas o sentido escapa. Sua Compreensão ainda não alcança.', efeitos: { pedras: -contribuicao } },
        })),
        { texto: 'Não estudar agora.', resultado: { texto: 'Os manuais continuarão ali.' } },
      ], 3);
    },
  },
  {
    id: 'plantao-guarda',
    peso: (ctx) => (ocupacao(ctx) === 'guarda' ? 2.5 : 0),
    gerar: (ctx) => {
      const procurado = `${gerarNomePessoa()}, o ${escolher(['Mão de Seda', 'Sete Facas', 'Rato Dourado', 'Sorriso Frio'])}`;
      return no(ctx, 'plantao-guarda', 'Plantão da Guarda', `Um cartaz na sede da guarda de ${ctx.character.local.cidade}: ${procurado}, procurado por roubo e assassinato, foi visto no mercado.`, [
        {
          texto: 'Encurralá-lo e prendê-lo à força.',
          combate: inimigo(ctx, procurado, 'agil', 0.95),
          resultado: { texto: 'Ele é arrastado acorrentado pelas ruas. A cidade aplaude.', efeitos: { desempenho: 25, reputacao: 5, alinhamento: 3, pedras: pedras(ctx, 4) } },
          falha: { texto: 'Ele escapa pelos telhados, rindo.', efeitos: { desempenho: -10 } },
        },
        {
          texto: 'Seguir as pistas até o esconderijo.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 14) },
          resultado: { texto: 'Você o encontra dormindo. Prisão sem um arranhão.', efeitos: { desempenho: 20, reputacao: 3 } },
          falha: { texto: 'As pistas levam a lugar nenhum.', efeitos: { desempenho: -5 } },
        },
        {
          texto: 'Aceitar o suborno que ele manda por um mensageiro.',
          resultado: { texto: 'A bolsa é pesada. Sua consciência, também.', efeitos: { pedras: pedras(ctx, 10), alinhamento: -12, desempenho: -10 } },
        },
      ], 1);
    },
  },
  {
    id: 'luta-arena',
    peso: (ctx) => (ocupacao(ctx) === 'arena' ? 3 : 0),
    gerar: (ctx) => {
      const cargo = ctx.character.ocupacao?.cargo ?? 0;
      const oponente = `${gerarNomePessoa()}, ${escolher(['o Touro de Ferro', 'a Víbora Branca', 'o Punho Trovejante', 'a Lâmina Silenciosa'])}`;
      return no(ctx, 'luta-arena', 'Noite de Arena', `As arquibancadas estão lotadas. Seu oponente hoje é ${oponente}. Apostas voam de mão em mão.`, [
        {
          texto: 'Lutar para vencer.',
          combate: inimigo(ctx, oponente, escolher<ArquetipoInimigo>(['guerreiro', 'agil', 'mistico']), 0.95 + cargo * 0.04),
          resultado: { texto: 'A multidão grita seu nome.', efeitos: { desempenho: 25, reputacao: 4, pedras: pedras(ctx, 3 + cargo * 2) } },
          falha: { texto: 'Você cai na areia sob vaias.', efeitos: { desempenho: -12 } },
        },
        {
          texto: 'Entregar a luta em troca de pedras do submundo.',
          resultado: { texto: 'Você cai no terceiro golpe, como combinado.', efeitos: { pedras: pedras(ctx, 8 + cargo * 3), alinhamento: -10, desempenho: -8, reputacao: -3 } },
        },
        { texto: 'Alegar ferimento e não lutar.', resultado: { texto: 'O organizador anota seu nome com desprezo.', efeitos: { desempenho: -6 } } },
      ], 1);
    },
  },
  {
    id: 'golpe-submundo',
    peso: (ctx) => (ocupacao(ctx) === 'submundo' ? 2.5 : 0),
    gerar: (ctx) => {
      const chefe = gerarNomePessoa();
      return no(ctx, 'golpe-submundo', 'Um Golpe Grande', `${chefe}, que manda no submundo de ${ctx.character.local.cidade}, planeja roubar o cofre de uma casa de leilões e quer você na equipe.`, [
        {
          texto: 'Entrar no golpe.',
          teste: { atributo: 'destreza', dificuldade: dif(ctx, 15) },
          resultado: { texto: 'Entram, saem, ninguém vê nada. Sua parte é generosa.', efeitos: { pedras: pedras(ctx, 18), desempenho: 25, alinhamento: -8, reputacao: 2 } },
          falha: { texto: 'O alarme de uma formação dispara. Você foge ferido e de mãos vazias.', efeitos: { danoPercentual: 35, desempenho: -15 } },
        },
        {
          texto: 'Planejar a rota de fuga pelos esgotos.',
          teste: { atributo: 'inteligencia', dificuldade: dif(ctx, 14) },
          resultado: { texto: 'O plano é perfeito. Você recebe menos, mas nunca é visto.', efeitos: { pedras: pedras(ctx, 10), desempenho: 15, alinhamento: -5 } },
          falha: { texto: 'O plano tem uma falha, e a culpa cai em você.', efeitos: { desempenho: -12 } },
        },
        {
          texto: 'Delatar o bando à guarda.',
          resultado: { texto: 'O bando é preso. Você sai do submundo pela porta dos fundos — e com a cabeça a prêmio.', efeitos: { alinhamento: 15, reputacao: 5, pedras: pedras(ctx, 6), perderOcupacao: true } },
        },
      ], 1);
    },
  },
  {
    id: 'encomenda-guilda',
    peso: (ctx) => (ocupacao(ctx) === 'guilda-alquimia' || ocupacao(ctx) === 'pavilhao-inscricao' ? 2.5 : 0),
    gerar: (ctx) => {
      const alquimia = ocupacao(ctx) === 'guilda-alquimia';
      const profissao = alquimia ? 'alquimia' : 'inscricao';
      const bonus = nivelProfissao(ctx, profissao) * 2;
      const cliente = `o herdeiro do ${gerarNomeCla()}`;
      const pedido = alquimia ? 'uma pílula de cura para o pai moribundo' : 'uma formação de proteção para a mansão do clã';
      return no(ctx, 'encomenda-guilda', 'Uma Encomenda Importante', `${cliente[0].toUpperCase()}${cliente.slice(1)} chega com uma encomenda urgente: ${pedido}. Paga bem, mas não aceita falhas.`, [
        {
          texto: 'Aceitar e dar o melhor de si.',
          teste: { atributo: 'inteligencia', dificuldade: 16 - bonus },
          resultado: {
            texto: 'O trabalho sai impecável. O cliente promete contar a todos.',
            efeitos: { pedras: pedras(ctx, 12), desempenho: 25, reputacao: 4, xpProfissao: { [profissao]: 50 } },
          },
          falha: { texto: 'O resultado não serve. O cliente reclama com seu superior.', efeitos: { desempenho: -12, xpProfissao: { [profissao]: 15 } } },
        },
        {
          texto: 'Recusar educadamente.',
          resultado: { texto: 'Melhor recusar do que falhar diante de um clã.', efeitos: { desempenho: -3 } },
        },
      ], 2);
    },
  },
];

export function gerarProximoEvento(character: Character, turno: number, recentes: string[]): StoryNode {
  const ctx = criarContexto(character, turno);

  if (ctx.idade >= expectativaDeVidaAnos(character)) return gerarVelhice(ctx);
  if (!character.flags.raizRevelada) return gerarDespertar(ctx);

  const adiarAte = Number(character.flags.adiarTribulacaoAte ?? 0);
  if (precisaTribulacao(character.cultivo) && turno >= adiarAte) return gerarTribulacao(ctx);

  const modelo = escolherPonderado(
    EVENTOS.map((evento) => ({
      valor: evento,
      peso: evento.peso(ctx) * (recentes.includes(evento.id) ? 0.2 : 1) * multiplicadorProfecia(character, evento.id),
    })),
  );
  const node = modelo.gerar(ctx);
  const aviso = verificarProfecia(character, node.evento);
  return aviso ? { ...node, texto: `${aviso}\n\n${node.texto}` } : node;
}
