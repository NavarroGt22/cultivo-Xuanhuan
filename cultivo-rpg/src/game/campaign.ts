import type { Character } from './character';
import { Efeitos, aplicarEfeitos } from './effects';
import { ESTILO_IDS } from './martialStyles';
import { posicaoJogador } from './rankings';
import { ehDiscipulo, indicePosto } from './sect';
import { idManual } from './techniques';
import { MundoState } from './worldState';

export interface ObjetivoCampanha {
  id: string;
  arco: string;
  titulo: string;
  descricao: string;
  concluido: (character: Character, mundo: MundoState) => boolean;
  recompensa: Efeitos;
  textoRecompensa: string;
}

/** Campanha principal, em arcos. Cada objetivo só aparece depois de resgatar o anterior. */
export const CAMPANHA: ObjetivoCampanha[] = [
  {
    id: 'primeiros-passos',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'Primeiros Passos',
    descricao: 'Alcance o Estágio 3 do Martial Apprentice.',
    concluido: (c) => c.cultivo.rank > 1 || c.cultivo.estagio >= 3,
    recompensa: { pedras: 10 },
    textoRecompensa: '10 pedras espirituais',
  },
  {
    id: 'primeira-tecnica',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'Uma Técnica Própria',
    descricao: 'Aprenda sua primeira técnica marcial (pavilhões, mercadores, ruínas).',
    concluido: (c) => c.tecnicas.length >= 1,
    recompensa: { itens: [{ id: 'pilula-chakra', quantidade: 2 }] },
    textoRecompensa: '2 Pílulas de Reunião de Chakra',
  },
  {
    id: 'sob-uma-bandeira',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'Sob uma Bandeira',
    descricao: 'Torne-se discípulo de uma seita ou arrume uma ocupação.',
    concluido: (c) => ehDiscipulo(c) || Boolean(c.ocupacao),
    recompensa: { pedras: 15, reputacao: 5 },
    textoRecompensa: '15 pedras e +5 de reputação',
  },
  {
    id: 'condensar-star',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'Condensar a Star',
    descricao: 'Rompa para o First Origin Realm.',
    concluido: (c) => c.cultivo.rank >= 2,
    recompensa: { itens: [{ id: idManual('passos-nuvem'), quantidade: 1 }] },
    textoRecompensa: 'Manual: Passos da Nuvem Errante',
  },
  {
    id: 'talento-top10',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'Um Nome entre os Talentos',
    descricao: 'Entre no Top 10 dos maiores talentos da sua região.',
    concluido: (c, m) => {
      const posicao = posicaoJogador(m, c, 'talento');
      return posicao > 0 && posicao <= 10;
    },
    recompensa: { itens: [{ id: 'pilula-dourada', quantidade: 1 }], reputacao: 10 },
    textoRecompensa: 'Pílula Dourada Universal e +10 de reputação',
  },
  {
    id: 'superar-rival',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'Superar o Rival',
    descricao: 'Vença seu rival três vezes.',
    concluido: (c) => Number(c.flags.vitoriasRival ?? 0) >= 3,
    recompensa: { reputacao: 10, pedras: 20 },
    textoRecompensa: '20 pedras e +10 de reputação',
  },
  {
    id: 'talento-1',
    arco: 'Arco 1 — O Dragão Adormecido',
    titulo: 'O Maior Talento da Geração',
    descricao: 'Seja o nº 1 do ranking de talentos da sua região.',
    concluido: (c, m) => posicaoJogador(m, c, 'talento') === 1,
    recompensa: { equipamentos: ['colete-escamas'], pedras: 50, reputacao: 15 },
    textoRecompensa: 'Colete de Escamas de Serpente, 50 pedras e +15 de reputação',
  },
  {
    id: 'two-force',
    arco: 'Arco 2 — Ascensão Regional',
    titulo: 'Duas Forças',
    descricao: 'Rompa para o Two Force Realm.',
    concluido: (c) => c.cultivo.rank >= 3,
    recompensa: { pedras: 60 },
    textoRecompensa: '60 pedras espirituais',
  },
  {
    id: 'forca-top10',
    arco: 'Arco 2 — Ascensão Regional',
    titulo: 'Entre os Fortes',
    descricao: 'Entre no Top 10 dos cultivadores mais fortes da sua região.',
    concluido: (c, m) => {
      const posicao = posicaoJogador(m, c, 'forca');
      return posicao > 0 && posicao <= 10;
    },
    recompensa: { reputacao: 20 },
    textoRecompensa: '+20 de reputação',
  },
  {
    id: 'mestre-estilo',
    arco: 'Arco 2 — Ascensão Regional',
    titulo: 'Mestre de um Estilo',
    descricao: 'Alcance a maestria Mestre em qualquer estilo marcial.',
    concluido: (c) => ESTILO_IDS.some((id) => c.estilos[id].nivel >= 4),
    recompensa: { itens: [{ id: idManual('escudo-qi-dourado'), quantidade: 1 }] },
    textoRecompensa: 'Manual: Escudo de Qi Dourado',
  },
  {
    id: 'posto-alto',
    arco: 'Arco 2 — Ascensão Regional',
    titulo: 'Posição de Respeito',
    descricao: 'Torne-se Discípulo Núcleo, ou chegue ao 4º cargo de uma carreira.',
    concluido: (c) => (ehDiscipulo(c) && indicePosto(c) >= 2) || (c.ocupacao?.cargo ?? 0) >= 3,
    recompensa: { pedras: 100 },
    textoRecompensa: '100 pedras espirituais',
  },
  {
    id: 'three-power',
    arco: 'Arco 2 — Ascensão Regional',
    titulo: 'Três Poderes',
    descricao: 'Rompa para o Three Power Realm.',
    concluido: (c) => c.cultivo.rank >= 4,
    recompensa: { itens: [{ id: 'pilula-dourada', quantidade: 2 }] },
    textoRecompensa: '2 Pílulas Douradas Universais',
  },
  {
    id: 'forca-1',
    arco: 'Arco 2 — Ascensão Regional',
    titulo: 'O Mais Forte da Região',
    descricao: 'Seja o nº 1 do ranking de força da sua região.',
    concluido: (c, m) => posicaoJogador(m, c, 'forca') === 1,
    recompensa: { reputacao: 50, pedras: 200 },
    textoRecompensa: '200 pedras e +50 de reputação',
  },
  {
    id: 'rumo-ao-centro',
    arco: 'Arco 3 — O Coração do Mundo',
    titulo: 'Rumo à Planície Central',
    descricao: 'Viaje para a Planície Central, onde estão as seitas e famílias mais poderosas do mundo.',
    concluido: (c) => c.local.regiao === 'central',
    recompensa: { pedras: 100 },
    textoRecompensa: '100 pedras espirituais',
  },
  {
    id: 'heranca-lendaria',
    arco: 'Arco 3 — O Coração do Mundo',
    titulo: 'O Legado de uma Lenda',
    descricao: 'Receba uma herança de um cultivador lendário (túmulos ancestrais, pingentes selados…).',
    concluido: (c) => Object.keys(c.flags).some((k) => k.startsWith('heranca:')),
    recompensa: { itens: [{ id: 'pilula-dourada', quantidade: 2 }], reputacao: 15 },
    textoRecompensa: '2 Pílulas Douradas e +15 de reputação',
  },
  {
    id: 'four-guardians',
    arco: 'Arco 3 — O Coração do Mundo',
    titulo: 'Quatro Guardiões',
    descricao: 'Rompa para o Four Guardians Realm (Martial Lord).',
    concluido: (c) => c.cultivo.rank >= 5,
    recompensa: { pedras: 300 },
    textoRecompensa: '300 pedras espirituais',
  },
  {
    id: 'centro-top10',
    arco: 'Arco 3 — O Coração do Mundo',
    titulo: 'Entre os Fortes do Centro',
    descricao: 'Entre no Top 10 de força da Planície Central.',
    concluido: (c, m) => {
      if (c.local.regiao !== 'central') return false;
      const posicao = posicaoJogador(m, c, 'forca');
      return posicao > 0 && posicao <= 10;
    },
    recompensa: { reputacao: 40 },
    textoRecompensa: '+40 de reputação',
  },
  {
    id: 'martial-king',
    arco: 'Arco 3 — O Coração do Mundo',
    titulo: 'Rei Marcial',
    descricao: 'Rompa para o Five Elements Realm (Martial King).',
    concluido: (c) => c.cultivo.rank >= 6,
    recompensa: { reputacao: 80, pedras: 500 },
    textoRecompensa: '500 pedras e +80 de reputação — continua no próximo arco',
  },
];

export type StatusObjetivo = 'resgatado' | 'concluido' | 'em-andamento' | 'bloqueado';

export function estadoCampanha(character: Character, mundo: MundoState): { objetivo: ObjetivoCampanha; status: StatusObjetivo }[] {
  let atualEncontrado = false;
  return CAMPANHA.map((objetivo) => {
    if (mundo.campanhaResgatada.includes(objetivo.id)) return { objetivo, status: 'resgatado' as const };
    if (atualEncontrado) return { objetivo, status: 'bloqueado' as const };
    atualEncontrado = true;
    return { objetivo, status: objetivo.concluido(character, mundo) ? ('concluido' as const) : ('em-andamento' as const) };
  });
}

export function resgatarObjetivo(character: Character, mundo: MundoState, id: string): string[] {
  const item = estadoCampanha(character, mundo).find((e) => e.objetivo.id === id);
  if (!item || item.status !== 'concluido') return [];
  mundo.campanhaResgatada.push(id);
  return [`Objetivo concluído: ${item.objetivo.titulo}!`, ...aplicarEfeitos(character, item.objetivo.recompensa)];
}
