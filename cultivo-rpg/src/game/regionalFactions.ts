import type { Character } from './character';
import { getEffectiveAttributes } from './character';
import { ATTRIBUTE_KEYS } from './attributes';
import { REINOS } from './cultivation';
import { RANK_MAX_REGIAO, descreverCultivo, estagiosDoRank, gerarNpcsRegiao, poderNpc } from './npcs';
import { REGIOES, RegiaoId, gerarNomeCla, gerarNomePessoa, gerarNomeSeita } from './world';
import { chance, escolher, inteiro } from './rng';
import type { MundoState } from './worldState';

/** Seitas e clãs de cada região: disputam o ranking, fazem guerras entre si e contra você. */
export type TipoFaccaoMundo = 'cla' | 'seita' | 'seita-suprema';

export interface FaccaoMundo {
  id: string;
  nome: string;
  tipo: TipoFaccaoMundo;
  regiao: RegiaoId;
  ortodoxa: boolean;
  lider: { nome: string; rank: number; estagio: number };
  membros: number;
  /** Id de outra facção da região com quem está em guerra. */
  guerraCom?: string;
}

export const NOME_TIPO_FACCAO: Record<TipoFaccaoMundo, string> = { cla: 'Clã', seita: 'Seita', 'seita-suprema': 'Seita Suprema' };

function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function tipoPeloNome(nome: string): TipoFaccaoMundo {
  return /^Clã\s/.test(nome) ? 'cla' : 'seita';
}

/**
 * Seitas acolhem gente de toda parte; clãs dependem do próprio sangue. Por isso clãs costumam ter
 * líderes mais fracos e menos membros — só um clã ancestral (raro) rivaliza com uma seita.
 */
/** O patriarca de um clã carrega o sobrenome da casa. */
function nomeLider(nomeFaccao: string, tipo: TipoFaccaoMundo): string {
  const nome = gerarNomePessoa();
  return tipo === 'cla' && nomeFaccao.startsWith('Clã ') ? `${nomeFaccao.slice(4)} ${nome.split(' ').slice(1).join(' ')}` : nome;
}

function gerarLider(regiao: RegiaoId, tipo: TipoFaccaoMundo, nomeFaccao: string, ancestral = false): FaccaoMundo['lider'] {
  const teto = RANK_MAX_REGIAO[regiao];
  const rank =
    tipo === 'seita-suprema'
      ? Math.min(REINOS.length - 2, teto + inteiro(1, 2))
      : tipo === 'seita'
        ? inteiro(Math.max(3, teto - 2), teto)
        : ancestral
          ? teto
          : inteiro(Math.max(2, teto - 4), Math.max(2, teto - 2));
  return { nome: nomeLider(nomeFaccao, tipo), rank, estagio: inteiro(1, estagiosDoRank(rank)) };
}

function membrosIniciais(tipo: TipoFaccaoMundo, ancestral = false): number {
  if (tipo === 'seita-suprema') return inteiro(900, 2500);
  if (tipo === 'seita') return inteiro(80, 450);
  return ancestral ? inteiro(250, 420) : inteiro(20, 160);
}

/** Crônica do mundo das facções (roubos de discípulos, guerras), as mais recentes primeiro. */
function registrarCronica(mundo: MundoState, texto: string): void {
  mundo.cronicaFaccoes = [texto, ...(mundo.cronicaFaccoes ?? [])].slice(0, 8);
}

/**
 * Gerada uma vez por região: as Seitas Supremas, as seitas e clãs a que pertencem os cultivadores
 * da região (assim o ranking de pessoas e o de facções contam a mesma história) e algumas a mais.
 */
export function gerarFaccoesRegiao(regiao: RegiaoId, afiliacoesNpcs: string[]): FaccaoMundo[] {
  const supremas = REGIOES[regiao].seitasSupremas;
  const nomesSupremas = new Set(supremas.map((s) => s.nome));
  const faccoes: FaccaoMundo[] = supremas.map((s) => ({
    id: novoId(),
    nome: s.nome,
    tipo: 'seita-suprema',
    regiao,
    ortodoxa: s.ortodoxa,
    lider: gerarLider(regiao, 'seita-suprema', s.nome),
    membros: membrosIniciais('seita-suprema'),
  }));

  const nomes = [...new Set(afiliacoesNpcs)].filter((n) => n !== 'Cultivador errante' && !nomesSupremas.has(n)).slice(0, 12);
  while (nomes.filter((n) => tipoPeloNome(n) === 'cla').length < 4) nomes.push(gerarNomeCla());
  while (nomes.filter((n) => tipoPeloNome(n) === 'seita').length < 4) nomes.push(gerarNomeSeita(chance(0.75)));

  for (const nome of new Set(nomes)) {
    const tipo = tipoPeloNome(nome);
    const ancestral = tipo === 'cla' && chance(0.1);
    faccoes.push({ id: novoId(), nome, tipo, regiao, ortodoxa: tipo === 'cla' || chance(0.75), lider: gerarLider(regiao, tipo, nome, ancestral), membros: membrosIniciais(tipo, ancestral) });
  }
  return faccoes;
}

