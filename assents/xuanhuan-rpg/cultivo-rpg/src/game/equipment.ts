import { Attributes } from './attributes';

export type EquipmentType = 'arma' | 'armadura' | 'acessorio';

export interface Equipment {
  id: string;
  nome: string;
  tipo: EquipmentType;
  bonusAtributos: Partial<Attributes>;
}

export const EQUIPMENT_CATALOG: Equipment[] = [
  {
    id: 'espada-ferro',
    nome: 'Espada de Ferro Refinado',
    tipo: 'arma',
    bonusAtributos: { forca: 1 },
  },
  {
    id: 'manto-vento',
    nome: 'Manto do Vento Silencioso',
    tipo: 'armadura',
    bonusAtributos: { destreza: 2 },
  },
];
