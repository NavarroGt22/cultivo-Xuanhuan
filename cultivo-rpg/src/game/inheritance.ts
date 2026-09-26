import type { Efeitos } from './effects';
import type { Character } from './character';
import { TECNICAS, idManual } from './techniques';
import { EQUIPMENT_CATALOG } from './equipment';
import { chance, escolher, percentilComSorte } from './rng';

/**
 * Heranças: legados de lendas antigas (GDD 6 — Túmulo Ancestral / eco de memória).
 * Encontradas por sorte (evento raro) ou seladas no berço (pingente que desperta aos 16).
 */
export interface Heranca {
  id: string;
  nome: string;
  dono: string;
  descricao: string;
  recompensa: Efeitos;
  textoRecompensa: string;
}

export const HERANCAS: Heranca[] = [
  {
    id: 'imperador-estelar',
    nome: 'Herança do Imperador Estelar',
    dono: 'Imperador Estelar Tian Xuan, Martial Emperor da Era Dourada',
    descricao: 'Um imperador que dizem ter comprimido a luz de sete estrelas no próprio dantian.',
    recompensa: {
      itens: [
        { id: idManual('sutra-imperador-estelar'), quantidade: 1 },
        { id: idManual('punho-imperador-estelar'), quantidade: 1 },
      ],
      reputacao: 10,
    },
    textoRecompensa: 'Manuais de Grau Divino: Sutra do Imperador Estelar e Punho do Imperador Estelar',
  },
  {
    id: 'rainha-fenix',
    nome: 'Herança da Rainha Fênix',
    dono: 'Rainha Fênix Hua Ling, que renasceu três vezes das próprias cinzas',
    descricao: 'Uma cultivadora de fogo cuja chama não se apagou nem com a morte.',
    recompensa: {
      itens: [{ id: idManual('chama-renascente'), quantidade: 1 }, { id: 'pilula-dourada', quantidade: 2 }],
      atributos: { constituicao: 1, espirito: 1 },
    },
    textoRecompensa: 'Manual de Grau Céu: Chama Renascente da Fênix, 2 Pílulas Douradas e +1 CON/ESP',
  },
  {
    id: 'deus-alquimia',
    nome: 'Herança do Deus da Alquimia',
    dono: 'Yao Chen, o último Alchemy God antes do Cataclismo',
    descricao: 'O caldeirão dele ainda guarda o calor de mil anos de chama espiritual.',
    recompensa: {
      aprenderProfissao: 'alquimia',
      xpProfissao: { alquimia: 400 },
      itens: [{ id: 'pilula-dourada', quantidade: 3 }],
      atributos: { inteligencia: 2 },
    },
    textoRecompensa: 'Alquimia (+400 xp), 3 Pílulas Douradas e +2 INT',
  },
  {
    id: 'mestre-mil-bestas',
    nome: 'Herança do Mestre das Mil Bestas',
    dono: 'Mo Lang, cujo exército de bestas enfrentou um Sovereign',
    descricao: 'O rugido de mil bestas ainda ecoa nas paredes do túmulo.',
    recompensa: {
      aprenderProfissao: 'domador',
      xpProfissao: { domador: 300 },
      atributos: { espirito: 2 },
      flags: { ovoBestaAncestral: true },
    },
    textoRecompensa: 'Domador de Bestas (+300 xp), +2 ESP e um ovo de besta espiritual',
  },
  {
    id: 'sabio-espada',
    nome: 'Herança do Sábio da Espada',
    dono: 'Jian Wuya, o Sábio da Espada, que partiu uma montanha ao meio',
    descricao: 'Mil marcas de espada cobrem as paredes do túmulo — cada uma, uma lição.',
    recompensa: {
      itens: [{ id: idManual('espada-mil-ventos'), quantidade: 1 }],
      equipamentos: ['espada-sabio'],
      aprenderEstilo: 'espada',
      xpEstilo: { espada: 200 },
    },
    textoRecompensa: 'Manual de Grau Céu: Espada dos Mil Ventos, a Espada do Sábio (4º grau) e o Caminho da Espada',
  },
  {
    id: 'dragao-ancestral',
    nome: 'Herança do Dragão Ancestral',
    dono: 'Um Dragão Ancestral que tomou forma humana na Era Dourada',
    descricao: 'Um osso de dragão do tamanho de uma casa pulsa como se ainda estivesse vivo.',
    recompensa: {
      itens: [{ id: idManual('medula-dragao'), quantidade: 1 }],
      despertarCorpo: true,
      atributos: { forca: 1, constituicao: 2 },
    },
    textoRecompensa: 'Manual de Grau Céu: Medula do Dragão Ancestral, +1 FOR, +2 CON e, se você não tiver, uma Constituição Especial',
  },
  {
    id: 'rei-demoniaco',
    nome: 'Herança do Rei Demoníaco',
    dono: 'Mo Xie, Rei Demoníaco que devorou três seitas inteiras',
    descricao: 'O ar do túmulo é pesado de sangue antigo. Algo sussurra promessas.',
    recompensa: {
      itens: [{ id: idManual('devorar-almas'), quantidade: 1 }],
      atributos: { forca: 2, espirito: 2 },
      alinhamento: -30,
    },
    textoRecompensa: 'Arte Proibida de Devorar Almas, +2 FOR, +2 ESP — e −30 de alinhamento',
  },
  {
    id: 'nove-sois',
    nome: 'Herança dos Nove Sóis',
    dono: 'Xi He, a Imperatriz dos Nove Sóis',
    descricao: 'Nove orbes de luz giram sobre um trono vazio.',
    recompensa: {
      itens: [{ id: idManual('metodo-nove-sois'), quantidade: 1 }],
      progresso: 150,
    },
    textoRecompensa: 'Manual de Grau Céu: Método dos Nove Sóis (cultivo ×1,6) e um grande avanço de cultivo',
  },
  {
    id: 'forja-celestial',
    nome: 'Herança da Forja Celestial',
    dono: 'Ou Yezi, o último Grão-Mestre Refinador da Era Dourada',
    descricao: 'Uma bigorna de metal estelar ainda está quente depois de milênios.',
    recompensa: {
      aprenderProfissao: 'refinador',
      xpProfissao: { refinador: 350 },
      itens: [{ id: 'minerio-estelar', quantidade: 5 }, { id: 'nucleo-besta', quantidade: 3 }],
      atributos: { forca: 1, inteligencia: 1 },
    },
    textoRecompensa: 'Mestre Refinador (+350 xp), 5 Minérios Estelares, 3 Núcleos de Besta, +1 FOR, +1 INT',
  },
];

