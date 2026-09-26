import { ATTRIBUTE_INFO, AttributeKey, Attributes } from './attributes';
import { Character, FlagValor, alterarVidaPercentual, getEffectiveAttributes, limitarVida } from './character';
import { alignmentLabel, shiftAlignment } from './alignment';
import { ItemQuantidade, addItem, addPedrasEspirituais, removerItem } from './inventory';
import { aplicarProgresso, avancarRank, progressoEfetivo } from './cultivation';
import { grauRaizInfo } from './spiritualRoot';
import { getEquipment } from './equipment';
import { Afiliacao } from './origin';
import { PROFISSAO_INFO, ProfissaoId, ganharXpProfissao, tituloProfissao } from './professions';
import { getConsumivel, nomeItem } from './items';
import { ajustarDesempenho, demitir } from './occupations';
import { REGIOES, RegiaoId } from './world';
import { ESTILOS, EstiloId, ganharXpEstilo } from './martialStyles';
import { chaveEstudo, dificuldadeEstudo, getTecnica, nomeGrau, tecnicaDoManual } from './techniques';
import { attributeCheck } from './dice';
import { aplicarProgressoCompanheira, criarCompanheira } from './companion';
import { getHeranca } from './inheritance';
import { conhecerAlguem, descreverRelacao } from './relationships';
import { CORPOS_ESPECIAIS } from './origin';
import { escolher } from './rng';
import { destruirNucleo } from './coreDestruction';
import { lerDestino } from './divination';
import { reducaoEstudoFaccao } from './faction';

/** Tudo que uma escolha de história (ou um item) pode alterar. Precisa ser serializável em JSON. */
export interface Efeitos {
  pedras?: number;
  alinhamento?: number;
  /** Alteração permanente nos atributos base. */
  atributos?: Partial<Attributes>;
  /** Pontos de progresso de cultivo (100 = um estágio). */
  progresso?: number;
  toxina?: number;
  reputacao?: number;
  itens?: ItemQuantidade[];
  removerItens?: ItemQuantidade[];
  /** Ids de EQUIPMENT_CATALOG adicionados à bolsa. */
  equipamentos?: string[];
  /** Delta no grau da raiz espiritual (despertar tardio). */
  grauRaiz?: number;
  afiliacao?: Afiliacao;
  flags?: Record<string, FlagValor>;
  avancarRank?: boolean;
  curaPercentual?: number;
  danoPercentual?: number;
  aprenderProfissao?: ProfissaoId;
  xpProfissao?: Partial<Record<ProfissaoId, number>>;
  /** Soma ao desempenho da ocupação atual (promoção em 100, demissão em 0). */
  desempenho?: number;
  /** true = perde o emprego atual. */
  perderOcupacao?: boolean;
  mudarLocal?: { regiao: RegiaoId; cidade: string };
  /** Aprende um estilo marcial no nível Iniciante (e recebe a arma de treino). */
  aprenderEstilo?: EstiloId;
  xpEstilo?: Partial<Record<EstiloId, number>>;
  aprenderTecnica?: string;
  /** Meses somados à idade (artes proibidas consomem vida). */
  envelhecerMeses?: number;
  /** Pontos de Contribuição da seita (só para discípulos). */
  contribuicao?: number;
  /** Contrato de alma com uma nova besta (substitui a atual). */
  novaCompanheira?: { especie: string; rank: number; estagio: number; atributoMedio: number };
  /** Treino da besta: pontos de progresso e vínculo. */
  treinoCompanheira?: { progresso: number; vinculo: number };
  /** Desperta uma herança (inheritance.ts). */
  heranca?: string;
  /** Conhece uma pessoa nova (Relações). */
  conhecerAlguem?: boolean;
  /** Rolagem de Herança Lendária: desperta uma Constituição Especial. */
  despertarCorpo?: boolean;
  /** Duelo Demoníaco: destrói o núcleo do derrotado (GDD 13). */
  destruirNucleo?: { nome: string; afiliacao: string; rank?: number };
  /** Vislumbre do Destino (GDD 14.6): 'proprio' = ler sozinho; 'pago' = consultar um adivinho. */
  lerDestino?: 'proprio' | 'pago';
  /** Vende/perde a moradia atual (market.ts). */
  perderMoradia?: boolean;
}

/**
 * GDD 13 — Fama por Profissão: ofícios raros rendem mais fama por conquista que o combate,
 * porque "todo mundo precisa de pílulas, mas nem todo mundo quer duelar".
 */
