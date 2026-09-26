import type { Character } from './character';
import { idadeAnos } from './character';
import { attributeCheck } from './dice';
import { addPedrasEspirituais } from './inventory';
import { descreverCultivo, gerarNpc } from './npcs';
import { ELEMENTOS_BASE, rollSpiritualRoot, grauRaizInfo } from './spiritualRoot';
import { gerarNomePessoa } from './world';
import { chance, inteiro } from './rng';
import { influenciaPessoal } from './influence';
import { doFamilia } from './world';

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
  | 'Vassalo';

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
  if (r.tipo === 'Filho(a)') {
    return `${Math.floor(r.idade)} anos · Raiz ${r.raizGrau} (${grauRaizInfo(r.raizGrau ?? 1).nome})`;
  }
  return `${Math.floor(r.idade)} anos · ${descreverCultivo(r.rank, r.estagio)} · Aparência ${r.aparencia} · Compat. elemental ${r.compatibilidadeElemental}`;
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
    id: 'conversar',
    rotulo: 'Conversar',
    bloqueio: () => null,
    executar: (_, r) => {
      const delta = inteiro(3, 8);
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
      const delta = inteiro(8, 15);
      ajustar(r, delta);
      return [`${r.nome} adora o presente. Relação +${delta}.`];
    },
  },
  {
    id: 'namorar',
    rotulo: 'Pedir em namoro',
    bloqueio: (c, r) =>
      ehFamilia(r) || ehParceiro(r) || r.tipo === 'Namorado(a)'
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
    bloqueio: (_, r) => (r.tipo !== 'Namorado(a)' ? 'Só com quem você namora' : r.relacao < 80 ? 'Requer relação 80' : null),
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
      !ehParceiro(r) ? 'Só com cônjuge ou Companheiro(a) de Dao' : idadeAnos(c) < 18 ? 'Requer 18 anos' : c.relacoes.filter((x) => x.tipo === 'Filho(a)').length >= 5 ? 'Máximo de 5 filhos' : null,
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
      for (const p of parceiros) ajustar(p, 10);
      return [`Um banquete com vinho espiritual e música. O clima no harém melhora: ${parceiros.map((p) => p.nome).join(', ')} (relação +10).`];
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
    bloqueio: (_, r) => (ehFamilia(r) || r.tipo === 'Ex' ? 'Não se aplica' : null),
    executar: (_, r) => {
      const eraParceiro = ehParceiro(r) || r.tipo === 'Namorado(a)';
      r.tipo = eraParceiro ? 'Ex' : 'Conhecido';
      r.relacao = Math.min(r.relacao, 20);
      return [eraParceiro ? `Você e ${r.nome} se separam.` : `Você se afasta de ${r.nome}.`];
    },
  },
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
      p.tipo = 'Ex';
      mensagens.push(`${p.nome} deixou você.`);
    }
  }
  return mensagens;
}

/** Cada Companheiro(a) de Dao acelera o cultivo passivo em +10% (até +30%). */
export function bonusCultivoRelacoes(character: Character): number {
  return Math.min(0.3, character.relacoes.filter((r) => r.tipo === 'Companheiro(a) de Dao').length * 0.1);
}