export function getHeranca(id: string): Heranca | undefined {
  return HERANCAS.find((h) => h.id === id);
}

// ---------------------------------------------------------------------------
// Rolagem de Herança (GDD 12): Sorte contra a escala Bronze → Lendário.
// ---------------------------------------------------------------------------

export type TierHeranca = 'Bronze' | 'Prata' | 'Ouro' | 'Ouro Negro' | 'Lendário';

/** Mesmo com Sorte baixa o Lendário nunca tem chance zero (~0,4% no pior caso). */
export function rolarTierHeranca(sorte: number): TierHeranca {
  const p = percentilComSorte(sorte);
  if (p >= 99.5) return 'Lendário';
  if (p >= 97.5) return 'Ouro Negro';
  if (p >= 90) return 'Ouro';
  if (p >= 65) return 'Prata';
  return 'Bronze';
}

export interface AchadoHeranca {
  tier: TierHeranca;
  texto: string;
  efeitos: Efeitos;
}

function manualNaoConhecido(character: Character, filtro: (grau: number, heranca: boolean, proibida: boolean) => boolean): string | null {
  const opcoes = TECNICAS.filter(
    (t) => filtro(t.grau, Boolean(t.heranca), t.categoria === 'proibida') && !character.tecnicas.includes(t.id),
  );
  return opcoes.length ? escolher(opcoes).id : null;
}