const FAMA_POR_NIVEL_PROFISSAO: Record<ProfissaoId, number> = { alquimia: 8, inscricao: 7, domador: 4, adivinhacao: 6, refinador: 7 };

function sinal(valor: number): string {
  return valor > 0 ? `+${valor}` : `${valor}`;
}

export function aplicarEfeitos(character: Character, efeitos: Efeitos): string[] {
  const mensagens: string[] = [];

  if (efeitos.pedras) {
    addPedrasEspirituais(character.inventario, efeitos.pedras);
    mensagens.push(`${sinal(efeitos.pedras)} pedras espirituais.`);
  }

  if (efeitos.alinhamento) {
    character.alinhamento = shiftAlignment(character.alinhamento, efeitos.alinhamento);
    mensagens.push(`Alinhamento ${sinal(efeitos.alinhamento)} (${alignmentLabel(character.alinhamento)}).`);
  }

  if (efeitos.atributos) {
    for (const chave of Object.keys(efeitos.atributos) as AttributeKey[]) {
      const delta = efeitos.atributos[chave];
      if (!delta) continue;
      character.atributosBase[chave] = Math.max(1, character.atributosBase[chave] + delta);
      mensagens.push(`${ATTRIBUTE_INFO[chave].nome} ${sinal(delta)}.`);
    }
  }

  if (efeitos.reputacao) {
    character.reputacao += efeitos.reputacao;
    mensagens.push(`Reputação ${sinal(efeitos.reputacao)}.`);
  }

  if (efeitos.toxina) {
    character.cultivo.toxina = Math.max(0, Math.min(100, character.cultivo.toxina + efeitos.toxina));
    mensagens.push(`Toxina de pílula ${sinal(efeitos.toxina)} (agora ${Math.round(character.cultivo.toxina)}).`);
  }

  if (efeitos.progresso) {
    const efetivo = progressoEfetivo(character.cultivo, efeitos.progresso);
    mensagens.push(`Progresso de cultivo ${sinal(Math.round(efetivo * 10) / 10)}%.`);
    mensagens.push(...aplicarProgresso(character.cultivo, efeitos.progresso));
  }

  if (efeitos.avancarRank) {
    const reino = avancarRank(character.cultivo);
    mensagens.push(`Você rompeu para o ${reino.nome}! Expectativa de vida: ~${reino.expectativaAnos.toLocaleString('pt-BR')} anos.`);
    alterarVidaPercentual(character, 100);
  }

  if (efeitos.grauRaiz) {
    const raiz = character.raizEspiritual;
    raiz.grau = Math.max(1, Math.min(9, raiz.grau + efeitos.grauRaiz));
    mensagens.push(`Sua raiz espiritual agora é Grau ${raiz.grau} — ${grauRaizInfo(raiz.grau).nome}!`);
  }

  for (const item of efeitos.itens ?? []) {
    addItem(character.inventario, item.id, item.quantidade);
    mensagens.push(`Obteve ${nomeItem(item.id)} x${item.quantidade}.`);
  }

  for (const item of efeitos.removerItens ?? []) {
    if (removerItem(character.inventario, item.id, item.quantidade)) {
      mensagens.push(`Usou ${nomeItem(item.id)} x${item.quantidade}.`);
    }
  }

  for (const id of efeitos.equipamentos ?? []) {
    const equipamento = getEquipment(id);
    if (equipamento) {
      character.inventario.equipamentos.push(equipamento);
      mensagens.push(`Obteve ${equipamento.nome} (na bolsa).`);
    }
  }

  if (efeitos.afiliacao) {
    character.afiliacao = efeitos.afiliacao;
    mensagens.push(`Afiliação: ${efeitos.afiliacao.nome} — ${efeitos.afiliacao.posto}.`);
  }

  if (efeitos.aprenderProfissao) {
    const estado = character.profissoes[efeitos.aprenderProfissao];
    if (estado.nivel === 0) {
      estado.nivel = 1;
      estado.xp = 0;
      mensagens.push(`Nova profissão: ${tituloProfissao(efeitos.aprenderProfissao, estado)}.`);
    }
  }

  for (const id of Object.keys(efeitos.xpProfissao ?? {}) as ProfissaoId[]) {
    const xp = efeitos.xpProfissao?.[id] ?? 0;
    if (character.profissoes[id].nivel > 0 && xp > 0) {
      const nivelAntes = character.profissoes[id].nivel;
      mensagens.push(`Experiência em ${PROFISSAO_INFO[id].nome} +${xp}.`);
      mensagens.push(...ganharXpProfissao(id, character.profissoes[id], xp, character.cultivo.rank));
      const nivelDepois = character.profissoes[id].nivel;
      if (nivelDepois > nivelAntes) {
        const fama = FAMA_POR_NIVEL_PROFISSAO[id] * nivelDepois;
        character.reputacao += fama;
        mensagens.push(`A notícia corre: seu avanço em ${PROFISSAO_INFO[id].nome} rende +${fama} de reputação.`);
      }
    }
  }

  if (efeitos.curaPercentual) {
    alterarVidaPercentual(character, efeitos.curaPercentual);
    mensagens.push(`Vida recuperada (${character.vidaAtual}).`);
  }

  if (efeitos.danoPercentual) {
    alterarVidaPercentual(character, -efeitos.danoPercentual, 1);
    mensagens.push(`Você se feriu (vida ${character.vidaAtual}).`);
  }

  if (efeitos.aprenderEstilo) {
    const estado = character.estilos[efeitos.aprenderEstilo];
    const info = ESTILOS[efeitos.aprenderEstilo];
    if (estado.nivel === 0) {
      estado.nivel = 1;
      estado.xp = 0;
      mensagens.push(`Novo estilo marcial: ${info.nome} (Iniciante).`);
      const arma = getEquipment(info.armaInicial);
      if (arma) {
        character.inventario.equipamentos.push(arma);
        mensagens.push(`Recebeu ${arma.nome} (na bolsa).`);
      }
    }
  }

  const compreensao = getEffectiveAttributes(character).inteligencia;
  for (const id of Object.keys(efeitos.xpEstilo ?? {}) as EstiloId[]) {
    const xp = efeitos.xpEstilo?.[id] ?? 0;
    if (character.estilos[id].nivel > 0 && xp > 0) {
      mensagens.push(`Treino de ${ESTILOS[id].nome} +${xp} xp.`);
      mensagens.push(...ganharXpEstilo(id, character.estilos[id], xp, compreensao, character.cultivo.rank));
    }
  }

  if (efeitos.aprenderTecnica && !character.tecnicas.includes(efeitos.aprenderTecnica)) {
    const tecnica = getTecnica(efeitos.aprenderTecnica);
    if (tecnica) {
      character.tecnicas.push(tecnica.id);
      mensagens.push(`Técnica aprendida: ${tecnica.nome} (${nomeGrau(tecnica)}).`);
    }
  }

  if (efeitos.novaCompanheira) {
    const { especie, rank, estagio, atributoMedio } = efeitos.novaCompanheira;
    character.companheira = criarCompanheira(especie, rank, estagio, atributoMedio);
    mensagens.push(`Contrato de alma: ${character.companheira.nome} (${especie}) agora luta ao seu lado.`);
  }

  if (efeitos.treinoCompanheira && character.companheira) {
    const besta = character.companheira;
    besta.vinculo = Math.min(100, besta.vinculo + efeitos.treinoCompanheira.vinculo);
    mensagens.push(`${besta.nome}: vínculo ${Math.round(besta.vinculo)}.`);
    if (besta.modoEvolucao === 'independente') {
      const pontos = efeitos.treinoCompanheira.progresso * (1 + character.profissoes.domador.nivel * 0.25);
      mensagens.push(...aplicarProgressoCompanheira(besta, pontos));
    } else {
      mensagens.push(`(Evolução conjunta: o reino de ${besta.nome} acompanha o seu — o treino fortalece o vínculo.)`);
    }
  }

  if (efeitos.heranca) {
    const heranca = getHeranca(efeitos.heranca);
    if (heranca && !character.flags[`heranca:${heranca.id}`]) {
      character.flags[`heranca:${heranca.id}`] = true;
      mensagens.push(`Você recebeu a ${heranca.nome}!`, ...aplicarEfeitos(character, heranca.recompensa));
    }
  }

  if (efeitos.despertarCorpo && !character.origem.corpoEspecial) {
    const corpo = escolher(CORPOS_ESPECIAIS);
    character.origem = { ...character.origem, corpoEspecial: corpo };
    mensagens.push(`Constituição Especial desperta: ${corpo.nome} — ${corpo.descricao}`);
    mensagens.push(...aplicarEfeitos(character, { atributos: corpo.bonusAtributos }));
  }

  if (efeitos.destruirNucleo) {
    const { nome, afiliacao, rank } = efeitos.destruirNucleo;
    mensagens.push(...destruirNucleo(character, nome, afiliacao, rank));
  }

  if (efeitos.lerDestino) {
    mensagens.push(...lerDestino(character, efeitos.lerDestino === 'pago'));
  }

  if (efeitos.conhecerAlguem) {
    const pessoa = conhecerAlguem(character);
    mensagens.push(`Você conheceu ${pessoa.nome} (${descreverRelacao(pessoa)}).`);
  }

  if (efeitos.contribuicao) {
    character.contribuicao = Math.max(0, character.contribuicao + efeitos.contribuicao);
    mensagens.push(`Contribuição à seita ${sinal(efeitos.contribuicao)} (total ${character.contribuicao}).`);
  }

  if (efeitos.envelhecerMeses) {
    const antes = character.idadeMeses;
    character.idadeMeses =
      efeitos.envelhecerMeses > 0
        ? character.idadeMeses + efeitos.envelhecerMeses
        : Math.max(Math.min(antes, 16 * 12), antes + efeitos.envelhecerMeses);
    const anos = Math.round(Math.abs(character.idadeMeses - antes) / 12);
    if (efeitos.envelhecerMeses > 0) mensagens.push(`Você envelheceu ${anos} ano(s) de uma vez.`);
    else if (anos > 0) mensagens.push(`Seu corpo rejuvenesce ${anos} ano(s).`);
    else mensagens.push('Seu corpo já está no auge da juventude; a pílula só revigora.');
  }

  if (efeitos.desempenho) {
    mensagens.push(`Desempenho no trabalho ${sinal(efeitos.desempenho)}.`);
    mensagens.push(...ajustarDesempenho(character, efeitos.desempenho));
  }

  if (efeitos.perderOcupacao) {
    mensagens.push(...demitir(character, 'Você perdeu o emprego.'));
  }

  if (efeitos.mudarLocal) {
    character.local = { ...efeitos.mudarLocal };
    mensagens.push(`Você chegou a ${efeitos.mudarLocal.cidade}, ${REGIOES[efeitos.mudarLocal.regiao].preposicao} ${REGIOES[efeitos.mudarLocal.regiao].nome}.`);
  }

  if (efeitos.flags) {
    Object.assign(character.flags, efeitos.flags);
  }

  if (efeitos.perderMoradia && character.moradia) {
    character.moradia = null;
    mensagens.push('Você não tem mais moradia própria.');
  }

  limitarVida(character);
  return mensagens;
}

