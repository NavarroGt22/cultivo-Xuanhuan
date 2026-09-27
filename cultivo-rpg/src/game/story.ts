import { ATTRIBUTE_INFO, AttributeKey } from './attributes';
import { Character, alterarVidaPercentual, getCharacterStats, getEffectiveAttributes } from './character';
import { attributeCheck } from './dice';
import { Efeitos, aplicarEfeitos } from './effects';
import { quantidadeItem, removerItem, addPedrasEspirituais } from './inventory';
import { aplicarProgresso, ganhoCultivo } from './cultivation';
import { DadosCombate, InimigoDef, avaliarPerigo, combatenteDoInimigo, combatenteDoJogador, simularCombate, tecnicasAtivas } from './combat';
import { ferimentosDeCombate, processarSequelas } from './scars';
import { descreverConfronto, elementoDeCombate } from './elements';
import { estiloPrincipal, ganharXpEstilo } from './martialStyles';
import { aplicarProgressoCompanheira, combatenteDaCompanheira, configSincronia, crescimentoPassivo } from './companion';
import { ganharXpProfissao } from './professions';
import { bonusCultivoRelacoes, passarTempoRelacoes } from './relationships';
import { nomeItem } from './items';
import { gerarPrologo, gerarProximoEvento } from './storyEvents';
import { processarOcupacao } from './occupations';
import { fatorCultivoPassivo, processarDeveres } from './sect';
import { MundoState, avancarMundo, createMundo } from './worldState';
import { amadurecerCampos } from './fields';
import { atualizarQuadro } from './bounties';
import { processarFaccao } from './faction';
import { processarPatrimonio } from './market';
import { crescerNoivado } from './betrothal';
import { atualizarTracosVida, getTracoVida, registrarFeito } from './lifeTraits';
import { comecarGuerraDeclarada, processarGuerra } from './clanWar';
import { processarMercadores } from './merchantGroups';
import { RegistroJornada, registrarJornada } from './journal';

export interface Teste {
  atributo: AttributeKey;
  dificuldade: number;
}

export interface Requisito {
  pedras?: number;
  item?: string;
  contribuicao?: number;
}

export interface Desfecho {
  texto: string;
  efeitos?: Efeitos;
  final?: boolean;
}

export interface StoryChoice {
  texto: string;
  requisito?: Requisito;
  teste?: Teste;
  combate?: InimigoDef;
  /** Usado sem teste/combate, ou em caso de sucesso/vitória. */
  resultado: Desfecho;
  falha?: Desfecho;
  /** Um 1 natural no d20. Se ausente, usa `falha`. */
  falhaCritica?: Desfecho;
}

export interface StoryNode {
  id: string;
  /** Id do modelo de evento que gerou o nó. */
  evento: string;
  titulo: string;
  texto: string;
  escolhas: StoryChoice[];
  /** Tempo que passa depois deste evento. */
  meses: number;
  /** Quem fala neste evento: nome em destaque + retrato opcional (`assets/retratos/<retrato>`). */
  personagem?: { nome: string; retrato?: string };
}

export interface DesfechoExibido {
  texto: string;
  resumo?: string;
  mensagens: string[];
  log: string[];
  final: boolean;
  /** Definido quando a escolha foi uma luta. */
  vitoria?: boolean;
  /** Quadros da luta para a reprodução na tela. */
  combate?: DadosCombate;
  /** Sucesso no teste ou vitória na luta (ausente se não havia teste nem luta). */
  sucesso?: boolean;
}

export interface StoryState {
  ancestrais?: import('./journal').CronicaAncestral[];
  /** Campos opcionais para compatibilidade com saves anteriores. */
  diario?: RegistroJornada[];
  marcosDiario?: Record<string, string>;
  turno: number;
  noAtual: StoryNode;
  desfecho: DesfechoExibido | null;
  /** Avisos do tempo que passou (estipêndio, avanços de estágio...). */
  avisos: string[];
  /** Eventos recentes, para evitar repetição. */
  recentes: string[];
  /** Energia da estação para atividades, missões, desafios e refino. */
  energia: number;
  /** Quantas vezes cada atividade foi feita nesta estação (repetir demais tem consequências). */
  contagemAtividades: Record<string, number>;
  mundo: MundoState;
}

