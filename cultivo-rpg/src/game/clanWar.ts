import type { Character } from './character';
import { getEffectiveAttributes } from './character';
import type { StoryChoice } from './story';
import type { MundoState } from './worldState';
import { gerarInimigo } from './combat';
import { REINOS } from './cultivation';
import { addPedrasEspirituais } from './inventory';
import { protecaoFaccao } from './faction';
import { REGIOES } from './world';
import { chance, escolher } from './rng';
import { FaccaoMundo, TipoFaccaoMundo, acharFaccao, faccaoDoJogador, faccoesDaRegiao, poderFaccao } from './regionalFactions';

/**
 * Guerra de Clãs (e de seitas): uma facção rival declara guerra à sua.
 * O placar vai de −5 (derrota) a +5 (vitória); cada estação a guerra pende para o lado mais forte,
 * e as suas ações (ataques, duelos com anciões, sabotagem) empurram o placar.
 */
export interface GuerraClas {
  inimigo: string;
  inimigoTipo: TipoFaccaoMundo;
  /** Poder inimigo ÷ poder do seu lado no início da guerra. */
  razao: number;
  placar: number;
  estacoes: number;
  motivo: string;
  /** Líder inimigo (para o duelo com um ancião). */
  lider: { nome: string; rank: number; estagio: number };
  /** Nome da sua facção (a que cresce se vencer). */
  lado?: string;
  /** Foi você quem provocou a guerra. */
  provocada?: boolean;
}

export const ENERGIA_PROVOCAR = 1;

export const PLACAR_DECISIVO = 5;
export const ESTACOES_MAXIMAS = 12;
export const ENERGIA_ATAQUE = 2;
export const ENERGIA_SABOTAGEM = 1;

const MOTIVOS = [
  'uma disputa por uma veia de pedras espirituais',
  'um campo de ervas de mil anos na fronteira dos territórios',
  'uma humilhação antiga que nunca foi esquecida',
  'o assassinato de um jovem mestre, que cada lado atribui ao outro',
  'o controle das rotas comerciais da cidade',
];

export function podeTerGuerra(character: Character): boolean {
  const tipo = character.afiliacao.tipo;
  return Boolean(character.faccao) || tipo === 'cla' || tipo === 'seita' || tipo === 'seita-suprema';
}

/** Rival: da mesma região e do mesmo tipo (clã contra clã, seita contra seita), com força parecida. */
export function escolherRival(mundo: MundoState, character: Character): FaccaoMundo | null {
  const meu = faccaoDoJogador(mundo, character);
  if (!meu) return null;
  const meuTipo: TipoFaccaoMundo = character.faccao ? (character.faccao.tipo === 'cla' ? 'cla' : 'seita') : character.afiliacao.tipo === 'cla' ? 'cla' : 'seita';
  const candidatos = faccoesDaRegiao(mundo, character.local.regiao).filter(
    (f) => f.nome !== meu.nome && (f.tipo === meuTipo || (meuTipo === 'seita' && f.tipo === 'seita-suprema' && character.afiliacao.tipo === 'seita-suprema')),
  );
  if (!candidatos.length) return null;
  const parecidos = candidatos.filter((f) => {
    const razao = poderFaccao(mundo, f) / Math.max(1, meu.poder);
    return razao >= 0.5 && razao <= 1.8;
  });
  return escolher(parecidos.length ? parecidos : candidatos);
}

export function iniciarGuerra(mundo: MundoState, character: Character, rival: FaccaoMundo, motivo: string): GuerraClas {
  const meu = faccaoDoJogador(mundo, character);
  const razao = poderFaccao(mundo, rival) / Math.max(1, meu?.poder ?? 1);
  character.guerra = {
    inimigo: rival.nome,
    inimigoTipo: rival.tipo,
    razao: Math.round(razao * 100) / 100,
    placar: 0,
    estacoes: 0,
    motivo,
    lider: { ...rival.lider },
    lado: meu?.nome,
  };
  return character.guerra;
}

