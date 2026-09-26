import { Equipment } from './equipment';
import { nomeItem } from './items';

export interface InventoryItem {
  id: string;
  nome: string;
  quantidade: number;
}

export interface ItemQuantidade {
  id: string;
  quantidade: number;
}

export interface Inventory {
  pedrasEspirituais: number;
  itens: InventoryItem[];
  /** Equipamentos guardados na bolsa (não equipados). */
  equipamentos: Equipment[];
}

export function createInventory(pedrasEspirituais = 0): Inventory {
  return { pedrasEspirituais: Math.max(0, pedrasEspirituais), itens: [], equipamentos: [] };
}

export function addItem(inventario: Inventory, id: string, quantidade = 1): void {
  const existente = inventario.itens.find((item) => item.id === id);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    inventario.itens.push({ id, nome: nomeItem(id), quantidade });
  }
}

export function quantidadeItem(inventario: Inventory, id: string): number {
  return inventario.itens.find((item) => item.id === id)?.quantidade ?? 0;
}

/** Retorna false (e não remove nada) se não houver quantidade suficiente. */
export function removerItem(inventario: Inventory, id: string, quantidade = 1): boolean {
  const item = inventario.itens.find((i) => i.id === id);
  if (!item || item.quantidade < quantidade) return false;

  item.quantidade -= quantidade;
  if (item.quantidade === 0) {
    inventario.itens = inventario.itens.filter((i) => i !== item);
  }
  return true;
}

export function addPedrasEspirituais(inventario: Inventory, quantidade: number): void {
  inventario.pedrasEspirituais = Math.max(0, inventario.pedrasEspirituais + quantidade);
}

/** Retorna false (e não gasta nada) se não houver pedras suficientes. */
export function gastarPedrasEspirituais(inventario: Inventory, quantidade: number): boolean {
  if (inventario.pedrasEspirituais < quantidade) {
    return false;
  }
  inventario.pedrasEspirituais -= quantidade;
  return true;
}
