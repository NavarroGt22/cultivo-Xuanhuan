import type { Character } from './character';
import { idadeAnos } from './character';
import { attributeCheck } from './dice';
import { addPedrasEspirituais } from './inventory';
import { descreverCultivo, estagiosDoRank, gerarNpc } from './npcs';
import { ELEMENTOS_BASE, rollSpiritualRoot, grauRaizInfo } from './spiritualRoot';
import { gerarNomePessoa } from './world';
import { chance, inteiro } from './rng';
import { influenciaPessoal } from './influence';
import { doFamilia } from './world';
import { fatorRelacoesTracos } from './lifeTraits';
import type { PapelCompanheiro } from './companionRoles';
import { INTERACOES_COMPANHEIRO, deixarJornada, descreverCompanheiro, processarCompanheiros } from './journeyCompanions';

/** docs/Sistema-de-vida.md — Relacionamentos. */
export type TipoRelacao =
  | 'Conhecido'
  | 'Amigo'
  | 'Melhor Amigo'
  | 'Namorado(a)'
  | 'Cônjuge'
  | 'Companheiro(a) de Dao'
  | 'Filho(a)'
  | 'Ex'
  | 'Inimigo Jurado'
  | 'Irmão(ã)'
  | 'Mãe/Pai'
  | 'Vassalo'
  | 'Discípulo'
  | 'Companheiro de Jornada';

/** Família de sangue: nada de namoro, casamento ou término. */
export function ehFamilia(r: Relacao): boolean {
  return r.tipo === 'Filho(a)' || r.tipo === 'Irmão(ã)' || r.tipo === 'Mãe/Pai';
}

export interface Relacao {
  id: string;
  nome: string;
  tipo: TipoRelacao;
  idade: number;
  rank: number;
  estagio: number;
  aparencia: number;
  inteligencia: number;
  /** Afinidade entre as raízes espirituais (GDD 8). */
  compatibilidadeElemental: number;
  /** 0–100. */
  relacao: number;
  /** Só para filhos: grau da raiz espiritual sorteada. */
  raizGrau?: number;
  /** Companheiro de Jornada (journeyCompanions.ts): papel no grupo, caminho e lealdade (0–100). */
  papel?: PapelCompanheiro;
  caminho?: 'ortodoxo' | 'demoniaco';
  lealdade?: number;
}

export const ENERGIA_INTERACAO = 1;

function compatibilidade(character: Character): number {
  const meus = character.raizEspiritual.elementos;
  const base = inteiro(20, 80);
  const bonus = meus.some((e) => ELEMENTOS_BASE.includes(e)) && chance(0.4) ? 20 : 0;
  return Math.min(100, base + bonus);
}

export function conhecerAlguem(character: Character): Relacao {
  const npc = gerarNpc(character.local.regiao, { rankMax: Math.max(1, character.cultivo.rank + 1) });
  const idade = Math.max(12, idadeAnos(character) + inteiro(-5, 5));
  const relacao: Relacao = {
    id: npc.id,
    nome: npc.nome,
    tipo: 'Conhecido',
    idade,
    rank: npc.rank,
    estagio: npc.estagio,
    aparencia: inteiro(30, 100),
    inteligencia: inteiro(30, 100),
    compatibilidadeElemental: compatibilidade(character),
    relacao: inteiro(20, 40),
  };
  character.relacoes.push(relacao);
  return relacao;
}

export function descreverRelacao(r: Relacao): string {
  if (r.tipo === 'Inimigo Jurado') return `Rixa de sangue — Patriarca no ${descreverCultivo(r.rank, r.estagio)}`;
  if (r.tipo === 'Vassalo') return `Família vassala — paga ${r.rank * 2} pedras de tributo por estação`;
  if (r.tipo === 'Discípulo') {
    return `${Math.floor(r.idade)} anos · ${descreverCultivo(r.rank, r.estagio)} · Raiz grau ${r.raizGrau ?? '?'} (${grauRaizInfo(r.raizGrau ?? 1).nome})`;
  }
  if (r.tipo === 'Filho(a)') {
    return `${Math.floor(r.idade)} anos · Raiz ${r.raizGrau} (${grauRaizInfo(r.raizGrau ?? 1).nome})`;
  }
  const base = `${Math.floor(r.idade)} anos · ${descreverCultivo(r.rank, r.estagio)} · Aparência ${r.aparencia} · Compat. elemental ${r.compatibilidadeElemental}`;
  return r.papel ? `${base} · ${descreverCompanheiro(r)}` : base;
}

export interface Interacao {
  id: string;
  rotulo: string;
  bloqueio: (c: Character, r: Relacao) => string | null;
  executar: (c: Character, r: Relacao) => string[];
}