/** Facções da região que você pode provocar: do mesmo tipo (clã contra clã, seita contra seita). */
export function rivaisProvocaveis(mundo: MundoState, character: Character): { faccao: FaccaoMundo; razao: number }[] {
  const meu = faccaoDoJogador(mundo, character);
  if (!meu) return [];
  const souCla = character.faccao ? character.faccao.tipo === 'cla' : character.afiliacao.tipo === 'cla';
  return faccoesDaRegiao(mundo, character.local.regiao)
    .filter((f) => f.nome !== meu.nome && (souCla ? f.tipo === 'cla' : f.tipo !== 'cla'))
    .map((f) => ({ faccao: f, razao: Math.round((poderFaccao(mundo, f) / Math.max(1, meu.poder)) * 100) / 100 }))
    .sort((a, b) => a.razao - b.razao);
}

export function bloqueioProvocar(character: Character, energia: number): string | null {
  if (!podeTerGuerra(character)) return 'Só quem pertence a um clã ou seita (ou fundou o seu) pode provocar uma guerra.';
  if (character.guerra) return 'Você já está em guerra.';
  if (character.idadeMeses < 16 * 12) return 'Ninguém leva a sério uma provocação de quem tem menos de 16 anos.';
  if (energia < ENERGIA_PROVOCAR) return 'Sem energia.';
  return null;
}

/** Provocar uma guerra de propósito: insultar o herdeiro rival, roubar um campo de ervas, desafiar em público. */
export function provocarGuerra(mundo: MundoState, character: Character, nomeRival: string): string[] {
  const rival = faccoesDaRegiao(mundo, character.local.regiao).find((f) => f.nome === nomeRival);
  if (!rival || character.guerra || !podeTerGuerra(character)) return [];
  const motivo = escolher([
    `você humilhou o herdeiro do ${rival.nome} diante da cidade inteira`,
    `você tomou à força um campo de ervas do ${rival.nome}`,
    `você desafiou publicamente o líder do ${rival.nome}`,
  ]);
  const g = iniciarGuerra(mundo, character, rival, motivo);
  g.provocada = true;
  character.alinhamento = { valor: Math.max(-100, character.alinhamento.valor - 3) };
  return [
    `Guerra provocada: ${motivo}. O ${rival.nome} declara guerra ao ${g.lado ?? 'seu lado'}!`,
    'Se vencerem, sua casa cresce (membros e prestígio) e o rival vira vassalo. Acompanhe o placar aqui em Guerra de Clãs.',
  ];
}

/**
 * O evento de declaração só marca a guerra aceita nas flags (eventos não mexem no mundo);
 * quando a história avança, a guerra começa de fato contra aquela facção.
 */
export function comecarGuerraDeclarada(mundo: MundoState, character: Character): string[] {
  const nome = character.flags.guerraDeclarada;
  if (typeof nome !== 'string') return [];
  const motivo = String(character.flags.guerraMotivo ?? motivoAleatorio());
  delete character.flags.guerraDeclarada;
  delete character.flags.guerraMotivo;
  if (character.guerra || !podeTerGuerra(character)) return [];
  const rival = acharFaccao(mundo, nome);
  if (!rival) return [];
  const g = iniciarGuerra(mundo, character, rival, motivo);
  return [`A guerra contra o ${g.inimigo} começou. Acompanhe e aja no painel Mundo → Guerra.`];
}

export function motivoAleatorio(): string {
  return escolher(MOTIVOS);
}

/** Texto curto: quem está vencendo. */
export function situacaoDaGuerra(g: GuerraClas): string {
  if (g.placar >= 3) return 'Vocês estão perto da vitória';
  if (g.placar > 0) return 'Vocês levam vantagem';
  if (g.placar === 0) return 'Equilíbrio sangrento';
  if (g.placar > -3) return 'O inimigo leva vantagem';
  return 'Vocês estão à beira da derrota';
}

function mediaAtributos(character: Character): number {
  const a = getEffectiveAttributes(character);
  return (a.forca + a.destreza + a.inteligencia + a.constituicao + a.espirito + a.sorte) / 6;
}

