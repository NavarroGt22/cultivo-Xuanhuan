import * as fs from 'fs';
import * as path from 'path';
import { SAVE_VERSION, SaveData } from '../shared/types';
import { migrarSave } from './saveMigration';

const SAVE_PATH = path.join(process.cwd(), 'save.json');

export function saveGame(data: Omit<SaveData, 'versao'>): void {
  const completo: SaveData = { versao: SAVE_VERSION, ...data };
  fs.writeFileSync(SAVE_PATH, JSON.stringify(completo, null, 2), 'utf-8');
}

/** Retorna null se não houver save ou se estiver corrompido. Saves de versões antigas são migrados. */
export function loadGame(): SaveData | null {
  if (!fs.existsSync(SAVE_PATH)) {
    return null;
  }

  try {
    return migrarSave(JSON.parse(fs.readFileSync(SAVE_PATH, 'utf-8')));
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}
