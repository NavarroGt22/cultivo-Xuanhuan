export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD20(): number {
  return rollDie(20);
}

export interface CheckResult {
  roll: number;
  total: number;
  success: boolean;
  criticalSuccess: boolean;
  criticalFailure: boolean;
}

/**
 * Teste clássico de RPG de texto: d20 + atributo vs. dificuldade.
 * Um 20 natural sempre é sucesso crítico; um 1 natural sempre é falha crítica,
 * independente do valor do atributo.
 */
export function attributeCheck(attributeValue: number, difficulty: number): CheckResult {
  const roll = rollD20();
  const total = roll + attributeValue;

  return {
    roll,
    total,
    success: roll === 20 || (roll !== 1 && total >= difficulty),
    criticalSuccess: roll === 20,
    criticalFailure: roll === 1,
  };
}