/** Luta contra um jovem talento inimigo: forte como você (placar +1). */
export function escolhaAtaque(character: Character): StoryChoice {
  const g = character.guerra as GuerraClas;
  const { rank, estagio } = character.cultivo;
  return {
    texto: `Liderar um ataque contra ${g.inimigo}`,
    combate: gerarInimigo(`Jovem talento do ${g.inimigo}`, 'guerreiro', mediaAtributos(character) * (0.9 + Math.min(0.3, g.razao * 0.1)), rank, estagio),
    resultado: { texto: 'A linha inimiga se rompe. Seus companheiros gritam seu nome.', efeitos: { reputacao: 3, flags: { guerraPonto: 1 }, feitos: { mortes: 3 } } },
    falha: { texto: 'O ataque fracassa e você recua carregando feridos.', efeitos: { flags: { guerraPonto: -1 } } },
  };
}

/** Duelo com o líder inimigo: a força dele é real, não se ajusta à sua (placar +3). */
export function escolhaDueloLider(character: Character): StoryChoice {
  const g = character.guerra as GuerraClas;
  const l = g.lider;
  return {
    texto: `Desafiar ${l.nome}, líder do ${g.inimigo} (${REINOS[l.rank - 1]?.nome})`,
    combate: gerarInimigo(l.nome, 'mistico', 9 + l.rank * 1.2, l.rank, l.estagio),
    resultado: { texto: `${l.nome} cai diante dos dois exércitos. A guerra muda de rumo num instante.`, efeitos: { reputacao: 15, flags: { guerraPonto: 3 }, feitos: { mortes: 1 } } },
    falha: { texto: `${l.nome} nem precisou se esforçar. A derrota desmoraliza o seu lado.`, efeitos: { danoPercentual: 20, flags: { guerraPonto: -2 } } },
  };
}

/** Sabotagem: incendiar depósitos e envenenar poços (Destreza; placar +1). */
export function escolhaSabotagem(character: Character): StoryChoice {
  const g = character.guerra as GuerraClas;
  return {
    texto: `Sabotar os depósitos do ${g.inimigo} (Destreza)`,
    teste: { atributo: 'destreza', dificuldade: 12 + Math.round(g.razao * 3) + character.cultivo.rank },
    resultado: { texto: 'Os depósitos ardem noite adentro. O inimigo vai passar fome.', efeitos: { flags: { guerraPonto: 1 } } },
    falha: { texto: 'Uma patrulha te descobre. Você escapa ferido.', efeitos: { danoPercentual: 25 } },
  };
}

/** Aplica o ponto de guerra que uma escolha deixou nas flags (combates e testes do painel). */
export function registrarPontoDeGuerra(character: Character): number {
  const ponto = Number(character.flags.guerraPonto ?? 0);
  delete character.flags.guerraPonto;
  if (!ponto || !character.guerra) return 0;
  character.guerra.placar = Math.max(-PLACAR_DECISIVO, Math.min(PLACAR_DECISIVO, character.guerra.placar + ponto));
  return ponto;
}

export function custoTregua(character: Character): number {
  const g = character.guerra;
  if (!g) return 0;
  const fator = REGIOES[character.local.regiao].fatorPoder;
  return g.placar >= 0 ? 0 : Math.round(40 * fator * -g.placar);
}

export function proporTregua(character: Character): string[] {
  const g = character.guerra;
  if (!g) return [];
  const custo = custoTregua(character);
  if (character.inventario.pedrasEspirituais < custo) return [`O ${g.inimigo} exige ${custo} pedras de indenização para aceitar a trégua.`];
  addPedrasEspirituais(character.inventario, -custo);
  character.guerra = null;
  character.flags.fimGuerraIdade = character.idadeMeses;
  return [
    custo > 0
      ? `Você paga ${custo} pedras de indenização. O ${g.inimigo} aceita a trégua — por enquanto.`
      : `Com vantagem no campo, você dita os termos: o ${g.inimigo} aceita a trégua.`,
  ];
}

