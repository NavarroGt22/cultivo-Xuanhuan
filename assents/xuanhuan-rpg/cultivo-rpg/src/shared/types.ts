import { Character } from '../game/character';

export interface SaveData {
  character: Character;
  noAtualId: string;
  criadoEm: string;
}
