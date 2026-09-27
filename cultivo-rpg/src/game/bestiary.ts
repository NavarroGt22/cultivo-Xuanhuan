import type { Elemento } from './spiritualRoot';
import type { RegiaoId } from './world';
import { escolherPonderado } from './rng';

/**
 * Bestiário (GDD 10): todas as espécies de bestas do jogo.
 * O poder de uma besta vem da própria linhagem e da idade — não do reino de quem a encontra.
 */
export type Linhagem = 'Comum' | 'Espiritual' | 'Demoníaca' | 'Divina' | 'Ancestral';
export type FaseBesta = 'Filhote' | 'Jovem' | 'Adulta' | 'Anciã';

export interface EspecieBesta {
  id: string;
  nome: string;
  /** Vazio = aparece em todas as regiões. */
  regioes: RegiaoId[];
  elemento?: Elemento;
  linhagem: Linhagem;
  /** Reinos (rank) dos adultos selvagens: [mínimo, máximo]. O máximo é o teto da espécie. */
  reinos: [number, number];
  /** Idade (anos) em que a besta se torna adulta. */
  maturidade: number;
  descricao: string;
}

export interface InfoLinhagem {
  /** Reino com que um filhote nasce ou sai do ovo. */
  rankNascimento: number;
  /** Multiplicador da velocidade de cultivo da besta. */
  ritmo: number;
  /** Peso de aparição na natureza. */
  raridade: number;
}

export const LINHAGENS: Record<Linhagem, InfoLinhagem> = {
  Comum: { rankNascimento: 1, ritmo: 0.7, raridade: 5 },
  Espiritual: { rankNascimento: 1, ritmo: 1, raridade: 4 },
  Demoníaca: { rankNascimento: 2, ritmo: 1.15, raridade: 2.5 },
  Divina: { rankNascimento: 3, ritmo: 1.35, raridade: 0.6 },
  Ancestral: { rankNascimento: 4, ritmo: 1.6, raridade: 0.15 },
};

/** Força em combate por fase de vida: um filhote de linhagem divina ainda é um filhote. */
export const FATOR_FASE: Record<FaseBesta, number> = { Filhote: 0.4, Jovem: 0.75, Adulta: 1, Anciã: 1.1 };