export const ENERGIA_POR_ESTACAO = 5;

export function iniciarHistoria(character: Character): StoryState {
  return {
    turno: 0,
    noAtual: gerarPrologo(character, 0),
    desfecho: null,
    avisos: [],
    recentes: [],
    energia: ENERGIA_POR_ESTACAO,
    contagemAtividades: {},
    mundo: createMundo(),
  };
}

/** Retorna false (e não gasta nada) se não houver energia suficiente. */
export function gastarEnergia(state: StoryState, quantidade: number): boolean {
  if (state.energia < quantidade) return false;
  state.energia -= quantidade;
  return true;
}

export function chanceDeSucesso(valorAtributo: number, dificuldade: number): number {
  let sucessos = 0;
  for (let rolagem = 1; rolagem <= 20; rolagem++) {
    if (rolagem === 20 || (rolagem !== 1 && rolagem + valorAtributo >= dificuldade)) sucessos++;
  }
  return sucessos / 20;
}

export interface EscolhaInfo {
  detalhe: string | null;
  bloqueio: string | null;
}

export function descreverEscolha(character: Character, escolha: StoryChoice): EscolhaInfo {
  let bloqueio: string | null = null;
  if (escolha.requisito?.pedras && character.inventario.pedrasEspirituais < escolha.requisito.pedras) {
    bloqueio = `Requer ${escolha.requisito.pedras} pedras espirituais`;
  } else if (escolha.requisito?.item && quantidadeItem(character.inventario, escolha.requisito.item) === 0) {
    bloqueio = `Requer ${nomeItem(escolha.requisito.item)}`;
  } else if (escolha.requisito?.contribuicao && character.contribuicao < escolha.requisito.contribuicao) {
    bloqueio = `Requer ${escolha.requisito.contribuicao} de contribuição`;
  }

  let detalhe: string | null = null;
  if (escolha.teste) {
    const valor = getEffectiveAttributes(character)[escolha.teste.atributo];
    const chance = Math.round(chanceDeSucesso(valor, escolha.teste.dificuldade) * 100);
    detalhe = `${ATTRIBUTE_INFO[escolha.teste.atributo].nome} ${valor} vs. ${escolha.teste.dificuldade} · ${chance}%`;
  } else if (escolha.combate) {
    const perigo = avaliarPerigo(character, escolha.combate);
    const meu = character.flags.raizRevelada ? elementoDeCombate(character.raizEspiritual) : undefined;
    const elemento = descreverConfronto(meu, escolha.combate.elemento);
    detalhe = `Luta · Perigo: ${perigo}${escolha.combate.letal ? ' · até a morte' : ''}${elemento ? ` · ${elemento}` : ''}`;
  }

  return { detalhe, bloqueio };
}

const DESFECHO_MORTE_EM_COMBATE: Desfecho = {
  texto: 'O último golpe atravessa sua defesa. O mundo escurece, e sua jornada termina aqui.',
  final: true,
};

