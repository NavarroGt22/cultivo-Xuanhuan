import type { Character } from './character';
import type { Interacao, Relacao } from './relationships';
import { LEALDADE_IRMAO, PAPEIS, PapelCompanheiro, multiplicadorLealdade } from './companionRoles';
import { influenciaPessoal } from './influence';
import { estagiosDoRank } from './npcs';
import { chance, escolher, inteiro } from './rng';
import { gerarNomePessoa } from './world';

/**
 * GDD 15.3 — Companheiros de Jornada: gente que viaja com você, com Lealdade própria (separada da
 * relação e da sincronia da besta). Lealdade cuidada vira Irmão de Armas (bônus em dobro) e pode
 * até virar romance; negligenciada — ou ferida por atos contra o caminho dele —, vira traição.
 * Companheiros de caminhos opostos (ortodoxo × demoníaco) brigam entre si.
 */
export const LEALDADE_TRAICAO = 15;
const LEALDADE_AVISO = 25;
const PAPEIS_IDS = Object.keys(PAPEIS) as PapelCompanheiro[];

export function ehCompanheiroJornada(r: Relacao): boolean {
  return Boolean(r.papel) && r.tipo !== 'Ex';
}

export function companheirosDeJornada(character: Character): Relacao[] {
  return character.relacoes.filter(ehCompanheiroJornada);
}

/** Dois companheiros; três para quem já é conhecido no reino. */
export function limiteCompanheiros(character: Character): number {
  return influenciaPessoal(character).nivel >= 4 ? 3 : 2;
}

function nivelLealdade(lealdade: number): string {
  if (lealdade >= LEALDADE_IRMAO) return 'Irmão de Armas';
  if (lealdade >= 60) return 'Leal';
  if (lealdade >= 35) return 'Hesitante';
  if (lealdade > LEALDADE_TRAICAO) return 'Ressentido';
  return 'Prestes a trair';
}

export function descreverCompanheiro(r: Relacao): string {
  if (!r.papel) return '';
  const lealdade = Math.round(r.lealdade ?? 0);
  return `${PAPEIS[r.papel].nome} (${r.caminho === 'demoniaco' ? 'caminho demoníaco' : 'caminho ortodoxo'}) · Lealdade ${lealdade} — ${nivelLealdade(lealdade)}`;
}

function limitar(valor: number): number {
  return Math.max(0, Math.min(100, Math.round(valor)));
}

/** Tira a pessoa do grupo sem romper a relação. */
export function deixarJornada(r: Relacao): void {
  delete r.papel;
  delete r.caminho;
  delete r.lealdade;
  if (r.tipo === 'Companheiro de Jornada') r.tipo = 'Amigo';
}

export function bloqueioConvidar(character: Character, r: Relacao): string | null {
  const naoSeAplica: Relacao['tipo'][] = ['Filho(a)', 'Irmão(ã)', 'Mãe/Pai', 'Inimigo Jurado', 'Vassalo', 'Discípulo', 'Ex'];
  if (naoSeAplica.includes(r.tipo) || r.papel) return 'Não se aplica';
  if (character.idadeMeses < 14 * 12) return 'Requer 14 anos';
  if (r.relacao < 50) return 'Requer relação 50';
  if (companheirosDeJornada(character).length >= limiteCompanheiros(character)) return `Máximo de ${limiteCompanheiros(character)} companheiros`;
  return null;
}

function entrarNaJornada(r: Relacao, lealdade: number): void {
  r.papel = escolher(PAPEIS_IDS);
  r.caminho = chance(0.25) ? 'demoniaco' : 'ortodoxo';
  r.lealdade = limitar(lealdade);
  if (['Conhecido', 'Amigo', 'Melhor Amigo'].includes(r.tipo)) r.tipo = 'Companheiro de Jornada';
}

/** Um cultivador errante que pede para viajar com você (evento da história). */
export function gerarCompanheiroErrante(character: Character): Relacao {
  const rank = Math.max(1, character.cultivo.rank - (chance(0.5) ? 1 : 0));
  const r: Relacao = {
    id: Math.random().toString(36).slice(2, 10),
    nome: gerarNomePessoa(),
    tipo: 'Conhecido',
    idade: Math.max(14, Math.floor(character.idadeMeses / 12) + inteiro(-6, 8)),
    rank,
    estagio: inteiro(1, estagiosDoRank(rank)),
    aparencia: inteiro(30, 100),
    inteligencia: inteiro(30, 100),
    compatibilidadeElemental: inteiro(20, 80),
    relacao: 45,
  };
  entrarNaJornada(r, 45);
  return r;
}

export function recrutarCompanheiro(character: Character, r: Relacao): string {
  if (companheirosDeJornada(character).length >= limiteCompanheiros(character)) {
    return `Seu grupo já está cheio (${limiteCompanheiros(character)}). ${r.nome} segue viagem sozinho.`;
  }
  character.relacoes.push(r);
  return `${r.nome} agora viaja com você como ${PAPEIS[r.papel!].nome.toLowerCase()} — ${PAPEIS[r.papel!].descricao}.`;
}

const custoEspolios = (c: Character): number => 5 * c.cultivo.rank;

