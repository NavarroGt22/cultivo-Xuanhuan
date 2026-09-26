import { ATTRIBUTE_KEYS, AttributeKey, Attributes } from './attributes';
import { Character, getCharacterStats, getEffectiveAttributes } from './character';
import { DerivedStats, getDerivedStats } from './stats';
import { variacao } from './rng';
import { Tecnica, bonusVelocidade, getTecnica } from './techniques';
import { SINCRONIA_ATAQUE_COMBINADO, SINCRONIA_FUSAO, combatenteDaCompanheira } from './companion';
import { Elemento } from './spiritualRoot';
import { descreverConfronto, elementoDeCombate, elementoDeNome, fatorElemental } from './elements';

export type ArquetipoInimigo = 'besta' | 'guerreiro' | 'agil' | 'mistico';

/** Inimigo serializável (vai dentro do nó de história salvo). */
export interface InimigoDef {
  nome: string;
  atributos: Attributes;
  rank: number;
  estagio: number;
  /** Derrota em luta letal = morte. */
  letal?: boolean;
  /** Elemento no ciclo Wu Xing (ausente = sem afinidade elemental). */
  elemento?: Elemento;
}

export interface Combatente {
  nome: string;
  vida: number;
  vidaMax: number;
  ataque: number;
  tecnica: number;
  defesa: number;
  esquiva: number;
  critico: number;
  /** Inteligência: reduz a esquiva do alvo, ponto a ponto. */
  precisao: number;
  /** Destreza: quem é mais veloz ataca primeiro e pode golpear duas vezes. */
  velocidade: number;
  /** Reserva para técnicas ativas; começa cheia a cada luta. */
  chakra: number;
  /** Absorve dano antes da vida. */
  escudo: number;
  /** Multiplicador de dano ativo (artes proibidas). */
  furia: number;
  elemento?: Elemento;
}

/** Estado da luta depois de cada ação — usado para reproduzir a luta devagar na tela. */
export interface QuadroCombate {
  texto: string;
  vidaJogador: number;
  escudoJogador: number;
  vidaInimigo: number;
  vidaAliado: number | null;
  sincronia: number;
  /** Troca de oponente (lutas em sequência: torneios, torres). */
  inimigo?: { nome: string; vidaMax: number };
}

export interface DadosCombate {
  nomeInimigo: string;
  vidaMaxJogador: number;
  vidaMaxInimigo: number;
  vidaInicialJogador: number;
  nomeAliado?: string;
  vidaMaxAliado?: number;
  tetoSincronia?: number;
  quadros: QuadroCombate[];
  vitoria: boolean;
  /** Progresso da reprodução (para retomar se a tela for redesenhada). */
  passo?: number;
  assistido?: boolean;
}

/** Junta várias lutas numa reprodução só; cada rodada começa com um quadro de título. */
export function encadearCombates(rodadas: { titulo: string; dados: DadosCombate }[]): DadosCombate | undefined {
  if (rodadas.length === 0) return undefined;
  const quadros: QuadroCombate[] = [];
  for (const { titulo, dados } of rodadas) {
    quadros.push({
      texto: `— ${titulo}: ${dados.nomeInimigo} —`,
      vidaJogador: dados.vidaInicialJogador,
      escudoJogador: 0,
      vidaInimigo: dados.vidaMaxInimigo,
      vidaAliado: dados.vidaMaxAliado ?? null,
      sincronia: 0,
      inimigo: { nome: dados.nomeInimigo, vidaMax: dados.vidaMaxInimigo },
    });
    quadros.push(...dados.quadros);
  }
  const primeira = rodadas[0].dados;
  const ultima = rodadas[rodadas.length - 1].dados;
  return { ...primeira, quadros, vitoria: ultima.vitoria, passo: 0, assistido: false };
}

export interface ResultadoCombate {
  vitoria: boolean;
  log: string[];
  vidaFinalJogador: number;
  talismaUsado: boolean;
  /** Meses de vida consumidos por artes proibidas. */
  mesesSacrificados: number;
  dados: DadosCombate;
}