/** Rola testes/combates, aplica os efeitos e devolve o que exibir. Usado por eventos e atividades. */
export function executarEscolha(character: Character, escolha: StoryChoice): DesfechoExibido {
  let desfecho = escolha.resultado;
  let resumo: string | undefined;
  let log: string[] = [];
  let vitoria: boolean | undefined;
  let combate: DadosCombate | undefined;
  let sucessoTeste: boolean | undefined;
  const sequelas: string[] = [];

  if (escolha.teste) {
    const valor = getEffectiveAttributes(character)[escolha.teste.atributo];
    const teste = attributeCheck(valor, escolha.teste.dificuldade);
    const nome = ATTRIBUTE_INFO[escolha.teste.atributo].nome;
    resumo = `Teste de ${nome}: rolou ${teste.roll} + ${valor} = ${teste.total} (dificuldade ${escolha.teste.dificuldade}) — ${
      teste.criticalSuccess ? 'Sucesso crítico!' : teste.success ? 'Sucesso!' : teste.criticalFailure ? 'Falha crítica!' : 'Falha.'
    }`;
    sucessoTeste = teste.success;
    if (!teste.success) {
      desfecho = (teste.criticalFailure ? escolha.falhaCritica : undefined) ?? escolha.falha ?? escolha.resultado;
    }
  } else if (escolha.combate) {
    const usarTalisma = quantidadeItem(character.inventario, 'talisma-combate') > 0;
    const usarTalismaEscudo = quantidadeItem(character.inventario, 'talisma-escudo') > 0;
    const companheira = character.companheira;
    const resultado = simularCombate(combatenteDoJogador(character), combatenteDoInimigo(escolha.combate), {
      usarTalisma,
      usarTalismaEscudo,
      tecnicas: tecnicasAtivas(character),
      aliado: companheira ? combatenteDaCompanheira(companheira) : null,
      sincronia: companheira ? configSincronia(companheira) : undefined,
    });
    if (resultado.talismaUsado) removerItem(character.inventario, 'talisma-combate', 1);
    if (usarTalismaEscudo) removerItem(character.inventario, 'talisma-escudo', 1);
    if (resultado.mesesSacrificados > 0) character.idadeMeses += resultado.mesesSacrificados;

    if (companheira) {
      companheira.vinculo = Math.min(100, companheira.vinculo + 1);
      if (companheira.modoEvolucao === 'independente') {
        aplicarProgressoCompanheira(companheira, 4 * (1 + character.profissoes.domador.nivel * 0.25));
      }
      ganharXpProfissao('domador', character.profissoes.domador, 8, character.cultivo.rank);
    }

    const principal = estiloPrincipal(character.estilos);
    if (principal) {
      ganharXpEstilo(principal, character.estilos[principal], 5, getEffectiveAttributes(character).inteligencia, character.cultivo.rank);
    }

    registrarFeito(character, resultado.vitoria ? 'vitorias' : 'derrotas');
    if (resultado.vitoria && escolha.combate.besta) registrarFeito(character, 'bestasAbatidas');

    log = resultado.log;
    vitoria = resultado.vitoria;
    combate = resultado.dados;
    resumo = resultado.vitoria ? `Vitória contra ${escolha.combate.nome}!` : `Derrota contra ${escolha.combate.nome}.`;

    if (resultado.vitoria) {
      character.vidaAtual = Math.max(1, resultado.vidaFinalJogador);
    } else if (escolha.combate.letal) {
      character.vidaAtual = 0;
      desfecho = escolha.falhaCritica ?? DESFECHO_MORTE_EM_COMBATE;
    } else {
      character.vidaAtual = Math.max(1, resultado.vidaFinalJogador);
      desfecho = escolha.falha ?? escolha.resultado;
    }

    if (character.vidaAtual > 0) {
      sequelas.push(...ferimentosDeCombate(character, resultado.vidaFinalJogador, resultado.dados.vidaMaxJogador, escolha.combate.nome));
    }
  }

  const mensagens = [...(desfecho.efeitos ? aplicarEfeitos(character, desfecho.efeitos) : []), ...sequelas];
  const final = Boolean(desfecho.final) || character.vidaAtual <= 0;

  return { texto: desfecho.texto, resumo, mensagens, log, final, vitoria, combate, sucesso: vitoria ?? sucessoTeste };
}

/** Lutas da história que não terminam em morte: duelos, provas, tribulações. */
const EVENTOS_SEM_MORTE = new Set([
  'tribulacao',
  'rival',
  'tumulo-ancestral',
  'noivado-rompimento',
  'noivado-duelo',
  'torneio',
  'escola-estilo',
  'missao-seita',
]);

export function resolverEscolha(character: Character, state: StoryState, indice: number): void {
  const escolha = state.noAtual.escolhas[indice];
  if (!escolha || state.desfecho || descreverEscolha(character, escolha).bloqueio) return;
  state.desfecho = executarEscolha(character, escolha);
  if (state.desfecho.vitoria && escolha.combate && !escolha.combate.besta && !EVENTOS_SEM_MORTE.has(state.noAtual.evento)) {
    registrarFeito(character, 'mortes');
  }
  registrarJornada(character, state, 'historia', state.noAtual.titulo,
    `${escolha.texto}\n${state.desfecho.texto}`);
}

