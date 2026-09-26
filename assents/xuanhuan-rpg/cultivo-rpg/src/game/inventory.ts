import { Equipment } from './equipment';

export interface InventoryItem {
  id: string;
  nome: string;
  quantidade: number;
}

export interface Inventory {
  itens: InventoryItem[];
  equipados: Equipment[];
}

export function createInventory(): Inventory {
  return { itens: [], equipados: [] };
}

export function addItem(inventario: Inventory, id: string, nome: string, quantidade = 1): void {
  const existente = inventario.itens.find((item) => item.id === id);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    inventario.itens.push({ id, nome, quantidade });
  }
}