export type NivelPerigo = 'Baixo' | 'Moderado' | 'Alto' | 'Mortal';

const PESOS_ARQUETIPO: Record<ArquetipoInimigo, Record<AttributeKey, number>> = {
  besta: { forca: 1.3, destreza: 0.9, inteligencia: 0.4, constituicao: 1.3, espirito: 0.7, sorte: 0.6 },
  guerreiro: { forca: 1.2, destreza: 1.0, inteligencia: 0.8, constituicao: 1.1, espirito: 0.9, sorte: 0.8 },
  agil: { forca: 0.9, destreza: 1.4, inteligencia: 0.9, constituicao: 0.8, espirito: 0.9, sorte: 1.1 },
  mistico: { forca: 0.8, destreza: 0.9, inteligencia: 1.3, constituicao: 0.9, espirito: 1.4, sorte: 0.9 },
};

/** `mediaAtributos` é o nível médio dos atributos do inimigo antes do peso do arquétipo. */
export function gerarInimigo(
  nome: string,
  arquetipo: ArquetipoInimigo,
  mediaAtributos: number,
  rank: number,
  estagio: number,
  letal = false,
): InimigoDef {
  const atributos = {} as Attributes;
  for (const chave of ATTRIBUTE_KEYS) {
    atributos[chave] = Math.max(1, Math.round(variacao(mediaAtributos * PESOS_ARQUETIPO[arquetipo][chave], 0.12)));
  }
  return { nome, atributos, rank, estagio, letal, elemento: elementoDeNome(nome) };
}

function montarCombatente(nome: string, vida: number, atributos: Attributes, stats: DerivedStats, bonusVelocidade = 0): Combatente {
  return {
    nome,
    vida: Math.min(vida, stats.vida),
    vidaMax: stats.vida,
    ataque: stats.ataque,
    tecnica: stats.tecnica,
    defesa: stats.defesa,
    esquiva: stats.esquiva,
    critico: stats.critico,
    precisao: atributos.inteligencia,
    velocidade: atributos.destreza + bonusVelocidade,
    chakra: stats.chakra,
    escudo: 0,
    furia: 1,
  };
}

export function combatenteDoJogador(character: Character): Combatente {
  return {
    ...montarCombatente(
      'Você',
      character.vidaAtual,
      getEffectiveAttributes(character),
      getCharacterStats(character),
      bonusVelocidade(character.tecnicas),
    ),
    elemento: character.flags.raizRevelada ? elementoDeCombate(character.raizEspiritual) : undefined,
  };
}

/** Força de uma técnica ativa, para escolher a melhor de cada categoria. */
function forcaTecnica(t: Tecnica): number {
  return (t.multiplicadorDano ?? 0) + (t.escudoPercentual ?? 0) / 10 + (t.curaPercentual ?? 0) / 10 + t.grau * 0.01;
}

/** Em combate, cada categoria usa a técnica MAIS FORTE que você domina (não a primeira aprendida). */
export function tecnicasAtivas(character: Character): Tecnica[] {
  const melhores = new Map<string, Tecnica>();
  for (const t of character.tecnicas.map(getTecnica)) {
    if (!t || !['ofensiva', 'defensiva', 'suporte', 'proibida'].includes(t.categoria)) continue;
    const atual = melhores.get(t.categoria);
    if (!atual || forcaTecnica(t) > forcaTecnica(atual)) melhores.set(t.categoria, t);
  }
  return [...melhores.values()];
}

export function combatenteDoInimigo(def: InimigoDef): Combatente {
  const stats = getDerivedStats(def.atributos, null, { rank: def.rank, estagio: def.estagio, progresso: 0, toxina: 0 });
  return { ...montarCombatente(def.nome, stats.vida, def.atributos, stats), elemento: def.elemento };
}

function poderEstimado(c: Combatente): number {
  const dano = Math.max(c.ataque, c.tecnica * 1.2);
  return dano * c.vida * (1 + c.esquiva / 100) * (1 + c.critico / 100) * (1 + c.velocidade / 40);
}