function atualizarTipoAmizade(r: Relacao): void {
  if (!['Conhecido', 'Amigo', 'Melhor Amigo'].includes(r.tipo)) return;
  r.tipo = r.relacao >= 85 ? 'Melhor Amigo' : r.relacao >= 50 ? 'Amigo' : 'Conhecido';
}

function ajustar(r: Relacao, delta: number): void {
  r.relacao = Math.max(0, Math.min(100, r.relacao + delta));
  atualizarTipoAmizade(r);
}

export const ehParceiro = (r: Relacao): boolean => r.tipo === 'Cônjuge' || r.tipo === 'Companheiro(a) de Dao';
const ehRomance = (r: Relacao): boolean => ehParceiro(r) || r.tipo === 'Namorado(a)';

/** Relações que não são pessoas próximas (sem conversa, presente etc.). */
export function ehRelacaoDePoder(r: Relacao): boolean {
  return r.tipo === 'Inimigo Jurado' || r.tipo === 'Vassalo';
}

/**
 * Harém: quanto maior sua influência, mais parceiros(as) o mundo aceita ao seu lado
 * (1 para um desconhecido, até 5 para um mito continental).
 */
export function limiteDoHarem(character: Character): number {
  return Math.max(1, Math.min(5, influenciaPessoal(character).nivel - 1));
}

export function parceirosRomanticos(character: Character): Relacao[] {
  return character.relacoes.filter(ehRomance);
}

const CUSTO_BANQUETE = 10;

