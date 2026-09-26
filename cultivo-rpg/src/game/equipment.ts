import { Attributes } from './attributes';

export type EquipmentType = 'arma' | 'armadura' | 'acessorio';

export const NOME_TIPO_EQUIPAMENTO: Record<EquipmentType, string> = {
  arma: 'Arma',
  armadura: 'Armadura',
  acessorio: 'Acessório',
};

export interface Equipment {
  id: string;
  nome: string;
  tipo: EquipmentType;
  /** Grau de Profound Artifact (1º ao 9º), ver GDD seção 5. */
  grau: number;
  descricao: string;
  bonusAtributos: Partial<Attributes>;
  /** Qualidade universal (Bronze → Lendário) de peças forjadas. */
  qualidade?: string;
}

export const EQUIPMENT_CATALOG: Equipment[] = [
  {
    id: 'espada-ferro',
    nome: 'Espada de Ferro Refinado',
    tipo: 'arma',
    grau: 1,
    descricao: 'Lâmina simples, forjada por um ferreiro de vila.',
    bonusAtributos: { forca: 1 },
  },
  {
    id: 'faixas-ferro',
    nome: 'Faixas de Couro com Placas de Ferro',
    tipo: 'arma',
    grau: 1,
    descricao: 'Envolvem os punhos e antebraços. Preferidas por quem luta de mãos nuas.',
    bonusAtributos: { forca: 1, constituicao: 1 },
  },
  {
    id: 'adagas-gemeas',
    nome: 'Adagas Gêmeas de Aço Negro',
    tipo: 'arma',
    grau: 1,
    descricao: 'Leves e rápidas. Feitas para quem prefere não ser visto chegando.',
    bonusAtributos: { destreza: 1, sorte: 1 },
  },
  {
    id: 'leque-ferro',
    nome: 'Leque de Varetas de Ferro',
    tipo: 'arma',
    grau: 1,
    descricao: 'Parece um adorno de erudito até se fechar contra a garganta de alguém.',
    bonusAtributos: { inteligencia: 1, destreza: 1 },
  },
  {
    id: 'lanca-besta',
    nome: 'Lança de Osso de Besta',
    tipo: 'arma',
    grau: 2,
    descricao: 'Esculpida do fêmur de uma besta espiritual. Ainda guarda um pouco de sua fúria.',
    bonusAtributos: { forca: 2, constituicao: 1 },
  },
  {
    id: 'colete-escamas',
    nome: 'Colete de Escamas de Serpente',
    tipo: 'armadura',
    grau: 2,
    descricao: 'Flexível e resistente a lâminas comuns.',
    bonusAtributos: { constituicao: 2, destreza: 1 },
  },
  {
    id: 'anel-jade',
    nome: 'Anel de Jade do Espírito Calmo',
    tipo: 'acessorio',
    grau: 2,
    descricao: 'Esfria a mente durante a meditação.',
    bonusAtributos: { espirito: 2 },
  },
  {
    id: 'pincel-jade',
    nome: 'Pincel de Jade Rachado',
    tipo: 'arma',
    grau: 1,
    descricao: 'Pincel de inscrição antigo. A rachadura não impede que o qi flua pela ponta.',
    bonusAtributos: { inteligencia: 1, espirito: 1 },
  },
  {
    id: 'fornalha-bronze',
    nome: 'Fornalha de Bronze Portátil',
    tipo: 'acessorio',
    grau: 1,
    descricao: 'Caldeirão alquímico de 1ª Ordem, pequeno o suficiente para carregar nas costas.',
    bonusAtributos: { inteligencia: 1 },
  },
  {
    id: 'tunica-linho',
    nome: 'Túnica de Linho de Discípulo',
    tipo: 'armadura',
    grau: 1,
    descricao: 'Roupa de treino reforçada, comum entre discípulos externos.',
    bonusAtributos: { constituicao: 1 },
  },
  {
    id: 'manto-vento',
    nome: 'Manto do Vento Silencioso',
    tipo: 'armadura',
    grau: 2,
    descricao: 'Tecido leve que parece empurrar o corpo na direção do movimento.',
    bonusAtributos: { destreza: 2 },
  },
  {
    id: 'amuleto-fortuna',
    nome: 'Amuleto de Cobre da Boa Fortuna',
    tipo: 'acessorio',
    grau: 1,
    descricao: 'Vendido em qualquer feira. Talvez funcione, talvez não.',
    bonusAtributos: { sorte: 1 },
  },
];