function passarTempo(character: Character, meses: number): string[] {
  const avisos: string[] = [];
  const idadeAntes = character.idadeMeses;
  character.idadeMeses += meses;

  const estacoes = Math.max(1, Math.round(meses / 3));
  const adolescente = idadeAntes >= 12 * 12;

  if (adolescente && character.afiliacao.estipendio > 0) {
    const ganho = character.afiliacao.estipendio * estacoes;
    addPedrasEspirituais(character.inventario, ganho);
    avisos.push(`${character.afiliacao.nome} entregou seu estipêndio: +${ganho} pedras espirituais.`);
  }

  if (adolescente) {
    avisos.push(...processarOcupacao(character, estacoes));
    avisos.push(...processarDeveres(character, estacoes));
    avisos.push(...processarFaccao(character, estacoes));
    avisos.push(...processarPatrimonio(character, estacoes));
  }

  const investimentos = Number(character.flags.investimentos ?? 0);
  if (investimentos > 0) {
    const renda = investimentos * 2 * estacoes;
    addPedrasEspirituais(character.inventario, renda);
    avisos.push(`Seus campos de ervas renderam +${renda} pedras espirituais.`);
  }

  if (character.flags.raizRevelada) {
    const fator = fatorCultivoPassivo(character) + bonusCultivoRelacoes(character);
    const passivo = ganhoCultivo(getCharacterStats(character).velocidadeCultivo, meses, fator);
    avisos.push(...aplicarProgresso(character.cultivo, passivo));
  }

  if (character.noivado && character.noivado.status !== 'casados') crescerNoivado(character.noivado, meses);
  avisos.push(...atualizarTracosVida(character, meses));

  if (character.companheira) {
    avisos.push(
      ...crescimentoPassivo(character.companheira, character.profissoes.domador.nivel, meses, character.cultivo.rank, character.cultivo.estagio),
    );
  }
  avisos.push(...passarTempoRelacoes(character, meses));
  avisos.push(...processarSequelas(character, estacoes));

  const famaFamiliar = Number(character.flags.famaFamiliar ?? 0);
  if (famaFamiliar > 0) {
    character.flags.famaFamiliar = Math.floor(famaFamiliar * Math.pow(0.98, estacoes) * 100) / 100;
  }

  const toxinaAntes = character.cultivo.toxina;
  character.cultivo.toxina = Math.max(0, toxinaAntes - (1 + character.cultivo.rank) * estacoes);

  alterarVidaPercentual(character, 30 * estacoes);
  return avisos;
}

export function continuarHistoria(character: Character, state: StoryState): void {
  if (!state.desfecho || state.desfecho.final) return;

  const meses = state.noAtual.meses;
  const tracosAntes = character.tracosVida?.length ?? 0;
  const avisos = passarTempo(character, meses);
  for (const id of (character.tracosVida ?? []).slice(tracosAntes)) {
    const traco = getTracoVida(id);
    if (traco) registrarJornada(character, state, 'marco', `Novo traço: ${traco.nome}`, `${traco.descricao} Ajuda: ${traco.vantagem}. Atrapalha: ${traco.desvantagem}.`);
  }
  avisos.push(...amadurecerCampos(character, meses));
  avancarMundo(state.mundo, character, meses);
  avisos.push(...processarGuerra(state.mundo, character, Math.max(1, Math.round(meses / 3))));
  avisos.push(...processarMercadores(state.mundo, character, Math.max(1, Math.round(meses / 3))));
  avisos.push(...comecarGuerraDeclarada(state.mundo, character));
  state.recentes = [state.noAtual.evento, ...state.recentes].slice(0, 5);
  state.turno += 1;
  state.noAtual = gerarProximoEvento(character, state.turno, state.recentes, state.mundo);
  state.desfecho = null;
  state.avisos = avisos;
  state.energia = ENERGIA_POR_ESTACAO;
  state.contagemAtividades = {};
  if (character.flags.raizRevelada) atualizarQuadro(state.mundo, character, state.turno);
}