export const ESPECIES: EspecieBesta[] = [
  // Planície Central
  { id: 'coelho-jade', nome: 'Coelho de Jade', regioes: ['central'], elemento: 'madeira', linhagem: 'Comum', reinos: [1, 2], maturidade: 1, descricao: 'Pequeno e veloz; seus pelos brilham como jade ao luar.' },
  { id: 'tigre-nuvem-branca', nome: 'Tigre de Nuvem Branca', regioes: ['central'], elemento: 'metal', linhagem: 'Demoníaca', reinos: [3, 6], maturidade: 10, descricao: 'Caminha sobre nuvens baixas e ruge como trovão distante.' },
  { id: 'garca-nove-penas', nome: 'Garça Celestial de Nove Penas', regioes: ['central'], elemento: 'madeira', linhagem: 'Divina', reinos: [5, 8], maturidade: 20, descricao: 'Cada pena guarda um reino de cultivo; as nove juntas, um céu inteiro.' },
  { id: 'qilin-chifre-dourado', nome: 'Qilin de Chifre Dourado', regioes: ['central'], elemento: 'terra', linhagem: 'Divina', reinos: [6, 9], maturidade: 25, descricao: 'Aparece em eras de sábios. Onde pisa, a terra floresce.' },
  { id: 'kirin-ancestral', nome: 'Kirin Ancestral', regioes: ['central'], elemento: 'terra', linhagem: 'Ancestral', reinos: [9, 12], maturidade: 60, descricao: 'Viu o Cataclismo com os próprios olhos. Poucos o viram e viveram.' },

  // Norte Gelado
  { id: 'lobo-presas-gelo', nome: 'Lobo de Presas de Gelo', regioes: ['norte'], elemento: 'agua', linhagem: 'Espiritual', reinos: [1, 4], maturidade: 4, descricao: 'Caça em matilhas; a mordida congela o sangue.' },
  { id: 'aguia-tempestade', nome: 'Águia da Tempestade de Neve', regioes: ['norte'], elemento: 'metal', linhagem: 'Espiritual', reinos: [2, 5], maturidade: 5, descricao: 'Mergulha de dentro das nevascas, invisível até o último instante.' },
  { id: 'urso-armadura-glacial', nome: 'Urso de Armadura Glacial', regioes: ['norte'], elemento: 'agua', linhagem: 'Demoníaca', reinos: [3, 6], maturidade: 12, descricao: 'O gelo cresce sobre a pele como uma armadura viva.' },
  { id: 'mamute-gelo-eterno', nome: 'Mamute do Gelo Eterno', regioes: ['norte'], elemento: 'agua', linhagem: 'Divina', reinos: [6, 9], maturidade: 30, descricao: 'Uma montanha que anda. Clãs inteiros vivem à sombra de um só.' },
  { id: 'dragao-gelo-primordial', nome: 'Dragão de Gelo Primordial', regioes: ['norte'], elemento: 'agua', linhagem: 'Ancestral', reinos: [10, 13], maturidade: 80, descricao: 'Dorme sob o glaciar mais antigo. Quando respira, o inverno dura cem anos.' },

  // Sul
  { id: 'sapo-fogo-venenoso', nome: 'Sapo de Fogo Venenoso', regioes: ['sul'], elemento: 'fogo', linhagem: 'Comum', reinos: [1, 3], maturidade: 2, descricao: 'A pele queima e envenena ao mesmo tempo. Alquimistas pagam bem pelas glândulas.' },
  { id: 'serpente-escamas-jade', nome: 'Serpente de Escamas de Jade', regioes: ['sul'], elemento: 'madeira', linhagem: 'Espiritual', reinos: [1, 4], maturidade: 5, descricao: 'Troca de pele a cada estágio; a pele velha vale como pedra espiritual.' },
  { id: 'pantera-nevoa', nome: 'Pantera da Névoa', regioes: ['sul'], elemento: 'agua', linhagem: 'Demoníaca', reinos: [3, 6], maturidade: 8, descricao: 'Some na névoa dos pântanos e reaparece às suas costas.' },
  { id: 'serpente-nove-cabecas', nome: 'Serpente Divina de Nove Cabeças', regioes: ['sul'], elemento: 'agua', linhagem: 'Divina', reinos: [7, 10], maturidade: 30, descricao: 'Cada cabeça cospe um veneno diferente. Cortar uma faz nascer duas.' },
  { id: 'fenix-carmesim', nome: 'Fênix Carmesim', regioes: ['sul'], elemento: 'fogo', linhagem: 'Ancestral', reinos: [9, 12], maturidade: 50, descricao: 'Renasce das próprias cinzas. Os vulcões do Sul são seus ninhos.' },

  // Leste
  { id: 'macaco-vento-prateado', nome: 'Macaco de Vento Prateado', regioes: ['leste'], elemento: 'madeira', linhagem: 'Espiritual', reinos: [1, 4], maturidade: 3, descricao: 'Rouba frutos espirituais dos jardins das seitas e ri de quem o persegue.' },
  { id: 'tartaruga-coral', nome: 'Tartaruga de Carapaça de Coral', regioes: ['leste'], elemento: 'agua', linhagem: 'Espiritual', reinos: [2, 5], maturidade: 8, descricao: 'Lenta, paciente e quase impossível de ferir.' },
  { id: 'tubarao-chifre', nome: 'Tubarão de Chifre Espiritual', regioes: ['leste'], elemento: 'agua', linhagem: 'Demoníaca', reinos: [3, 7], maturidade: 10, descricao: 'O chifre fareja qi a léguas de distância no mar aberto.' },
  { id: 'carpa-portao-dragao', nome: 'Carpa Dourada do Portão do Dragão', regioes: ['leste'], elemento: 'agua', linhagem: 'Divina', reinos: [4, 8], maturidade: 15, descricao: 'Diz a lenda que, ao saltar a cachoeira do Portão, vira dragão.' },
  { id: 'dragao-azul', nome: 'Dragão Azul do Leste', regioes: ['leste'], elemento: 'madeira', linhagem: 'Ancestral', reinos: [10, 13], maturidade: 70, descricao: 'Senhor das chuvas e das marés. As seitas do Leste ainda lhe oferecem incenso.' },

  // Oeste
  { id: 'camelo-duas-almas', nome: 'Camelo de Duas Almas', regioes: ['oeste'], elemento: 'terra', linhagem: 'Comum', reinos: [1, 3], maturidade: 3, descricao: 'Uma alma carrega o peso; a outra, a memória do caminho.' },
  { id: 'escorpiao-areia-dourada', nome: 'Escorpião de Areia Dourada', regioes: ['oeste'], elemento: 'terra', linhagem: 'Espiritual', reinos: [1, 4], maturidade: 3, descricao: 'Enterra-se nas dunas e espera dias pela presa certa.' },
  { id: 'falcao-sol-poente', nome: 'Falcão do Sol Poente', regioes: ['oeste'], elemento: 'fogo', linhagem: 'Demoníaca', reinos: [3, 6], maturidade: 8, descricao: 'Voa na direção do sol e ataca com a luz nas costas.' },
  { id: 'leao-dourado', nome: 'Leão Dourado do Deserto', regioes: ['oeste'], elemento: 'metal', linhagem: 'Divina', reinos: [5, 8], maturidade: 20, descricao: 'A juba é de metal vivo. O rugido derruba muralhas.' },
  { id: 'verme-devorador', nome: 'Verme Devorador de Mundos', regioes: ['oeste'], elemento: 'terra', linhagem: 'Ancestral', reinos: [10, 13], maturidade: 90, descricao: 'Cidades inteiras do Oeste sumiram sob as areias quando ele passou.' },

  // Todas as regiões
  { id: 'lobo-cinzento', nome: 'Lobo Cinzento', regioes: [], elemento: 'terra', linhagem: 'Comum', reinos: [1, 2], maturidade: 2, descricao: 'O lobo das estradas e dos contos de camponeses.' },
  { id: 'cavalo-espiritual', nome: 'Cavalo Espiritual', regioes: [], elemento: 'fogo', linhagem: 'Comum', reinos: [1, 3], maturidade: 3, descricao: 'Criado nos estábulos dos clãs; nunca se cansa.' },
  { id: 'corvo-tres-olhos', nome: 'Corvo de Três Olhos', regioes: [], elemento: 'metal', linhagem: 'Espiritual', reinos: [1, 4], maturidade: 3, descricao: 'O terceiro olho vê o qi. Adivinhos o tratam como mensageiro.' },
];

