import { Character } from '../game/character';
import { StoryState } from '../game/story';

/** Incrementar sempre que o formato de Character/SaveData mudar de forma incompatível. */
export const SAVE_VERSION = 12;

export interface SaveData {
  versao: number;
  character: Character;
  historia: StoryState;
  criadoEm: string;
}