export const INTERACOES_COMPANHEIRO: Interacao[] = [
  {
    id: 'convidar-jornada',
    rotulo: 'Convidar para a jornada',
    bloqueio: bloqueioConvidar,
    executar: (c, r) => {
      entrarNaJornada(r, 45 + r.relacao / 5);
      return [`${r.nome} aceita viajar com você como ${PAPEIS[r.papel!].nome.toLowerCase()} — ${PAPEIS[r.papel!].descricao}.`];
    },
  },
  {
    id: 'dividir-espolios',
    rotulo: 'Dividir espólios',
    bloqueio: (c, r) => (!ehCompanheiroJornada(r) ? 'Não se aplica' : c.inventario.pedrasEspirituais < custoEspolios(c) ? `Requer ${custoEspolios(c)} pedras` : null),
    executar: (c, r) => {
      const custo = custoEspolios(c);
      c.inventario.pedrasEspirituais -= custo;
      const antes = r.lealdade ?? 0;
      r.lealdade = limitar(antes + 12);
      r.relacao = limitar(r.relacao + 3);
      const irmao = antes < LEALDADE_IRMAO && r.lealdade >= LEALDADE_IRMAO ? ` ${r.nome} jura lutar ao seu lado até o fim: agora são Irmãos de Armas (bônus em dobro).` : '';
      return [`Você divide ${custo} pedras dos espólios com ${r.nome}. Lealdade +12.${irmao}`];
    },
  },
  {
    id: 'dispensar-jornada',
    rotulo: 'Dispensar da jornada',
    bloqueio: (_, r) => (ehCompanheiroJornada(r) ? null : 'Não se aplica'),
    executar: (_, r) => {
      deixarJornada(r);
      return [`${r.nome} segue o próprio caminho, sem ressentimentos.`];
    },
  },
];

/** Companheiros aprovam ou desaprovam seus atos conforme o caminho deles. */
export function reagirAlinhamentoCompanheiros(character: Character, delta: number): string[] {
  const variacao = Math.round(delta * 0.3);
  if (!variacao) return [];
  const mensagens: string[] = [];
  for (const r of companheirosDeJornada(character)) {
    const efeito = r.caminho === 'demoniaco' ? -variacao : variacao;
    r.lealdade = limitar((r.lealdade ?? 0) + efeito);
    if (Math.abs(efeito) >= 3) mensagens.push(`${r.nome} ${efeito > 0 ? 'aprova' : 'desaprova'} o que você fez (lealdade ${efeito > 0 ? '+' : ''}${efeito}).`);
  }
  return mensagens;
}

/** A cada estação: a lealdade esfria sem cuidado, caminhos opostos brigam, quem se ressente trai. */
export function processarCompanheiros(character: Character, estacoes: number): string[] {
  const mensagens: string[] = [];
  const grupo = companheirosDeJornada(character);
  for (const r of grupo) {
    const antes = r.lealdade ?? 0;
    let queda = 0;
    for (let i = 0; i < estacoes; i++) if (chance(0.5)) queda++;
    r.lealdade = limitar(antes - queda);
    if (antes >= LEALDADE_AVISO && r.lealdade < LEALDADE_AVISO) {
      mensagens.push(`${r.nome} anda calado e ressentido (lealdade ${r.lealdade}). Divida os espólios ou atenda a um pedido dele antes que seja tarde.`);
    }
  }

  const ortodoxo = grupo.find((r) => r.caminho === 'ortodoxo');
  const demoniaco = grupo.find((r) => r.caminho === 'demoniaco');
  if (ortodoxo && demoniaco && chance(Math.min(0.9, 0.3 * estacoes))) {
    ortodoxo.lealdade = limitar((ortodoxo.lealdade ?? 0) - 4);
    demoniaco.lealdade = limitar((demoniaco.lealdade ?? 0) - 4);
    mensagens.push(`${ortodoxo.nome} e ${demoniaco.nome} brigaram na fogueira: caminhos opostos não dividem a mesma estrada em paz (lealdade dos dois −4).`);
  }

  for (const r of grupo) {
    if ((r.lealdade ?? 0) > LEALDADE_TRAICAO || !chance(0.35)) continue;
    const roubo = Math.round(character.inventario.pedrasEspirituais * 0.1);
    character.inventario.pedrasEspirituais -= roubo;
    character.relacoes = character.relacoes.filter((x) => x.id !== r.id);
    mensagens.push(`Traição! ${r.nome} sumiu na calada da noite${roubo ? ` levando ${roubo} pedras espirituais` : ''}. Lealdade negligenciada cobra seu preço.`);
  }
  return mensagens;
}

function temPapel(character: Character, papel: PapelCompanheiro): Relacao | undefined {
  return companheirosDeJornada(character).find((r) => r.papel === papel);
}

/** Batedor: 30% menos emboscadas (50% se for Irmão de Armas). */
export function fatorEmboscadaCompanheiros(character: Character): number {
  const batedor = temPapel(character, 'batedor');
  return batedor ? (multiplicadorLealdade(batedor) > 1 ? 0.5 : 0.7) : 1;
}

/** Curandeiro: % extra de vida recuperada por estação. */
export function curaCompanheiros(character: Character): number {
  const curandeiro = temPapel(character, 'curandeiro');
  return curandeiro ? 15 * multiplicadorLealdade(curandeiro) : 0;
}

/** Erudito: soma ao fator de cultivo passivo. */
export function bonusCultivoCompanheiros(character: Character): number {
  const erudito = temPapel(character, 'erudito');
  return erudito ? 0.05 * multiplicadorLealdade(erudito) : 0;
}