/** Peças de 3º e 4º grau: torres, leilões, ruínas e heranças. */
EQUIPMENT_CATALOG.push(
  {
    id: 'lanca-trovao',
    nome: 'Lança do Trovão Rugidor',
    tipo: 'arma',
    grau: 3,
    descricao: 'A ponta faísca a cada estocada.',
    bonusAtributos: { forca: 3, constituicao: 1 },
  },
  {
    id: 'cajado-lua',
    nome: 'Cajado da Lua Fria',
    tipo: 'arma',
    grau: 3,
    descricao: 'Canaliza o qi como água sob o luar.',
    bonusAtributos: { espirito: 3, inteligencia: 1 },
  },
  {
    id: 'adagas-sombra',
    nome: 'Adagas da Sombra Sem Rosto',
    tipo: 'arma',
    grau: 3,
    descricao: 'Ninguém lembra de tê-las visto chegar.',
    bonusAtributos: { destreza: 3, sorte: 1 },
  },
  {
    id: 'armadura-escamas-dragao',
    nome: 'Armadura de Escamas de Dragão Menor',
    tipo: 'armadura',
    grau: 3,
    descricao: 'Escamas de um dragão jovem, trançadas com fios de ouro.',
    bonusAtributos: { constituicao: 3, forca: 1 },
  },
  {
    id: 'anel-sol',
    nome: 'Anel do Sol Nascente',
    tipo: 'acessorio',
    grau: 3,
    descricao: 'Aquece o dantian a cada amanhecer.',
    bonusAtributos: { espirito: 2, sorte: 2 },
  },
  {
    id: 'machado-montanha',
    nome: 'Machado Parte-Montanhas',
    tipo: 'arma',
    grau: 4,
    descricao: 'Pesado demais para mortais. Cada golpe faz o chão tremer.',
    bonusAtributos: { forca: 4, constituicao: 2 },
  },
  {
    id: 'arco-fenix',
    nome: 'Arco da Pena de Fênix',
    tipo: 'arma',
    grau: 4,
    descricao: 'A corda é uma pena de fênix trançada; as flechas saem em chamas.',
    bonusAtributos: { destreza: 4, espirito: 2 },
  },
  {
    id: 'manto-estrelas',
    nome: 'Manto das Mil Estrelas',
    tipo: 'armadura',
    grau: 4,
    descricao: 'Tecido com fios de luz estelar. Desvia golpes como o céu desvia cometas.',
    bonusAtributos: { constituicao: 3, destreza: 2, espirito: 1 },
  },
  {
    id: 'coroa-jade-imperial',
    nome: 'Coroa de Jade Imperial',
    tipo: 'acessorio',
    grau: 4,
    descricao: 'Usada por um imperador da Era Dourada. A mente de quem a veste não se abala.',
    bonusAtributos: { inteligencia: 3, espirito: 2, sorte: 1 },
  },
  {
    id: 'lamina-nove-dragoes',
    nome: 'Lâmina dos Nove Dragões',
    tipo: 'arma',
    grau: 5,
    descricao: 'Nove almas de dragão seladas no aço. Só se vende a quem o mundo já conhece.',
    bonusAtributos: { forca: 5, destreza: 3, espirito: 2 },
  },
  {
    id: 'armadura-kirin',
    nome: 'Armadura do Kirin Celestial',
    tipo: 'armadura',
    grau: 5,
    descricao: 'Escamas de kirin: nenhuma chama mundana as aquece.',
    bonusAtributos: { constituicao: 5, forca: 2, sorte: 2 },
  },
  {
    id: 'espada-sabio',
    nome: 'Espada do Sábio da Espada',
    tipo: 'arma',
    grau: 4,
    descricao: 'A espada que partiu uma montanha. Ainda reconhece o antigo dono.',
    bonusAtributos: { forca: 4, destreza: 2, espirito: 1 },
  },
);

export function getEquipment(id: string): Equipment | undefined {
  const item = EQUIPMENT_CATALOG.find((equipamento) => equipamento.id === id);
  return item ? { ...item, bonusAtributos: { ...item.bonusAtributos } } : undefined;
}