export const INTERACOES: Interacao[] = [
  {
    id: 'ensinar',
    rotulo: 'Ensinar',
    bloqueio: (_, r) => (r.tipo !== 'Discípulo' ? 'Não se aplica' : null),
    executar: (c, r) => {
      ajustar(r, 5);
      c.reputacao += 1;
      const avanco = avancarDiscipulo(c, r, 0.35 + (r.raizGrau ?? 3) * 0.05);
      const progresso = avanco ?? `${r.nome} agora está no ${descreverCultivo(r.rank, r.estagio)}.`;
      return [`Você passa a estação corrigindo a postura e a circulação de qi de ${r.nome}. Relação +5, reputação +1.`, progresso];
    },
  },
  {
    id: 'conversar',
    rotulo: 'Conversar',
    bloqueio: () => null,
    executar: (c, r) => {
      const delta = Math.max(1, Math.round(inteiro(3, 8) * fatorRelacoesTracos(c)));
      ajustar(r, delta);
      return [`Uma boa conversa com ${r.nome}. Relação +${delta}.`];
    },
  },
  {
    id: 'presentear',
    rotulo: 'Presentear (3 pedras)',
    bloqueio: (c) => (c.inventario.pedrasEspirituais < 3 ? 'Requer 3 pedras' : null),
    executar: (c, r) => {
      addPedrasEspirituais(c.inventario, -3);
      const delta = Math.max(1, Math.round(inteiro(8, 15) * fatorRelacoesTracos(c)));
      ajustar(r, delta);
      return [`${r.nome} adora o presente. Relação +${delta}.`];
    },
  },
  {
    id: 'namorar',
    rotulo: 'Pedir em namoro',
    bloqueio: (c, r) =>
      ehFamilia(r) || ehParceiro(r) || r.tipo === 'Namorado(a)' || r.tipo === 'Discípulo'
        ? 'Não se aplica'
        : r.relacao < 60
          ? 'Requer relação 60'
          : parceirosRomanticos(c).length >= limiteDoHarem(c)
            ? `Seu harém está no limite (${limiteDoHarem(c)}) — aumente sua influência`
            : null,
    executar: (c, r) => {
      const outros = parceirosRomanticos(c);
      const teste = attributeCheck(c.atributosBase.espirito, 12 - Math.floor((r.relacao - 60) / 5) + outros.length * 2);
      if (teste.success) {
        r.tipo = 'Namorado(a)';
        for (const outro of outros) ajustar(outro, -8);
        return outros.length
          ? [`${r.nome} aceita entrar para o seu harém!`, `${outros.map((o) => o.nome).join(', ')} não gostou nada disso (relação −8).`]
          : [`${r.nome} aceita! Vocês estão namorando.`];
      }
      ajustar(r, -10);
      return [`${r.nome} recusa com um sorriso sem graça. Relação −10.`];
    },
  },
  {
    id: 'casar',
    rotulo: 'Pedir em casamento',
    bloqueio: (_, r) => (r.tipo === 'Discípulo' ? 'Não se aplica' : r.tipo !== 'Namorado(a)' ? 'Só com quem você namora' : r.relacao < 80 ? 'Requer relação 80' : null),
    executar: (_, r) => {
      const dao = r.compatibilidadeElemental >= 70 && r.rank >= 1;
      r.tipo = dao ? 'Companheiro(a) de Dao' : 'Cônjuge';
      return dao
        ? [`Vocês se casam — e as raízes de vocês ressoam juntas. ${r.nome} é seu Companheiro(a) de Dao: cultivar lado a lado acelera os dois.`]
        : [`Vocês se casam numa cerimônia simples. ${r.nome} agora é seu cônjuge.`];
    },
  },
  {
    id: 'ter-filho',
    rotulo: 'Tentar ter um filho',
    bloqueio: (c, r) =>
      r.tipo === 'Discípulo' ? 'Não se aplica' : !ehParceiro(r) ? 'Só com cônjuge ou Companheiro(a) de Dao' : idadeAnos(c) < 18 ? 'Requer 18 anos' : c.relacoes.filter((x) => x.tipo === 'Filho(a)').length >= 5 ? 'Máximo de 5 filhos' : null,
    executar: (c, r) => {
      if (!chance(0.5)) return ['Ainda não foi desta vez.'];
      const raiz = rollSpiritualRoot(c.atributosBase.sorte);
      const filho: Relacao = {
        id: Math.random().toString(36).slice(2, 10),
        nome: `${c.nome.split(' ')[0]} ${gerarNomePessoa().split(' ')[1]}`,
        tipo: 'Filho(a)',
        idade: 0,
        rank: 1,
        estagio: 1,
        aparencia: Math.round((r.aparencia + inteiro(30, 100)) / 2),
        inteligencia: Math.round((r.inteligencia + inteiro(30, 100)) / 2),
        compatibilidadeElemental: 100,
        relacao: 80,
        raizGrau: raiz.grau,
      };
      c.relacoes.push(filho);
      return [`Nasce ${filho.nome}! A Pedra de Teste só dirá daqui a seis anos, mas os sinais apontam uma raiz de Grau ${raiz.grau} (${grauRaizInfo(raiz.grau).nome}).`];
    },
  },
  {
    id: 'banquete',
    rotulo: `Banquete para o harém (${CUSTO_BANQUETE} pedras)`,
    bloqueio: (c, r) =>
      !ehRomance(r)
        ? 'Não se aplica'
        : parceirosRomanticos(c).length < 2
          ? 'Requer ao menos 2 parceiros(as)'
          : c.inventario.pedrasEspirituais < CUSTO_BANQUETE
            ? `Requer ${CUSTO_BANQUETE} pedras`
            : null,
    executar: (c) => {
      addPedrasEspirituais(c.inventario, -CUSTO_BANQUETE);
      const parceiros = parceirosRomanticos(c);
      const ganho = Math.max(1, Math.round(10 * fatorRelacoesTracos(c)));
      for (const p of parceiros) ajustar(p, ganho);
      return [`Um banquete com vinho espiritual e música. O clima no harém melhora: ${parceiros.map((p) => p.nome).join(', ')} (relação +${ganho}).`];
    },
  },
  {
    id: 'discutir',
    rotulo: 'Discutir',
    bloqueio: (_, r) => (ehFamilia(r) ? 'Não se aplica' : null),
    executar: (_, r) => {
      ajustar(r, -12);
      return [`Vocês discutem feio. Relação com ${r.nome} −12.`];
    },
  },
  {
    id: 'terminar',
    rotulo: 'Terminar / romper',
    bloqueio: (_, r) => (ehFamilia(r) ? 'Não se aplica' : null),
    executar: (c, r) => {
      const eraParceiro = ehParceiro(r) || r.tipo === 'Namorado(a)';
      if (eraParceiro) {
        deixarJornada(r);
        r.tipo = 'Ex';
        r.relacao = Math.min(r.relacao, 20);
        return [`Você e ${r.nome} se separam. ${r.nome} agora é seu/sua ex.`];
      }
      // Amigos, conhecidos e ex: cortar os laços tira a pessoa da sua vida.
      c.relacoes = c.relacoes.filter((x) => x.id !== r.id);
      return [`Você corta os laços com ${r.nome}. Vocês não se falam mais.`];
    },
  },
  ...INTERACOES_COMPANHEIRO,
];