function encerrar(mundo: MundoState, character: Character, vitoria: boolean, armisticio = false): string[] {
  const g = character.guerra as GuerraClas;
  const fator = REGIOES[character.local.regiao].fatorPoder;
  const inimigo = acharFaccao(mundo, g.inimigo);
  character.guerra = null;
  character.flags.fimGuerraIdade = character.idadeMeses;
  if (armisticio) return [`Depois de ${g.estacoes} estações, os dois lados exaustos assinam um armistício com o ${g.inimigo}.`];

  if (vitoria) {
    const saque = Math.round(60 * fator * (1 + g.razao));
    addPedrasEspirituais(character.inventario, saque);
    character.reputacao += 25;
    if (inimigo) inimigo.membros = Math.max(5, Math.round(inimigo.membros * 0.65));
    if (character.faccao) character.faccao.membros += Math.max(3, Math.round(character.faccao.membros * 0.35));
    const minha = g.lado ? acharFaccao(mundo, g.lado) : undefined;
    if (minha) minha.membros = Math.round(minha.membros * 1.35);
    character.flags.famaFamiliar = Number(character.flags.famaFamiliar ?? 0) + 25;
    if (!character.relacoes.some((r) => r.nome === g.inimigo)) {
      character.relacoes.push({
        id: Math.random().toString(36).slice(2, 10),
        nome: g.inimigo,
        tipo: 'Vassalo',
        idade: 0,
        rank: Math.max(1, g.lider.rank - 1),
        estagio: 1,
        aparencia: 0,
        inteligencia: 0,
        compatibilidadeElemental: 0,
        relacao: 30,
      });
    }
    return [
      `VITÓRIA! O ${g.inimigo} se rende e passa a pagar tributo como vassalo.`,
      `Espólios de guerra: ${saque} pedras. Reputação +25.`,
      `${g.lado ? `O ${g.lado}` : 'Sua casa'} cresce: novos membros chegam atraídos pela vitória, e o nome da sua família ganha prestígio.`,
    ];
  }

  const perda = Math.round(character.inventario.pedrasEspirituais * 0.4);
  addPedrasEspirituais(character.inventario, -perda);
  character.reputacao -= 15;
  const mensagens = [`DERROTA. O ${g.inimigo} marcha sobre o seu território. Você perde ${perda} pedras e reputação −15.`];
  if (inimigo) inimigo.membros = Math.round(inimigo.membros * 1.15);
  if (character.faccao) {
    const f = character.faccao;
    f.membros = Math.max(3, Math.round(f.membros * 0.7));
    const chave = (Object.keys(f.instalacoes) as (keyof typeof f.instalacoes)[]).find((k) => f.instalacoes[k] > 0);
    if (chave) f.instalacoes[chave] -= 1;
    mensagens.push(`${f.nome} perde um terço dos membros${chave ? ' e uma instalação é destruída' : ''}.`);
  }
  return mensagens;
}

/** A cada estação a guerra pende para quem é mais forte; muralhas da sua facção seguram os ataques. */
export function processarGuerra(mundo: MundoState, character: Character, estacoes: number): string[] {
  const mensagens: string[] = [];
  for (let i = 0; i < estacoes && character.guerra; i++) {
    const g = character.guerra;
    g.estacoes += 1;
    const pressao = Math.min(0.6, 0.3 * g.razao) * protecaoFaccao(character);
    const contraAtaque = Math.min(0.6, 0.3 / Math.max(0.3, g.razao));
    if (chance(pressao)) {
      g.placar -= 1;
      mensagens.push(`Guerra: o ${g.inimigo} ataca uma de suas posições. (${situacaoDaGuerra(g)})`);
    }
    if (chance(contraAtaque)) {
      g.placar += 1;
      mensagens.push(`Guerra: seus aliados vencem uma escaramuça contra o ${g.inimigo}. (${situacaoDaGuerra(g)})`);
    }
    if (g.placar >= PLACAR_DECISIVO) mensagens.push(...encerrar(mundo, character, true));
    else if (g.placar <= -PLACAR_DECISIVO) mensagens.push(...encerrar(mundo, character, false));
    else if (g.estacoes >= ESTACOES_MAXIMAS) mensagens.push(...encerrar(mundo, character, false, true));
  }
  return mensagens;
}

/** Chamado depois de uma ação do painel: se o placar decidiu a guerra, encerra na hora. */
export function verificarFimDaGuerra(mundo: MundoState, character: Character): string[] {
  const g = character.guerra;
  if (!g) return [];
  if (g.placar >= PLACAR_DECISIVO) return encerrar(mundo, character, true);
  if (g.placar <= -PLACAR_DECISIVO) return encerrar(mundo, character, false);
  return [];
}