export function achadoDeHeranca(character: Character, tier: TierHeranca): AchadoHeranca {
  switch (tier) {
    case 'Bronze':
      return {
        tier,
        texto: 'Um saquinho esquecido por algum viajante: ervas e pílulas comuns.',
        efeitos: chance(0.5) ? { itens: [{ id: 'erva-espiritual', quantidade: 2 }] } : { itens: [{ id: 'pilula-cura', quantidade: 2 }] },
      };
    case 'Prata': {
      const manual = manualNaoConhecido(character, (grau, heranca, proibida) => grau >= 2 && grau <= 3 && !heranca && !proibida);
      return manual
        ? { tier, texto: 'Entre pedras soltas, um manual esquecido de Grau Xuan/Terra.', efeitos: { itens: [{ id: idManual(manual), quantidade: 1 }] } }
        : { tier, texto: 'Um frasco antigo, ainda selado.', efeitos: { itens: [{ id: 'pilula-dourada', quantidade: 1 }] } };
    }
    case 'Ouro': {
      if ((character.flags.nucleoRachado || character.flags.sequela) && chance(0.6)) {
        return { tier, texto: 'Num frasco de jade intacto: uma Pílula da Medula Celestial — exatamente o que seu corpo ferido precisava.', efeitos: { itens: [{ id: 'pilula-medula-celestial', quantidade: 1 }] } };
      }
      const manual = manualNaoConhecido(character, (grau, heranca) => grau === 4 && !heranca);
      if (manual && chance(0.5)) {
        return { tier, texto: 'Gravado em osso, um manual de Grau Céu — pulsando com uma energia perigosa.', efeitos: { itens: [{ id: idManual(manual), quantidade: 1 }] } };
      }
      const possuidos = new Set([...character.equipamentos, ...character.inventario.equipamentos].map((e) => e.id));
      const artefatos = EQUIPMENT_CATALOG.filter((e) => e.grau >= 2 && !possuidos.has(e.id));
      return {
        tier,
        texto: 'Um fragmento de artefato antigo, ainda capaz de canalizar energia.',
        efeitos: artefatos.length ? { equipamentos: [escolher(artefatos).id], pedras: 20 } : { itens: [{ id: 'pilula-dourada', quantidade: 2 }] },
      };
    }
    case 'Ouro Negro': {
      const jaTemHeranca = HERANCAS.some((h) => character.flags[`heranca:${h.id}`]);
      const restantes = HERANCAS.filter((h) => !character.flags[`heranca:${h.id}`]);
      if (restantes.length && !jaTemHeranca) {
        const heranca = escolher(restantes);
        return { tier, texto: `O legado de uma lenda: ${heranca.nome}.`, efeitos: { heranca: heranca.id } };
      }
      return { tier, texto: 'Um tesouro de clã extinto.', efeitos: { pedras: 150, itens: [{ id: 'pilula-dourada', quantidade: 2 }] } };
    }
    case 'Lendário': {
      if (!character.origem.corpoEspecial) {
        return { tier, texto: 'Algo desperta no seu sangue. Seu corpo muda para sempre: uma Constituição Especial!', efeitos: { despertarCorpo: true } };
      }
      const divino = manualNaoConhecido(character, (grau) => grau === 5);
      return divino
        ? { tier, texto: 'Um manual de Grau Divino, completo — algo que não se vê há milênios.', efeitos: { itens: [{ id: idManual(divino), quantidade: 1 }], reputacao: 20 } }
        : { tier, texto: 'Uma veia espiritual inteira se abre sob seus pés.', efeitos: { progresso: 200, reputacao: 20 } };
    }
  }
}
