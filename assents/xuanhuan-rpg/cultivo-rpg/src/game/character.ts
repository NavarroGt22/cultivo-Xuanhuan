import { Attributes, createBaseAttributes } from './attributes';
import { CultivationClass } from './classes';
import { Equipment } from './equipment';
import { AlignmentState, createAlignment } from './alignment';
import { Inventory, createInventory } from './inventory';

export interface Character {
  nome: string;
  /** Nome de arquivo de retrato em /assets, opcional — ex: "protagonista.png". */
  retrato?: string;
  classe: CultivationClass;
  atributosBase: Attributes;
  equipamentos: Equipment[];
  alinhamento: AlignmentState;
  inventario: Inventory;
}

export function createCharacter(nome: string, classe: CultivationClass, retrato?: string): Character {
  return {
    nome,
    retrato,
    classe,
    atributosBase: createBaseAttributes(classe.bonusAtributos),
    equipamentos: [],
    alinhamento: createAlignment(),
    inventario: createInventory(),
  };
}

/** Atributos base + bônus de todo equipamento atualmente equipado. */
export function getEffectiveAttributes(character: Character): Attributes {
  const total: Attributes = { ...character.atributosBase };

  for (const equipamento of character.equipamentos) {
    for (const chave of Object.keys(equipamento.bonusAtributos) as (keyof Attributes)[]) {
      const bonus = equipamento.bonusAtributos[chave];
      if (bonus !== undefined) {
        total[chave] += bonus;
      }
    }
  }

  return total;
}
