import { Attributes } from './attributes';
import { SpiritualRoot, multiplicadorRaiz } from './spiritualRoot';
import { CultivationState, poderDoReino } from './cultivation';

export interface DerivedStats {
  vida: number;
  chakra: number;
  ataque: number;
  /** Dano de técnicas espirituais; ignora metade da defesa. */
  tecnica: number;
  defesa: number;
  /** Percentual (0–100). */
  esquiva: number;
  /** Percentual (0–100). */
  critico: number;
  compreensao: number;
  velocidadeCultivo: number;
}

/**
 * Nos reinos altos o talento pesa mais: cada grau de raiz acima do 3º rende +4% de cultivo por
 * reino acima do primeiro (raiz 5 no 5º reino: +32%). Raízes comuns não ganham nada.
 */
export function talentoNosReinosAltos(raiz: SpiritualRoot, cultivo: CultivationState): number {
  return 1 + Math.max(0, raiz.grau - 3) * 0.04 * (cultivo.rank - 1);
}

/** `raiz` null = sem cultivo próprio (inimigos). */
export function getDerivedStats(
  atributos: Attributes,
  raiz: SpiritualRoot | null,
  cultivo: CultivationState,
  multiplicadorCultivo = 1,
): DerivedStats {
  const poder = poderDoReino(cultivo);
  const penalidadeToxina = 1 - Math.min(cultivo.toxina, 90) / 150;

  return {
    vida: Math.round((50 + atributos.constituicao * 10) * poder),
    chakra: Math.round((20 + atributos.espirito * 5) * poder),
    ataque: Math.round(atributos.forca * 2 * poder),
    tecnica: Math.round((atributos.espirito * 1.8 + atributos.inteligencia * 0.5) * poder),
    defesa: Math.round(atributos.constituicao * poder),
    esquiva: Math.min(60, atributos.destreza * 3),
    critico: Math.min(50, 5 + atributos.sorte + atributos.inteligencia * 0.5),
    compreensao: atributos.inteligencia,
    velocidadeCultivo: raiz
      ? multiplicadorRaiz(raiz) * talentoNosReinosAltos(raiz, cultivo) * (1 + atributos.espirito * 0.05) * multiplicadorCultivo * penalidadeToxina
      : 0,
  };
}