export function faccoesDaRegiao(mundo: MundoState, regiao: RegiaoId): FaccaoMundo[] {
  mundo.faccoesPorRegiao = mundo.faccoesPorRegiao ?? {};
  if (!mundo.faccoesPorRegiao[regiao]) {
    const npcs = (mundo.npcsPorRegiao[regiao] = mundo.npcsPorRegiao[regiao] ?? gerarNpcsRegiao(regiao));
    mundo.faccoesPorRegiao[regiao] = gerarFaccoesRegiao(regiao, npcs.map((n) => n.afiliacao));
  }
  return mundo.faccoesPorRegiao[regiao] as FaccaoMundo[];
}

export function acharFaccao(mundo: MundoState, nome: string): FaccaoMundo | undefined {
  for (const lista of Object.values(mundo.faccoesPorRegiao ?? {})) {
    const achada = lista?.find((f) => f.nome === nome);
    if (achada) return achada;
  }
  return undefined;
}

/** Força de uma facção: o líder pesa muito, os membros somam, e os cultivadores conhecidos dela também. */
export function poderFaccao(mundo: MundoState, f: FaccaoMundo): number {
  const lider = poderNpc({ rank: f.lider.rank, estagio: f.lider.estagio, atributoMedio: 9 + f.lider.rank * 1.2 });
  const conhecidos = (mundo.npcsPorRegiao[f.regiao] ?? []).filter((n) => n.afiliacao === f.nome).reduce((s, n) => s + poderNpc(n), 0);
  return Math.round(lider * (1 + f.membros / 150) + conhecidos * 0.3);
}

function mediaAtributos(character: Character): number {
  const a = getEffectiveAttributes(character);
  return ATTRIBUTE_KEYS.reduce((s, k) => s + a[k], 0) / ATTRIBUTE_KEYS.length;
}

/** A facção que você lidera (fundada por você ou herdada). */
function poderFaccaoDoJogador(character: Character): number {
  const f = character.faccao;
  if (!f) return 0;
  const lider = poderNpc({ rank: character.cultivo.rank, estagio: character.cultivo.estagio, atributoMedio: mediaAtributos(character) });
  const { salaCultivo, biblioteca, muralhas } = f.instalacoes;
  return Math.round(lider * (1 + f.membros / 150) * (1 + (salaCultivo + biblioteca + muralhas) * 0.05));
}

export interface EntradaFaccao {
  nome: string;
  tipo: TipoFaccaoMundo;
  lider: string;
  membros: number;
  poder: number;
  ortodoxa: boolean;
  /** Você lidera ou pertence a esta facção. */
  sua: boolean;
  emGuerraCom?: string;
}

/**
 * Ranking das seitas e clãs de uma região. A sua facção (fundada, ou a seita/clã a que você pertence)
 * entra no ranking da região onde você está.
 */
export function rankingFaccoes(mundo: MundoState, character: Character, regiao: RegiaoId, filtro?: 'seitas' | 'clas'): EntradaFaccao[] {
  const todas = rankingTodasFaccoes(mundo, character, regiao);
  if (!filtro) return todas;
  return todas.filter((e) => (filtro === 'clas' ? e.tipo === 'cla' : e.tipo !== 'cla'));
}

function rankingTodasFaccoes(mundo: MundoState, character: Character, regiao: RegiaoId): EntradaFaccao[] {
  const faccoes = faccoesDaRegiao(mundo, regiao);
  const porId = new Map(faccoes.map((f) => [f.id, f]));
  const meuLado = character.faccao?.nome ?? character.afiliacao.nome;
  const guerraJogador = character.guerra?.inimigo;
  const entradas: EntradaFaccao[] = faccoes.map((f) => ({
    nome: f.nome,
    tipo: f.tipo,
    lider: `${f.lider.nome} · ${descreverCultivo(f.lider.rank, f.lider.estagio)}`,
    membros: f.membros,
    poder: poderFaccao(mundo, f),
    ortodoxa: f.ortodoxa,
    sua: f.nome === meuLado,
    emGuerraCom: guerraJogador === f.nome ? meuLado : f.guerraCom ? porId.get(f.guerraCom)?.nome : undefined,
  }));

  if (regiao === character.local.regiao && character.faccao && !entradas.some((e) => e.nome === character.faccao?.nome)) {
    const f = character.faccao;
    entradas.push({
      nome: f.nome,
      tipo: f.tipo === 'cla' ? 'cla' : 'seita',
      lider: `${character.nome} (você) · ${descreverCultivo(character.cultivo.rank, character.cultivo.estagio)}`,
      membros: f.membros,
      poder: poderFaccaoDoJogador(character),
      ortodoxa: f.ortodoxa,
      sua: true,
      emGuerraCom: guerraJogador,
    });
  }
  return entradas.sort((a, b) => b.poder - a.poder);
}

