import type { Character } from './character';
import { chance, escolher } from './rng';

/**
 * GDD 14.6 — Divinação / Vislumbre do Destino.
 * Profecias vagas de propósito, às vezes erradas; quando verdadeiras, tornam o evento previsto mais provável.
 */
export interface Profecia {
  texto: string;
  evento: string;
  verdadeira: boolean;
  /** Idade (em meses) até a qual a profecia pode se cumprir. */
  limiteIdadeMeses: number;
}

const PROFECIAS: { evento: string; texto: string }[] = [
  { evento: 'tumulo-ancestral', texto: 'Vejo uma porta de pedra que não se abre há eras… e uma voz que te chama de herdeiro.' },
  { evento: 'achado-de-sorte', texto: 'Algo brilha entre raízes e pedras. O céu decidiu te dar um presente.' },
  { evento: 'besta', texto: 'Uma fera cruzará seu caminho. Pode ser inimiga, pode ser irmã de alma.' },
  { evento: 'rival', texto: 'Um velho ressentimento vai bater à sua porta. Ele não esqueceu seu rosto.' },
  { evento: 'bandidos', texto: 'Sangue na estrada. Cuidado com quem sai do mato.' },
  { evento: 'recrutamento', texto: 'Um estandarte estrangeiro vai chamar seu nome.' },
  { evento: 'mestre-errante', texto: 'Um mendigo carrega nas mãos o que reis não conseguem comprar.' },
  { evento: 'ruina', texto: 'A terra vai se abrir e mostrar o que o Cataclismo enterrou.' },
  { evento: 'leilao', texto: 'Entre lances e olhares de desprezo, algo que você precisa estará à venda.' },
  { evento: 'chuva-espiritual', texto: 'O céu vai chorar energia pura. Esteja ao ar livre.' },
];

const CHAVE = 'profecia';
const DURACAO_MESES = 24;

export function profeciaAtual(character: Character): Profecia | null {
  const bruto = character.flags[CHAVE];
  if (typeof bruto !== 'string' || !bruto) return null;
  try {
    return JSON.parse(bruto) as Profecia;
  } catch {
    return null;
  }
}

function salvarProfecia(character: Character, profecia: Profecia | null): void {
  character.flags[CHAVE] = profecia ? JSON.stringify(profecia) : '';
}

/** Precisão: um adivinho de verdade acerta mais; o próprio personagem, conforme o nível de Divinação. */
export function precisaoDivinacao(character: Character, pagouAdivinho: boolean): number {
  if (pagouAdivinho) return 0.65;
  return Math.min(0.95, 0.5 + character.profissoes.adivinhacao.nivel * 0.12);
}

export function lerDestino(character: Character, pagouAdivinho: boolean): string[] {
  const modelo = escolher(PROFECIAS);
  const profecia: Profecia = {
    texto: modelo.texto,
    evento: modelo.evento,
    verdadeira: chance(precisaoDivinacao(character, pagouAdivinho)),
    limiteIdadeMeses: character.idadeMeses + DURACAO_MESES,
  };
  salvarProfecia(character, profecia);
  return [`Vislumbre do Destino: "${profecia.texto}"`, 'Adivinhos não são infalíveis. O tempo dirá (até 2 anos).'];
}

/** Peso extra para o evento profetizado, se a profecia for verdadeira e ainda estiver valendo. */
export function multiplicadorProfecia(character: Character, evento: string): number {
  const profecia = profeciaAtual(character);
  if (!profecia || !profecia.verdadeira || profecia.evento !== evento) return 1;
  return character.idadeMeses <= profecia.limiteIdadeMeses ? 6 : 1;
}

/** Chamado quando um evento é gerado: cumpre a profecia (ou avisa que ela expirou). */
export function verificarProfecia(character: Character, evento: string): string | null {
  const profecia = profeciaAtual(character);
  if (!profecia) return null;
  if (profecia.evento === evento && character.idadeMeses <= profecia.limiteIdadeMeses) {
    salvarProfecia(character, null);
    character.reputacao += 2;
    return `*A profecia se cumpre: "${profecia.texto}"*`;
  }
  if (character.idadeMeses > profecia.limiteIdadeMeses) {
    salvarProfecia(character, null);
    return '*A profecia não se cumpriu. Talvez o adivinho tenha errado — ou o destino mudou de ideia.*';
  }
  return null;
}
