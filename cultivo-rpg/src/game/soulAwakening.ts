import type { Character } from './character';
import type { Efeitos } from './effects';
import { escolherPonderado } from './rng';

/**
 * Despertar da Alma: quem nasce com o traço Alma Antiga (uma alma de outra era) ou Herança Escondida
 * (o sangue de quem deixou as pedras no berço) pode, num evento aleatório ou à beira da morte,
 * despertar quem foi — ou de quem descende. A raiz espiritual é rolada de novo, no mínimo de grau 3.
 */
export const TRACOS_QUE_DESPERTAM = ['alma-antiga', 'heranca-escondida'];
export const GRAU_MINIMO_DESPERTAR = 3;

export interface IdentidadeAntiga {
  id: string;
  titulo: string;
  lembranca: string;
  recompensa: Efeitos;
  textoRecompensa: string;
  /** Peso no sorteio: demoníacas pesam mais para quem já anda nesse caminho. */
  demoniaca?: boolean;
}

export const IDENTIDADES: IdentidadeAntiga[] = [
  {
    id: 'deus-alquimia',
    titulo: 'Deus da Alquimia e das Pílulas',
    lembranca: 'Mil fornalhas acesas ao mesmo tempo, e você andando entre elas como quem passeia num jardim. Reis se ajoelhavam por uma única pílula sua.',
    recompensa: { aprenderProfissao: 'alquimia', xpProfissao: { alquimia: 600 }, atributos: { inteligencia: 2 }, itens: [{ id: 'pilula-dourada', quantidade: 2 }] },
    textoRecompensa: 'Alquimia (+600 xp), +2 Inteligência e 2 Pílulas Douradas',
  },
  {
    id: 'soberano-ceu-terra',
    titulo: 'Soberano do Céu e da Terra',
    lembranca: 'Um trono acima das nuvens. As leis do céu e da terra obedeciam à sua voz, e as Nove Seitas Supremas mandavam tributo.',
    recompensa: { atributos: { forca: 1, destreza: 1, inteligencia: 1, constituicao: 1, espirito: 1, sorte: 1 }, progresso: 200, reputacao: 20 },
    textoRecompensa: '+1 em todos os atributos, um grande avanço de cultivo e reputação +20',
  },
  {
    id: 'demonio-supremo',
    titulo: 'Demônio Supremo',
    lembranca: 'Cidades em chamas, e o seu riso por cima dos gritos. Três Seitas Supremas se uniram para selar você — e mesmo assim precisaram de mil anos.',
    recompensa: { atributos: { forca: 2, espirito: 2 }, aprenderTecnica: 'devorar-almas', alinhamento: -40 },
    textoRecompensa: '+2 Força, +2 Espírito, a Arte Proibida de Devorar Almas — e −40 de alinhamento',
    demoniaca: true,
  },
  {
    id: 'santo-da-espada',
    titulo: 'Santo da Espada',
    lembranca: 'Uma única espada contra um exército. Quando você embainhou a lâmina, a montanha atrás deles se partiu em dois.',
    recompensa: { aprenderEstilo: 'espada', xpEstilo: { espada: 400 }, atributos: { destreza: 2, forca: 1 } },
    textoRecompensa: 'o Caminho da Espada (+400 xp), +2 Destreza e +1 Força',
  },
  {
    id: 'senhor-mil-bestas',
    titulo: 'Senhor das Mil Bestas',
    lembranca: 'Um rugido que vinha de mil gargantas ao mesmo tempo: dragões, fênix e kirins ajoelhados ao seu redor.',
    recompensa: { aprenderProfissao: 'domador', xpProfissao: { domador: 400 }, atributos: { espirito: 2 }, flags: { ovoBestaAncestral: true } },
    textoRecompensa: 'Domador de Bestas (+400 xp), +2 Espírito e um ovo de besta lendária que vai chocar em breve',
  },
  {
    id: 'grao-mestre-talismas',
    titulo: 'Grão-Mestre dos Talismãs',
    lembranca: 'Um único traço de pincel, e o céu inteiro virava uma formação. Seitas pagavam fortunas por um papel com a sua tinta.',
    recompensa: { aprenderProfissao: 'inscricao', xpProfissao: { inscricao: 500 }, atributos: { inteligencia: 1, espirito: 1 } },
    textoRecompensa: 'Inscrição (+500 xp), +1 Inteligência e +1 Espírito',
  },
  {
    id: 'oraculo',
    titulo: 'Oráculo do Destino',
    lembranca: 'Você via os fios do destino de cada pessoa como teias ao sol. Imperadores não declaravam guerra sem antes ouvir você.',
    recompensa: { aprenderProfissao: 'adivinhacao', xpProfissao: { adivinhacao: 400 }, atributos: { espirito: 2, sorte: 2 } },
    textoRecompensa: 'Divinação (+400 xp), +2 Espírito e +2 Sorte',
  },
];

export function podeDespertar(character: Character): boolean {
  return TRACOS_QUE_DESPERTAM.includes(character.traco.id) && !character.flags.almaDespertada;
}

export function sortearIdentidade(character: Character): IdentidadeAntiga {
  const demoniaco = character.alinhamento.valor <= -40;
  return escolherPonderado(IDENTIDADES.map((i) => ({ valor: i, peso: i.demoniaca ? (demoniaco ? 4 : 0.6) : 1 })));
}

export function getIdentidade(id: string | undefined): IdentidadeAntiga | undefined {
  return IDENTIDADES.find((i) => i.id === id);
}