export function avaliarPerigo(character: Character, def: InimigoDef): NivelPerigo {
  const aliado = character.companheira ? poderEstimado(combatenteDaCompanheira(character.companheira)) * 0.6 : 0;
  const razao = poderEstimado(combatenteDoInimigo(def)) / (poderEstimado(combatenteDoJogador(character)) + aliado);
  if (razao < 0.6) return 'Baixo';
  if (razao < 1.1) return 'Moderado';
  if (razao < 1.8) return 'Alto';
  return 'Mortal';
}

interface Golpe {
  errou: boolean;
  critico: boolean;
  tecnica: boolean;
  dano: number;
}

function reducaoPorDefesa(defesa: number): number {
  return 50 / (50 + defesa * 2);
}

/** Cada golpe usa o que for mais forte contra o alvo: ataque físico (Força) ou técnica espiritual (Espírito/Inteligência). */
function golpe(atacante: Combatente, defensor: Combatente, multiplicadorTecnica = 1): Golpe {
  const esquivaEfetiva = Math.max(0, defensor.esquiva - atacante.precisao);
  if (Math.random() * 100 < esquivaEfetiva) {
    return { errou: true, critico: false, tecnica: false, dano: 0 };
  }

  const fisico = atacante.ataque * reducaoPorDefesa(defensor.defesa);
  const espiritual = atacante.tecnica * reducaoPorDefesa(defensor.defesa / 2);
  const tecnica = espiritual > fisico;
  const critico = Math.random() * 100 < atacante.critico;
  const base = multiplicadorTecnica > 1
    ? Math.max(atacante.ataque, atacante.tecnica) * reducaoPorDefesa(defensor.defesa / 2) * multiplicadorTecnica
    : Math.max(fisico, espiritual);
  const elemental = fatorElemental(atacante.elemento, defensor.elemento);
  const dano = Math.max(1, Math.round(variacao(base) * atacante.furia * elemental * (critico ? 1.8 : 1)));
  return { errou: false, critico, tecnica, dano };
}

function aplicarDano(defensor: Combatente, dano: number): number {
  const absorvido = Math.min(defensor.escudo, dano);
  defensor.escudo -= absorvido;
  defensor.vida = Math.max(0, defensor.vida - (dano - absorvido));
  return absorvido;
}

/** Luta automática por atributos, rodada a rodada, no estilo de Life in Adventure. */
export interface OpcoesCombate {
  usarTalisma?: boolean;
  usarTalismaEscudo?: boolean;
  tecnicas?: Tecnica[];
  /** Besta companheira lutando junto (domadores). */
  aliado?: Combatente | null;
  /** GDD 12: sincronia sobe a cada rodada coordenada; libera Ataque Combinado e Técnica de Fusão. */
  sincronia?: { ganhoPorRodada: number; teto: number };
}