export function podeUsarConsumivel(id: string): boolean {
  return Boolean(getConsumivel(id)?.efeitosAoUsar) || Boolean(tecnicaDoManual(id));
}

/** Estudar um manual: teste de Compreensão (Inteligência). Se falhar, o manual continua na bolsa. */
function estudarManual(character: Character, id: string): string[] {
  const tecnica = tecnicaDoManual(id);
  if (!tecnica) return [];
  if (character.tecnicas.includes(tecnica.id)) {
    const valor = 5 * tecnica.grau;
    removerItem(character.inventario, id, 1);
    addPedrasEspirituais(character.inventario, valor);
    return [`Você já domina ${tecnica.nome}. Vendeu a cópia extra do manual a um sebo por ${valor} pedras.`];
  }

  const compreensao = getEffectiveAttributes(character).inteligencia;
  const tentativas = Number(character.flags[chaveEstudo(tecnica.id)] ?? 0);
  const dificuldade = Math.max(5, dificuldadeEstudo(tecnica, tentativas) - reducaoEstudoFaccao(character));
  const teste = attributeCheck(compreensao, dificuldade);
  const resumo = `Estudando ${tecnica.nome} — Compreensão: rolou ${teste.roll} + ${compreensao} = ${teste.total} (dificuldade ${dificuldade}).`;

  if (!teste.success) {
    character.flags[chaveEstudo(tecnica.id)] = tentativas + 1;
    return [
      resumo,
      `Ainda não foi desta vez — mas você entendeu um pouco mais. A próxima tentativa fica mais fácil (dificuldade ${dificuldadeEstudo(tecnica, tentativas + 1)}).`,
    ];
  }
  removerItem(character.inventario, id, 1);
  delete character.flags[chaveEstudo(tecnica.id)];
  return [resumo, ...aplicarEfeitos(character, { aprenderTecnica: tecnica.id })];
}

export function usarConsumivel(character: Character, id: string): string[] {
  if (tecnicaDoManual(id)) return estudarManual(character, id);
  const efeitos = getConsumivel(id)?.efeitosAoUsar;
  if (!efeitos || !removerItem(character.inventario, id, 1)) return [];
  return [`Você usou ${nomeItem(id)}.`, ...aplicarEfeitos(character, efeitos)];
}
