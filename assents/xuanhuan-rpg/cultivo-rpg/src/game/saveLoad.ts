import * as fs from 'fs';
import * as path from 'path';
import { SaveData } from '../shared/types';

const SAVE_PATH = path.join(process.cwd(), 'save.json');

export function saveGame(data: SaveData): void {
  fs.writeFileSync(SAVE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadGame(): SaveData | null {
  if (!fs.existsSync(SAVE_PATH)) {
    return null;
  }
  const raw = fs.readFileSync(SAVE_PATH, 'utf-8');
  return JSON.parse(raw) as SaveData;
}

export function hasSave(): boolean {
  return fs.existsSync(SAVE_PATH);
}