/**
 * A facção do seu lado numa guerra: a que você lidera, ou a seita/clã a que pertence
 * (incluída na lista da região se ainda não estiver lá).
 */
export function faccaoDoJogador(mundo: MundoState, character: Character): { nome: string; poder: number } | null {
  if (character.faccao) return { nome: character.faccao.nome, poder: poderFaccaoDoJogador(character) };
  const tipo = character.afiliacao.tipo;
  if (tipo !== 'cla' && tipo !== 'seita' && tipo !== 'seita-suprema') return null;
  const lista = faccoesDaRegiao(mundo, character.local.regiao);
  let minha = lista.find((f) => f.nome === character.afiliacao.nome);
  if (!minha) {
    minha = {
      id: novoId(),
      nome: character.afiliacao.nome,
      tipo: tipo === 'cla' ? 'cla' : tipo,
      regiao: character.local.regiao,
      ortodoxa: character.afiliacao.ortodoxa,
      lider: gerarLider(character.local.regiao, tipo === 'cla' ? 'cla' : tipo, character.afiliacao.nome),
      membros: membrosIniciais(tipo === 'cla' ? 'cla' : tipo),
    };
    lista.push(minha);
  }
  return { nome: minha.nome, poder: poderFaccao(mundo, minha) };
}

/** O mundo das facções também se move: líderes avançam, membros vêm e vão, guerras começam e terminam. */
export function avancarFaccoes(mundo: MundoState, regiao: RegiaoId, meses: number): void {
  const lista = faccoesDaRegiao(mundo, regiao);
  const estacoes = Math.max(1, Math.round(meses / 3));
  for (let e = 0; e < estacoes; e++) {
    for (const f of lista) {
      if (chance(0.02 / Math.sqrt(f.lider.rank))) {
        f.lider.estagio += 1;
        if (f.lider.estagio > estagiosDoRank(f.lider.rank)) {
          if (f.lider.rank < REINOS.length - 2 && chance(0.4)) {
            f.lider.rank += 1;
            f.lider.estagio = 1;
          } else f.lider.estagio = estagiosDoRank(f.lider.rank);
        }
      }
      f.membros = Math.max(5, Math.round(f.membros * (1 + (Math.random() - 0.45) * 0.03)));
      if (chance(0.004)) f.lider = gerarLider(regiao, f.tipo, f.nome);
      if (f.tipo === 'cla' && f.nome.startsWith('Clã ') && !f.lider.nome.startsWith(`${f.nome.slice(4)} `)) {
        f.lider.nome = nomeLider(f.nome, f.tipo);
      }

      if (f.guerraCom) {
        const rival = lista.find((x) => x.id === f.guerraCom);
        if (!rival || chance(0.12)) {
          if (rival) {
            const vencedor = poderFaccao(mundo, f) * Math.random() > poderFaccao(mundo, rival) * Math.random() ? f : rival;
            const perdedor = vencedor === f ? rival : f;
            perdedor.membros = Math.max(5, Math.round(perdedor.membros * 0.8));
            vencedor.membros = Math.round(vencedor.membros * 1.1);
            rival.guerraCom = undefined;
          }
          f.guerraCom = undefined;
        } else {
          f.membros = Math.max(5, Math.round(f.membros * 0.98));
        }
      }
    }
    if (chance(0.03)) {
      const livres = lista.filter((f) => !f.guerraCom && f.tipo !== 'seita-suprema');
      if (livres.length >= 2) {
        const a = escolher(livres);
        const b = escolher(livres.filter((x) => x !== a && x.tipo === a.tipo));
        if (b) {
          a.guerraCom = b.id;
          b.guerraCom = a.id;
          registrarCronica(mundo, `Guerra: o ${a.nome} e o ${b.nome} pegaram em armas.`);
        }
      }
    }

    // Seitas Supremas atraem os melhores discípulos das seitas menores com recursos que elas não podem igualar.
    if (chance(0.06)) {
      const supremas = lista.filter((f) => f.tipo === 'seita-suprema');
      const menores = lista.filter((f) => f.tipo === 'seita' && f.membros > 20);
      if (supremas.length && menores.length) {
        const ladra = escolher(supremas);
        const vitima = escolher(menores);
        const levados = Math.max(2, Math.round(vitima.membros * (0.05 + Math.random() * 0.07)));
        vitima.membros -= levados;
        ladra.membros += levados;
        registrarCronica(mundo, `A ${ladra.nome} atraiu ${levados} discípulos da ${vitima.nome}.`);
      }
    }
  }
}
