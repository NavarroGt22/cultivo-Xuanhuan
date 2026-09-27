import * as fs from 'fs';
import * as path from 'path';
import { SAVE_VERSION, SaveData } from '../shared/types';
import { migrarSave } from './saveMigration';

export const SLOTS = [1, 2, 3] as const;
export type SaveSlot = typeof SLOTS[number];
let slotAtivo: SaveSlot = 1;
export function getSlotAtivo(): SaveSlot { return slotAtivo; }
export function selecionarSlot(slot: SaveSlot): void {
  if (!SLOTS.includes(slot)) throw new Error('Slot inválido.');
  slotAtivo = slot;
}
function arquivo(slot: SaveSlot): string {
  if (!SLOTS.includes(slot)) throw new Error('Slot inválido.');
  return path.join(process.cwd(), slot === 1 ? 'save.json' : `save-${slot}.json`);
}

/** Valida também saves da versão atual antes de substituir qualquer arquivo. */
export function interpretarSave(texto: string): SaveData {
  const dados = migrarSave(JSON.parse(texto));
  const c = dados?.character;
  const h = dados?.historia;
  if (!c || !h || typeof c.nome !== 'string' || !Number.isFinite(c.idadeMeses)
    || !c.origem || !c.afiliacao || !c.traco || !c.raizEspiritual || !c.atributosBase
    || !c.cultivo || !Number.isFinite(c.cultivo.rank) || c.cultivo.rank < 1 || c.cultivo.rank > 13
    || !c.inventario || !Number.isFinite(c.inventario.pedrasEspirituais)
    || !Array.isArray(c.inventario.itens) || !Array.isArray(c.inventario.equipamentos)
    || !Array.isArray(c.relacoes) || !Array.isArray(c.tecnicas) || !Array.isArray(c.equipamentos)
    || !c.local || !c.flags || !c.alinhamento || !c.estilos || !c.profissoes
    || !h.noAtual || typeof h.noAtual.texto !== 'string' || typeof h.noAtual.titulo !== 'string'
    || !Array.isArray(h.noAtual.escolhas) || !h.noAtual.escolhas.every(e => typeof e.texto === 'string' && e.resultado && typeof e.resultado.texto === 'string')
    || !Number.isFinite(h.turno) || !Number.isFinite(h.energia) || !h.mundo
    || !Array.isArray(h.mundo.campanhaResgatada) || !Array.isArray(h.avisos)) {
    throw new Error('Arquivo incompatível ou incompleto. O save atual foi preservado.');
  }
  const registroValido = (r: any): boolean => !!r && typeof r.titulo === 'string' && typeof r.texto === 'string'
    && Number.isFinite(r.turno) && Number.isFinite(r.idadeMeses) && ['historia', 'atividade', 'marco'].includes(r.categoria);
  if ((h.diario !== undefined && (!Array.isArray(h.diario) || !h.diario.every(registroValido)))
    || (h.ancestrais !== undefined && (!Array.isArray(h.ancestrais) || !h.ancestrais.every(a => a && typeof a.nome === 'string'
      && typeof a.reino === 'string' && Number.isFinite(a.idadeMeses) && Number.isFinite(a.reputacao)
      && Array.isArray(a.registros) && a.registros.every(registroValido))))
    || (c.campos !== undefined && (!Array.isArray(c.campos) || c.campos.length > 3 || !c.campos.every(p => p
      && [null, 'erva-espiritual', 'erva-500-anos', 'erva-1000-anos'].includes(p.cultivo)
      && Number.isFinite(p.meses) && p.meses >= 0)))
    || (c.mestrePessoal !== undefined && (!c.mestrePessoal || typeof c.mestrePessoal.id !== 'string'
      || typeof c.mestrePessoal.nome !== 'string' || typeof c.mestrePessoal.seita !== 'string'
      || !Number.isFinite(c.mestrePessoal.vinculo) || !Number.isFinite(c.mestrePessoal.ultimaLicao)))) {
    throw new Error('Crônicas, campos ou mestre inválidos. O save atual foi preservado.');
  }
  return dados!;
}
function lerArquivo(nome: string): SaveData | null {
  try { return interpretarSave(fs.readFileSync(nome, 'utf-8')); } catch { return null; }
}
/** Grava primeiro um temporário e preserva a última versão válida em .bak. */
export function saveGame(data: Omit<SaveData, 'versao'>, slot: SaveSlot = slotAtivo): void {
  const nome = arquivo(slot);
  const texto = JSON.stringify({ ...data, versao: SAVE_VERSION }, null, 2);
  interpretarSave(texto);
  fs.writeFileSync(`${nome}.tmp`, texto, 'utf-8');
  if (lerArquivo(nome)) fs.copyFileSync(nome, `${nome}.bak`);
  fs.renameSync(`${nome}.tmp`, nome);
}
export function loadGame(slot: SaveSlot = slotAtivo): SaveData | null {
  const nome = arquivo(slot);
  return lerArquivo(nome) ?? lerArquivo(`${nome}.bak`);
}
export function usandoBackup(slot: SaveSlot = slotAtivo): boolean {
  const nome = arquivo(slot);
  return !lerArquivo(nome) && !!lerArquivo(`${nome}.bak`);
}
export function hasSave(slot: SaveSlot = slotAtivo): boolean { return loadGame(slot) !== null; }
export function importarSave(texto: string, slot: SaveSlot): void { saveGame(interpretarSave(texto), slot); }
export function exportarSave(slot: SaveSlot): string {
  const dados = loadGame(slot);
  if (!dados) throw new Error('Este slot está vazio ou não pôde ser recuperado.');
  return JSON.stringify(dados, null, 2);
}
