import type { Character, Genero } from './character';

/**
 * GDD de Qi, Técnicas e Pílulas — Fase 1 (docs/GDD_Qi_Tecnicas_Pilulas_Xuanhuan.docx).
 * Yin, Yang e Demoníaco não substituem Chakra nem Star: são a natureza da energia refinada.
 * O sexo do corpo muda só a frequência (nunca bloqueia técnica); Qi Demoníaco não é sorteado
 * para humanos — exige transformação verdadeira (fases futuras).
 */
export type NaturezaQi = 'yin' | 'yang' | 'demoniaco-yin' | 'demoniaco-yang';
export type CompatibilidadeQi = 'universal' | 'yin' | 'yang' | 'demoniaca' | 'demoniaca-yin' | 'demoniaca-yang' | 'harmonica';

export const NOME_NATUREZA: Record<NaturezaQi, string> = {
  yin: 'Yin',
  yang: 'Yang',
  'demoniaco-yin': 'Demoníaco (base Yin)',
  'demoniaco-yang': 'Demoníaco (base Yang)',
};

export const DESCRICAO_NATUREZA: Record<NaturezaQi, string> = {
  yin: 'contração, frio, silêncio e percepção — controle, precisão, espírito, gelo, água, sombra, cura delicada e selamento',
  yang: 'expansão, calor, movimento e vitalidade — explosão, resistência, purificação, força física, fogo, raio e luz',
  'demoniaco-yin': 'desejo condensado sobre uma base Yin — conversão, regeneração, sangue, alma e devoração',
  'demoniaco-yang': 'desejo condensado sobre uma base Yang — conversão, regeneração, sangue, alma e devoração',
};

export const NOME_COMPATIBILIDADE: Record<CompatibilidadeQi, string> = {
  universal: 'Universal',
  yin: 'Yin',
  yang: 'Yang',
  demoniaca: 'Demoníaca',
  'demoniaca-yin': 'Demoníaca Yin',
  'demoniaca-yang': 'Demoníaca Yang',
  harmonica: 'Harmônica',
};

/** Chance de nascer com Qi Yin (seção 3.1). Parâmetros de balanceamento, não lei cósmica. */
export const CHANCE_YIN: Record<Genero, number> = { feminino: 0.7, masculino: 0.3 };

export function sortearNaturezaQi(genero: Genero, rng: () => number = Math.random): 'yin' | 'yang' {
  return rng() < CHANCE_YIN[genero] ? 'yin' : 'yang';
}

/** Tabela de migração (seção 22), sem alterar números de combate. Sem entrada = Universal. */
export const COMPATIBILIDADE_TECNICAS: Record<string, CompatibilidadeQi> = {
  'respiracao-nove-nuvens': 'universal',
  'corpo-bronze': 'universal',
  'palma-trovao': 'yang',
  'passos-nuvem': 'universal',
  'lotus-regeneracao': 'yin',
  'escudo-qi-dourado': 'yang',
  'sangue-fervente': 'yang',
  'sutra-imperador-estelar': 'universal',
  'punho-imperador-estelar': 'yang',
  'chama-renascente': 'yang',
  'punho-montanha': 'universal',
  'lamina-vento': 'universal',
  'lotus-carmesim': 'yang',
  'pele-de-ferro': 'universal',
  'orvalho-celestial': 'yin',
  'passo-relampago': 'yang',
  'ossos-de-jade': 'universal',
  'sutra-lotus-azul': 'yin',
  'espada-mil-ventos': 'universal',
  'medula-dragao': 'yang',
  'metodo-nove-sois': 'yang',
  'devorar-almas': 'yin',
  'sutra-mar-de-sangue': 'demoniaca-yang',
  'garras-cadaver': 'demoniaca-yin',
  'veu-sombras-infernais': 'demoniaca-yin',
};

export function compatibilidadeDaTecnica(tecnicaId: string): CompatibilidadeQi {
  return COMPATIBILIDADE_TECNICAS[tecnicaId] ?? 'universal';
}

export function ehDemonio(character: Character): boolean {
  return Boolean(character.naturezaQi?.startsWith('demoniaco'));
}

export function baseDaNatureza(natureza: NaturezaQi): 'yin' | 'yang' {
  return natureza.endsWith('yin') ? 'yin' : 'yang';
}

/** Chakra no Rank 1, Star do Rank 2 em diante — o mesmo custo interno, com o nome certo. */
export function nomeEnergia(rank: number): 'Chakra' | 'Star' {
  return rank <= 1 ? 'Chakra' : 'Star';
}

export type ClasseCompatibilidade = 'seguro' | 'adaptavel' | 'perigoso' | 'bloqueado' | 'demoniaco' | 'desconhecido';

export interface AvaliacaoQi {
  classe: ClasseCompatibilidade;
  rotulo: string;
  texto: string;
  /** Pode estudar e executar normalmente. */
  executavel: boolean;
}

/** Linguagem de risco (seção 20.1): sempre explica o motivo e o caminho possível. */
export function avaliarCompatibilidade(character: Character, tecnicaId: string): AvaliacaoQi {
  const compat = compatibilidadeDaTecnica(tecnicaId);
  const natureza = character.naturezaQi;
  const demoniacaTecnica = compat.startsWith('demoniaca');
  if (demoniacaTecnica && !ehDemonio(character)) {
    return { classe: 'demoniaco', rotulo: 'Demoníaca', texto: 'Somente demônios podem completar este ciclo.', executavel: false };
  }
  if (!natureza) {
    return { classe: 'desconhecido', rotulo: 'Desconhecido', texto: 'Seu conhecimento não é suficiente para prever a reação — defina a natureza do seu Qi na ficha.', executavel: true };
  }
  if (compat === 'universal') return { classe: 'seguro', rotulo: 'Seguro', texto: 'Compatível com sua natureza e sua rota atual.', executavel: true };
  if (compat === 'harmonica') {
    return { classe: 'perigoso', rotulo: 'Perigoso', texto: 'Exige um Corpo de Harmonia ou dupla execução coordenada: sozinha, sua polaridade rejeita este circuito.', executavel: false };
  }
  const base = baseDaNatureza(natureza);
  const polaridade = compat === 'demoniaca' ? base : compat.endsWith('yin') ? 'yin' : 'yang';
  if (polaridade === base) return { classe: 'seguro', rotulo: 'Seguro', texto: 'Compatível com sua natureza e sua rota atual.', executavel: true };
  return {
    classe: 'adaptavel',
    rotulo: 'Adaptável',
    texto: `Circuito ${polaridade === 'yin' ? 'Yin' : 'Yang'} para um Qi ${base === 'yin' ? 'Yin' : 'Yang'}: pode ser adaptado. Poder menor, custo maior e estudo adicional.`,
    executavel: true,
  };
}