export function getEspecie(id: string | undefined): EspecieBesta | undefined {
  return ESPECIES.find((e) => e.id === id);
}

/** Saves antigos só guardam o nome da espécie ("Lobo de Presas de Gelo (filhote)"). */
export function especieDoNome(nome: string): EspecieBesta | undefined {
  const limpo = nome.replace(/ \(filhote\)$/, '').replace(/ de Sangue Ancestral$/, '');
  return ESPECIES.find((e) => e.nome === limpo);
}

export function especiesDaRegiao(regiao: RegiaoId): EspecieBesta[] {
  return ESPECIES.filter((e) => e.regioes.length === 0 || e.regioes.includes(regiao));
}

export function rankNascimento(especie: EspecieBesta): number {
  return Math.min(especie.reinos[0], LINHAGENS[especie.linhagem].rankNascimento);
}

export function faseDaIdade(especie: EspecieBesta | undefined, idadeAnos: number): FaseBesta {
  const maturidade = especie?.maturidade ?? 4;
  if (idadeAnos < maturidade * 0.3) return 'Filhote';
  if (idadeAnos < maturidade) return 'Jovem';
  if (idadeAnos < maturidade * 5) return 'Adulta';
  return 'Anciã';
}

/** Teto de reino em cada fase: filhotes não rompem reinos; o teto da espécie é o dos adultos mais fortes. */
export function rankMaximoDaFase(especie: EspecieBesta | undefined, fase: FaseBesta): number {
  if (!especie) return 13;
  const [minimo, maximo] = especie.reinos;
  switch (fase) {
    case 'Filhote':
      return rankNascimento(especie);
    case 'Jovem':
      return Math.max(rankNascimento(especie), minimo);
    case 'Adulta':
      return maximo;
    case 'Anciã':
      return Math.min(13, maximo + 1);
  }
}

/**
 * Espécie para um encontro na natureza: da região, com adultos no reino de quem encontra
 * (ou a mais próxima), e as linhagens raras aparecendo pouco.
 */
export function especieParaEncontro(regiao: RegiaoId, rank: number): EspecieBesta {
  const locais = especiesDaRegiao(regiao);
  const distancia = (e: EspecieBesta): number => (rank < e.reinos[0] ? e.reinos[0] - rank : rank > e.reinos[1] ? rank - e.reinos[1] : 0);
  const menor = Math.min(...locais.map(distancia));
  const candidatas = locais.filter((e) => distancia(e) <= menor + 1);
  return escolherPonderado(candidatas.map((e) => ({ valor: e, peso: LINHAGENS[e.linhagem].raridade / (1 + distancia(e) * 3) })));
}

/** Famílias de domadores criam bestas da própria região, de linhagem comum a demoníaca. */
export function especieParaFamilia(regiao: RegiaoId): EspecieBesta {
  const opcoes = especiesDaRegiao(regiao).filter((e) => e.linhagem !== 'Divina' && e.linhagem !== 'Ancestral');
  return escolherPonderado(opcoes.map((e) => ({ valor: e, peso: e.linhagem === 'Demoníaca' ? 1 : 3 })));
}

/** Ovos de herança: linhagem divina (às vezes ancestral), de preferência da região onde choca. */
export function especieDeOvo(regiao: RegiaoId): EspecieBesta {
  const lendarias = ESPECIES.filter((e) => e.linhagem === 'Divina' || e.linhagem === 'Ancestral');
  return escolherPonderado(
    lendarias.map((e) => ({ valor: e, peso: (e.regioes.includes(regiao) ? 3 : 1) * (e.linhagem === 'Ancestral' ? 0.35 : 1) })),
  );
}

/** Adultos selvagens ficam dentro da faixa da espécie. */
export function rankSelvagem(especie: EspecieBesta, rankDesejado: number): number {
  return Math.max(especie.reinos[0], Math.min(especie.reinos[1], rankDesejado));
}