export function simularCombate(jogador: Combatente, inimigo: Combatente, opcoes: OpcoesCombate = {}): ResultadoCombate {
  const usarTalisma = Boolean(opcoes.usarTalisma);
  const tecnicas = opcoes.tecnicas ?? [];
  const log: string[] = [];
  const j = { ...jogador };
  const i = { ...inimigo };
  const a = opcoes.aliado ? { ...opcoes.aliado } : null;
  const usadas = new Set<string>();
  let mesesSacrificados = 0;
  let sincronia = 0;
  let fundidos = false;
  const quadros: QuadroCombate[] = [];
  const vidaInicialJogador = j.vida;

  const registrar = (texto: string): void => {
    log.push(texto);
    quadros.push({
      texto,
      vidaJogador: Math.max(0, j.vida),
      escudoJogador: Math.max(0, j.escudo),
      vidaInimigo: Math.max(0, i.vida),
      vidaAliado: a ? Math.max(0, a.vida) : null,
      sincronia,
    });
  };

  if (a) registrar(`${a.nome}, sua besta companheira, salta ao seu lado!`);
  const confronto = descreverConfronto(j.elemento, i.elemento);
  if (confronto && (fatorElemental(j.elemento, i.elemento) !== 1 || fatorElemental(i.elemento, j.elemento) !== 1)) {
    registrar(`Ciclo dos Cinco Elementos — ${confronto}`);
  }
  if (opcoes.usarTalismaEscudo) {
    j.escudo += Math.round(j.vidaMax * 0.2);
    registrar(`Um Talismã de Escudo se desfaz em luz e te envolve: ${j.escudo} de proteção.`);
  }

  const ofensiva = tecnicas.find((t) => t.categoria === 'ofensiva');
  const defensiva = tecnicas.find((t) => t.categoria === 'defensiva');
  const suporte = tecnicas.find((t) => t.categoria === 'suporte');
  const proibida = tecnicas.find((t) => t.categoria === 'proibida');

  if (usarTalisma) {
    const dano = Math.round(Math.max(j.ataque, j.tecnica) * 1.5 + 10);
    i.vida -= dano;
    registrar(`Você ativa um Talismã de Combate: uma rajada de energia causa ${dano} de dano!`);
  }

  if (defensiva?.escudoPercentual && j.chakra >= defensiva.custoChakra) {
    j.chakra -= defensiva.custoChakra;
    j.escudo = Math.round((j.vidaMax * defensiva.escudoPercentual) / 100);
    registrar(`Você ergue o ${defensiva.nome}: um escudo de ${j.escudo} de energia te envolve.`);
  }

  let vezDoJogador = j.velocidade >= i.velocidade;
  registrar(vezDoJogador ? 'Você é mais rápido e ataca primeiro.' : `${i.nome} é mais rápido e ataca primeiro.`);

  for (let rodada = 0; rodada < 40 && j.vida > 0 && i.vida > 0; rodada++) {
    const atacante = vezDoJogador ? j : i;
    const inimigoMiraBesta = !vezDoJogador && a !== null && a.vida > 0 && Math.random() < 0.35;
    const defensor = vezDoJogador ? i : inimigoMiraBesta && a ? a : j;

    if (vezDoJogador) {
      const percentualVida = (j.vida / j.vidaMax) * 100;

      if (suporte?.curaPercentual && !usadas.has(suporte.id) && percentualVida < (suporte.gatilhoVida ?? 0) && j.chakra >= suporte.custoChakra) {
        usadas.add(suporte.id);
        j.chakra -= suporte.custoChakra;
        const cura = Math.round((j.vidaMax * suporte.curaPercentual) / 100);
        j.vida = Math.min(j.vidaMax, j.vida + cura);
        registrar(`Você usa ${suporte.nome} e recupera ${cura} de vida — Você: ${j.vida}/${j.vidaMax}.`);
        vezDoJogador = false;
        continue;
      }

      if (proibida?.multiplicadorDano && !usadas.has(proibida.id) && percentualVida < (proibida.gatilhoVida ?? 0)) {
        usadas.add(proibida.id);
        j.furia = proibida.multiplicadorDano;
        mesesSacrificados += proibida.custoVidaMeses ?? 0;
        registrar(`Encurralado, você libera a ${proibida.nome}! Seu sangue ferve — e anos da sua vida queimam junto.`);
      }
    }

    const chanceGolpeExtra = Math.max(0, atacante.velocidade - defensor.velocidade) * 0.05;
    const golpes = Math.random() < chanceGolpeExtra ? 2 : 1;

    for (let n = 0; n < golpes && defensor.vida > 0; n++) {
      const usarOfensiva = vezDoJogador && n === 0 && ofensiva?.multiplicadorDano && j.chakra >= ofensiva.custoChakra;
      if (usarOfensiva && ofensiva) j.chakra -= ofensiva.custoChakra;

      const resultado = golpe(atacante, defensor, usarOfensiva && ofensiva ? ofensiva.multiplicadorDano : 1);
      const prefixo = n > 0 ? `${atacante.nome} emenda outro golpe: ` : '';

      if (resultado.errou) {
        const acao = usarOfensiva && ofensiva ? `usa ${ofensiva.nome}` : 'ataca';
        registrar(`${prefixo}${atacante.nome} ${acao}, mas ${defensor.nome === 'Você' ? 'você esquiva' : `${defensor.nome} esquiva`}.`);
      } else {
        const absorvido = aplicarDano(defensor, resultado.dano);
        const forma = usarOfensiva && ofensiva ? ofensiva.nome : resultado.tecnica ? 'uma técnica espiritual' : 'um golpe';
        registrar(
          `${prefixo}${atacante.nome} acerta ${forma}: ${resultado.dano} de dano${resultado.critico ? ' (CRÍTICO!)' : ''}${
            absorvido > 0 ? ` (${absorvido} absorvidos pelo escudo)` : ''
          } — ${defensor.nome}: ${defensor.vida}/${defensor.vidaMax}.`,
        );
        if (defensor === a && a.vida <= 0) registrar(`${a.nome} cai ferida e sai da luta.`);
      }
    }

    if (vezDoJogador && a && a.vida > 0 && i.vida > 0 && opcoes.sincronia) {
      sincronia = Math.min(opcoes.sincronia.teto, sincronia + opcoes.sincronia.ganhoPorRodada);
      if (!fundidos && opcoes.sincronia.teto >= SINCRONIA_FUSAO && sincronia >= SINCRONIA_FUSAO) {
        fundidos = true;
        sincronia = 0;
        j.furia *= 1.3;
        j.defesa = Math.round(j.defesa + a.defesa * 0.5);
        j.escudo += Math.round(a.vidaMax * 0.3);
        registrar(`Sincronia máxima! TÉCNICA DE FUSÃO: você e ${a.nome} se fundem parcialmente — o poder dela corre nas suas veias.`);
      } else if (sincronia >= SINCRONIA_ATAQUE_COMBINADO && sincronia < SINCRONIA_FUSAO && (fundidos || opcoes.sincronia.teto < SINCRONIA_FUSAO || sincronia >= opcoes.sincronia.teto)) {
        sincronia -= SINCRONIA_ATAQUE_COMBINADO;
        const dano = Math.max(1, Math.round((Math.max(j.ataque, j.tecnica) + a.ataque) * 1.4 * reducaoPorDefesa(i.defesa / 2) * j.furia));
        aplicarDano(i, dano);
        registrar(`ATAQUE COMBINADO! Você e ${a.nome} golpeiam juntos: ${dano} de dano — ${i.nome}: ${i.vida}/${i.vidaMax}.`);
      }
    }

    if (vezDoJogador && a && a.vida > 0 && i.vida > 0) {
      const ataqueDaBesta = golpe(a, i);
      if (ataqueDaBesta.errou) {
        registrar(`${a.nome} avança, mas ${i.nome} esquiva.`);
      } else {
        aplicarDano(i, ataqueDaBesta.dano);
        registrar(`${a.nome} crava as garras: ${ataqueDaBesta.dano} de dano${ataqueDaBesta.critico ? ' (CRÍTICO!)' : ''} — ${i.nome}: ${i.vida}/${i.vidaMax}.`);
      }
    }
    vezDoJogador = !vezDoJogador;
  }

  const vitoria = i.vida <= 0 || (j.vida > 0 && j.vida / j.vidaMax >= i.vida / i.vidaMax);
  if (i.vida > 0 && j.vida > 0) {
    registrar(vitoria ? `${i.nome} recua, exausto.` : 'Você não aguenta mais e recua.');
  }

  registrar(vitoria ? `Vitória contra ${i.nome}!` : `Derrota contra ${i.nome}.`);

  const dados: DadosCombate = {
    nomeInimigo: i.nome,
    vidaMaxJogador: j.vidaMax,
    vidaMaxInimigo: i.vidaMax,
    vidaInicialJogador,
    nomeAliado: a?.nome,
    vidaMaxAliado: a?.vidaMax,
    tetoSincronia: a ? opcoes.sincronia?.teto : undefined,
    quadros,
    vitoria,
  };

  return { vitoria, log, vidaFinalJogador: j.vida, talismaUsado: usarTalisma, mesesSacrificados, dados };
}
