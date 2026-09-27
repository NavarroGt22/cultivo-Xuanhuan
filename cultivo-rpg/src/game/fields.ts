import type { Character } from './character';
import type { StoryState } from './story';
import { addItem } from './inventory';
import { registrarJornada } from './journal';

/** `preferido`: semente que o campo replanta sozinho (escolhida pelo jogador). */
export interface CampoEspiritual { cultivo: string | null; meses: number; preferido?: string }
export const PLANTIOS = [
  { id: 'erva-espiritual', nome: 'Erva espiritual', custo: 8, meses: 6, quantidade: 3, rank: 1 },
  { id: 'erva-500-anos', nome: 'Erva de 500 anos', custo: 80, meses: 24, quantidade: 1, rank: 3 },
  { id: 'erva-1000-anos', nome: 'Erva de 1000 anos', custo: 240, meses: 48, quantidade: 1, rank: 5 },
];
export function custoCampo(c: Character): number { return 150 * ((c.campos?.length ?? 0) + 1); }
export function comprarCampo(c: Character, h: StoryState): string {
  if (h.desfecho?.final) return 'Esta vida já terminou.';
  if (c.idadeMeses < 12 * 12) return 'Você precisa ter 12 anos para administrar um campo.';
  if ((c.campos?.length ?? 0) >= 3) return 'Você já administra o máximo de três campos.';
  const custo = custoCampo(c);
  if (c.inventario.pedrasEspirituais < custo) return `Requer ${custo} pedras espirituais.`;
  c.inventario.pedrasEspirituais -= custo;
  (c.campos ??= []).push({ cultivo: null, meses: 0 });
  const texto = `Você adquiriu um campo espiritual por ${custo} pedras.`;
  registrarJornada(c, h, 'marco', 'Terra fértil', texto);
  return texto;
}
export function plantar(c: Character, h: StoryState, indice: number, id: string): string {
  const campo = c.campos?.[indice]; const planta = PLANTIOS.find(p => p.id === id);
  if (h.desfecho?.final) return 'Esta vida já terminou.';
  if (!campo || campo.cultivo || !planta) return 'Este campo não está disponível.';
  if (c.cultivo.rank < planta.rank) return `Requer reino ${planta.rank}.`;
  if (c.inventario.pedrasEspirituais < planta.custo) return `Requer ${planta.custo} pedras para as sementes.`;
  c.inventario.pedrasEspirituais -= planta.custo;
  campo.cultivo = id; campo.meses = 0; campo.preferido = id;
  const texto = `${planta.nome} plantada. Colheita em ${planta.meses} meses de jogo — depois o campo colhe e replanta sozinho.`;
  registrarJornada(c, h, 'atividade', 'Plantio espiritual', texto);
  return texto;
}

/**
 * Semente que um campo vazio planta sozinho: a escolhida pelo jogador ou, sem escolha, a melhor
 * que o reino permite — sem gastar mais da metade das pedras.
 */
function sementeAutomatica(c: Character, campo: CampoEspiritual): (typeof PLANTIOS)[number] | undefined {
  const podePagar = (p: (typeof PLANTIOS)[number]): boolean => c.cultivo.rank >= p.rank && c.inventario.pedrasEspirituais >= p.custo * 2;
  const preferida = PLANTIOS.find((p) => p.id === campo.preferido);
  if (preferida) return podePagar(preferida) ? preferida : undefined;
  return [...PLANTIOS].reverse().find(podePagar);
}

/** Campos automáticos: amadurecem com o tempo, colhem sozinhos para a bolsa e replantam. */
export function amadurecerCampos(c: Character, meses: number): string[] {
  const avisos: string[] = [];
  for (const campo of c.campos ?? []) {
    let restante = Math.max(0, meses);
    for (let voltas = 0; voltas < 8; voltas++) {
      let planta = PLANTIOS.find(p => p.id === campo.cultivo);
      if (!planta) {
        planta = sementeAutomatica(c, campo);
        if (!planta) break;
        c.inventario.pedrasEspirituais -= planta.custo;
        campo.cultivo = planta.id; campo.meses = 0;
      }
      const falta = planta.meses - campo.meses;
      if (restante < falta) { campo.meses += restante; break; }
      restante -= falta;
      addItem(c.inventario, planta.id, planta.quantidade);
      avisos.push(`Campo espiritual: colheita automática de ${planta.quantidade} × ${planta.nome} (na bolsa).`);
      campo.cultivo = null; campo.meses = 0;
      if (restante <= 0) {
        const proxima = sementeAutomatica(c, campo);
        if (proxima) { c.inventario.pedrasEspirituais -= proxima.custo; campo.cultivo = proxima.id; }
        break;
      }
    }
  }
  return avisos;
}
export function colher(c: Character, h: StoryState, indice: number): string {
  const campo = c.campos?.[indice]; const planta = PLANTIOS.find(p => p.id === campo?.cultivo);
  if (h.desfecho?.final) return 'Esta vida já terminou.';
  if (!campo || !planta || campo.meses < planta.meses) return 'A plantação ainda não está pronta.';
  addItem(c.inventario, planta.id, planta.quantidade);
  campo.cultivo = null; campo.meses = 0;
  const texto = `Colheita: ${planta.quantidade} × ${planta.nome}, guardada no inventário para alquimia ou venda.`;
  registrarJornada(c, h, 'atividade', 'Frutos da terra', texto);
  return texto;
}
