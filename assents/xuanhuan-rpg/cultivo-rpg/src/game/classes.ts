import { Attributes } from './attributes';

export interface CultivationClass {
  id: string;
  nome: string;
  descricao: string;
  bonusAtributos: Partial<Attributes>;
}

export const CLASSES: CultivationClass[] = [
  {
    id: 'punho-marcial',
    nome: 'Punho Marcial',
    descricao: 'Combatente que cultiva o corpo acima de tudo.',
    bonusAtributos: { forca: 3, constituicao: 2 },
  },
  {
    id: 'inscricionista',
    nome: 'Inscricionista',
    descricao: 'Estudioso de padrões, talismãs e formações.',
    bonusAtributos: { inteligencia: 3, espirito: 1 },
  },
  {
    id: 'alquimista',
    nome: 'Alquimista',
    descricao: 'Mestre do controle de chama e das pílulas.',
    bonusAtributos: { inteligencia: 2, destreza: 2 },
  },
];
