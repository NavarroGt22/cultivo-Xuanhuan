import { ATTRIBUTE_KEYS } from './attributes';
import { Character, alterarVidaPercentual, getEffectiveAttributes } from './character';
import { encadearCombates, DadosCombate, InimigoDef, gerarInimigo } from './combat';
import { aplicarEfeitos } from './effects';
import { Npc, estagiosDoRank, inimigoDoNpc, poderNpc } from './npcs';
import { DesfechoExibido, StoryState, executarEscolha } from './story';
import { REGIOES } from './world';
import { npcsDaRegiao } from './worldState';

/** GDD 14.5 — Torneios Regionais: frequentes, entre clãs e seitas comuns, um degrau abaixo do Dragão Duplo. */
export const ENERGIA_TORNEIO = 3;
export const INTERVALO_TORNEIO = 8;
export const TAXA_INSCRICAO = 5;

/** Força relativa ao seu poder real e estágios acima do seu em cada rodada. */
const RODADAS = [
  { titulo: 'Quartas de final', forca: 0.95, estagios: 0 },
  { titulo: 'Semifinal', forca: 1.1, estagios: 1 },
  { titulo: 'Final', forca: 1.25, estagios: 2 },
];

function mediaAtributos(character: Character): number {
  const atributos = getEffectiveAttributes(character);
  return ATTRIBUTE_KEYS.reduce((soma, chave) => soma + atributos[chave], 0) / ATTRIBUTE_KEYS.length;
}

export function nomeTorneio(character: Character): string {
  return `Torneio Regional ${REGIOES[character.local.regiao].preposicao === 'na' ? 'da' : 'do'} ${REGIOES[character.local.regiao].nome}`;
}

export function torneioAberto(historia: StoryState): boolean {
  return historia.turno >= historia.mundo.proximoTorneio;
}

/** Oponentes da região com poder próximo de cada degrau (0,9×, 1,05×, 1,2× o seu). */
function escolherOponentes(character: Character, historia: StoryState): Npc[] {
  const meuPoder = poderNpc({ rank: character.cultivo.rank, estagio: character.cultivo.estagio, atributoMedio: mediaAtributos(character) });
  const candidatos = [...npcsDaRegiao(historia.mundo, character.local.regiao)];
  return RODADAS.map(({ forca }) => {
    candidatos.sort((a, b) => Math.abs(poderNpc(a) - meuPoder * forca) - Math.abs(poderNpc(b) - meuPoder * forca));
    return candidatos.shift() as Npc;
  }).filter(Boolean);
}

/**
 * O nome e o arquétipo vêm do cultivador do ranking; a força acompanha o seu poder real
 * (técnicas, besta), como nos outros combates — senão o torneio ficaria fácil demais.
 */
function oponenteAjustado(character: Character, npc: Npc, forca: number, estagiosAcima: number): InimigoDef {
  const base = inimigoDoNpc(npc);
  const acompanhamento = (1 + character.tecnicas.length * 0.03) * (character.companheira ? 1.25 : 1);
  const regiao = REGIOES[character.local.regiao];
  const media = mediaAtributos(character) * forca * acompanhamento * Math.sqrt(regiao.fatorPoder / 1.2);
  const { rank, estagio } = character.cultivo;
  const estagioFinal = Math.min(estagiosDoRank(rank), estagio + estagiosAcima);
  const ajustado = gerarInimigo(npc.nome, npc.arquetipo, media, rank, estagioFinal);
  return { ...ajustado, nome: base.nome };
}

// ---------------------------------------------------------------------------
// Torneio de Alquimia: três rodadas de refino contra alquimistas do ranking.
// ---------------------------------------------------------------------------

export const ENERGIA_TORNEIO_ALQUIMIA = 2;
export const INTERVALO_TORNEIO_ALQUIMIA = 6;
export const TAXA_ALQUIMIA = 8;

export function torneioAlquimiaAberto(historia: StoryState): boolean {
  return historia.turno >= (historia.mundo.proximoTorneioAlquimia ?? 0);
}