/** Relações esfriam com o tempo; filhos crescem; Companheiros de Dao cultivam junto; vassalos pagam tributo. */
export function passarTempoRelacoes(character: Character, meses: number): string[] {
  const mensagens: string[] = [];
  const estacoes = Math.max(1, Math.round(meses / 3));

  for (const r of character.relacoes) {
    if (r.tipo === 'Inimigo Jurado') continue;
    if (r.tipo === 'Vassalo') {
      const tributo = r.rank * 2 * estacoes;
      addPedrasEspirituais(character.inventario, tributo);
      mensagens.push(`Tributo ${doFamilia(r.nome)}: +${tributo} pedras espirituais.`);
      continue;
    }
    r.idade += meses / 12;
    if (r.tipo === 'Discípulo') {
      for (let i = 0; i < estacoes; i++) {
        const avanco = avancarDiscipulo(character, r, 0.05 * ((r.raizGrau ?? 3) / 5));
        if (avanco) mensagens.push(avanco);
      }
      continue;
    }
    if (!ehFamilia(r) && !ehParceiro(r)) ajustar(r, -meses / 6);
    if (r.tipo === 'Companheiro(a) de Dao' && chance(0.1)) r.estagio += 1;
  }

  // Ciúmes no harém: quanto mais parceiros(as), mais atrito.
  const parceiros = parceirosRomanticos(character);
  if (parceiros.length >= 2 && chance(0.12 * (parceiros.length - 1))) {
    const [a, b] = [...parceiros].sort(() => Math.random() - 0.5);
    ajustar(a, -8);
    mensagens.push(`Ciúmes no harém: ${a.nome} se sente deixado(a) de lado por causa de ${b.nome} (relação −8).`);
  }

  // Quem se sente abandonado de verdade vai embora.
  for (const p of parceiros) {
    if (p.relacao <= 10) {
      deixarJornada(p);
      p.tipo = 'Ex';
      mensagens.push(`${p.nome} deixou você.`);
    }
  }
  mensagens.push(...processarCompanheiros(character, estacoes));
  return mensagens;
}

// ---------------------------------------------------------------------------
// Discípulos: a partir do 3º reino você pode ter os seus.
// ---------------------------------------------------------------------------

export const ENERGIA_BUSCAR_DISCIPULO = 1;
export const REINO_MINIMO_MESTRE = 3;
export const REPUTACAO_MINIMA_MESTRE = 20;

export function discipulosDe(character: Character): Relacao[] {
  return character.relacoes.filter((r) => r.tipo === 'Discípulo');
}

/** 1 discípulo no 3º reino, +1 a cada reino (até 5). */
export function limiteDiscipulos(character: Character): number {
  return character.cultivo.rank < REINO_MINIMO_MESTRE ? 0 : Math.min(5, character.cultivo.rank - REINO_MINIMO_MESTRE + 1);
}

export function bloqueioBuscarDiscipulo(character: Character): string | null {
  if (character.cultivo.rank < REINO_MINIMO_MESTRE) return 'Para ensinar alguém você precisa alcançar o 3º reino (Two Force Realm).';
  if (character.reputacao < REPUTACAO_MINIMA_MESTRE) return `Ninguém conhece seu nome ainda (requer reputação ${REPUTACAO_MINIMA_MESTRE}).`;
  if (discipulosDe(character).length >= limiteDiscipulos(character)) return `Você já tem o máximo de discípulos para o seu reino (${limiteDiscipulos(character)}).`;
  return null;
}

/** Um jovem que quer ser seu discípulo: quanto maior sua fama, mais talentosos os que batem à porta. */
export function gerarCandidatoDiscipulo(character: Character): Relacao {
  const bonusFama = Math.min(3, Math.floor(character.reputacao / 60));
  return {
    id: Math.random().toString(36).slice(2, 10),
    nome: gerarNomePessoa(),
    tipo: 'Discípulo',
    idade: inteiro(12, 17),
    rank: 1,
    estagio: inteiro(1, 3),
    aparencia: inteiro(30, 100),
    inteligencia: inteiro(30, 100),
    compatibilidadeElemental: compatibilidade(character),
    relacao: 45,
    raizGrau: Math.min(9, inteiro(1, 4) + bonusFama + (chance(0.1) ? 2 : 0)),
  };
}

export function aceitarDiscipulo(character: Character, candidato: Relacao): string {
  const bloqueio = bloqueioBuscarDiscipulo(character);
  if (bloqueio) return bloqueio;
  character.relacoes.push(candidato);
  return `${candidato.nome} se ajoelha e oferece chá: agora é seu discípulo. Ensine-o em Relações.`;
}

/** Um estágio a mais para o discípulo (nunca passa do reino do mestre). Rompendo um reino, o mestre ganha fama. */
function avancarDiscipulo(character: Character, r: Relacao, probabilidade: number): string | null {
  if (!chance(probabilidade)) return null;
  const ultimo = r.estagio >= estagiosDoRank(r.rank);
  if (ultimo && r.rank + 1 >= character.cultivo.rank) return null;
  if (!ultimo) {
    r.estagio += 1;
    return null;
  }
  r.rank += 1;
  r.estagio = 1;
  character.reputacao += 3;
  return `Seu discípulo ${r.nome} rompeu para o ${descreverCultivo(r.rank, 1).split(' — ')[0]}. Seu nome como mestre cresce (reputação +3).`;
}

/** Cada Companheiro(a) de Dao acelera o cultivo passivo em +10% (até +30%). */
export function bonusCultivoRelacoes(character: Character): number {
  return Math.min(0.3, character.relacoes.filter((r) => r.tipo === 'Companheiro(a) de Dao').length * 0.1);
}