/** Cada rodada: sua pílula (INT + nível×3 + d20) contra a do rival (nível×3 + 10 + d20). */
export function disputarTorneioAlquimia(character: Character, historia: StoryState): DesfechoExibido {
  historia.mundo.proximoTorneioAlquimia = historia.turno + INTERVALO_TORNEIO_ALQUIMIA;
  const mensagens = aplicarEfeitos(character, { pedras: -TAXA_ALQUIMIA });
  const nivel = character.profissoes.alquimia.nivel;
  const inteligencia = getEffectiveAttributes(character).inteligencia;

  const rivais = npcsDaRegiao(historia.mundo, character.local.regiao)
    .filter((n) => n.alquimia > 0)
    .sort((a, b) => Math.abs(a.alquimia - nivel) - Math.abs(b.alquimia - nivel))
    .slice(0, 3)
    .sort((a, b) => a.alquimia - b.alquimia);
  const rodadas = ['Primeira rodada — Pílula de Cura', 'Semifinal — Pílula de Purificação', 'Final — Pílula livre'];

  let vencidas = 0;
  for (let i = 0; i < 3; i++) {
    const rival = rivais[i];
    const nivelRival = Math.min(rival ? rival.alquimia : nivel, nivel + 1);
    const nomeRival = rival ? rival.nome : 'Um alquimista forasteiro';
    const meu = inteligencia + nivel * 3 + 1 + Math.floor(Math.random() * 20);
    const dele = nivelRival * 3 + 6 + i * 2 + 1 + Math.floor(Math.random() * 20);
    const aneis = (valor: number) => Math.max(1, Math.min(9, Math.floor(valor / 8)));
    mensagens.push(`${rodadas[i]}: sua pílula (${aneis(meu)} anéis, ${meu} pts) contra a de ${nomeRival} (${aneis(dele)} anéis, ${dele} pts).`);
    if (meu < dele) break;
    vencidas++;
  }

  const fator = REGIOES[character.local.regiao].fatorPoder;
  let texto: string;
  if (vencidas === 3) {
    historia.mundo.titulosAlquimia = (historia.mundo.titulosAlquimia ?? 0) + 1;
    texto = 'Você é o CAMPEÃO do Torneio de Alquimia! Clãs inteiros vão querer suas pílulas — e você.';
    mensagens.push(...aplicarEfeitos(character, { pedras: Math.round(50 * fator), reputacao: 20, xpProfissao: { alquimia: 150 }, itens: [{ id: 'pilula-dourada', quantidade: 2 }] }));
  } else if (vencidas === 2) {
    texto = 'Vice-campeão! Sua pílula perdeu por pouco na final.';
    mensagens.push(...aplicarEfeitos(character, { pedras: Math.round(20 * fator), reputacao: 8, xpProfissao: { alquimia: 80 } }));
  } else if (vencidas === 1) {
    texto = 'Você passou da primeira rodada.';
    mensagens.push(...aplicarEfeitos(character, { reputacao: 3, xpProfissao: { alquimia: 40 } }));
  } else {
    texto = 'Sua pílula foi a pior da rodada. O júri nem provou a segunda.';
    mensagens.push(...aplicarEfeitos(character, { xpProfissao: { alquimia: 15 } }));
  }
  return { texto, mensagens, log: [], final: false, vitoria: vencidas === 3, sucesso: vencidas === 3 };
}

export function disputarTorneio(character: Character, historia: StoryState): DesfechoExibido {
  historia.mundo.proximoTorneio = historia.turno + INTERVALO_TORNEIO;
  const mensagens = aplicarEfeitos(character, { pedras: -TAXA_INSCRICAO });
  const rodadas: { titulo: string; dados: DadosCombate }[] = [];
  let vencidas = 0;

  for (const [indice, oponente] of escolherOponentes(character, historia).entries()) {
    const rodada = RODADAS[indice];
    const titulo = rodada.titulo;
    const resultado = executarEscolha(character, {
      texto: titulo,
      combate: oponenteAjustado(character, oponente, rodada.forca, rodada.estagios),
      resultado: { texto: '' },
      falha: { texto: '' },
    });
    if (resultado.combate) rodadas.push({ titulo: `${titulo} (${oponente.afiliacao})`, dados: resultado.combate });
    mensagens.push(...resultado.mensagens);
    if (!resultado.vitoria) break;
    vencidas++;
    alterarVidaPercentual(character, 30);
  }

  const fator = REGIOES[character.local.regiao].fatorPoder * (1 + (character.cultivo.rank - 1) * 1.5);
  let texto: string;
  if (vencidas === 3) {
    historia.mundo.titulosTorneio += 1;
    texto = `Você é o CAMPEÃO do ${nomeTorneio(character)}! Clãs e seitas da região inteira vão ouvir seu nome.`;
    mensagens.push(...aplicarEfeitos(character, { pedras: Math.round(60 * fator), reputacao: 25, itens: [{ id: 'pilula-dourada', quantidade: 1 }] }));
  } else if (vencidas === 2) {
    texto = 'Vice-campeão! Você perdeu só na final.';
    mensagens.push(...aplicarEfeitos(character, { pedras: Math.round(25 * fator), reputacao: 10 }));
  } else if (vencidas === 1) {
    texto = 'Você chegou à semifinal.';
    mensagens.push(...aplicarEfeitos(character, { pedras: Math.round(10 * fator), reputacao: 4 }));
  } else {
    texto = 'Eliminado logo nas quartas de final. Ano que vem tem mais.';
    mensagens.push(...aplicarEfeitos(character, { reputacao: 1 }));
  }

  return {
    texto,
    mensagens,
    log: [],
    final: character.vidaAtual <= 0,
    vitoria: vencidas === 3,
    sucesso: vencidas === 3,
    combate: encadearCombates(rodadas),
  };
}
