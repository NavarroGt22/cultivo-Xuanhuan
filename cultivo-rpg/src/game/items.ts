import type { Attributes } from './attributes';
import type { Efeitos } from './effects';
import { QUALIDADES } from './quality';
import { NOME_CATEGORIA_TECNICA, dificuldadeAprendizado, nomeGrau, tecnicaDoManual } from './techniques';

export interface ConsumivelInfo {
  nome: string;
  descricao: string;
  /** Pedras espirituais recebidas ao vender. */
  valor: number;
  efeitosAoUsar?: Efeitos;
}

export const CONSUMIVEIS: Record<string, ConsumivelInfo> = {
  'pilula-chakra': {
    nome: 'Pílula de Reunião de Chakra',
    descricao: '1ª Ordem. Acelera o acúmulo de energia, mas deixa toxina no corpo.',
    valor: 4,
    efeitosAoUsar: { progresso: 15, toxina: 12 },
  },
  'pilula-purificacao': {
    nome: 'Pílula de Purificação',
    descricao: 'Único efeito: limpar toxina acumulada de outras pílulas.',
    valor: 5,
    efeitosAoUsar: { toxina: -35 },
  },
  'pilula-dourada': {
    nome: 'Pílula Dourada Universal',
    descricao: 'Cura e fortalece. Valorizada pela versatilidade.',
    valor: 20,
    efeitosAoUsar: { progresso: 30, curaPercentual: 100, toxina: 5 },
  },
  'pilula-cura': {
    nome: 'Pílula de Cura Menor',
    descricao: 'Fecha ferimentos comuns em minutos.',
    valor: 3,
    efeitosAoUsar: { curaPercentual: 50 },
  },
  'pilula-medula-celestial': {
    nome: 'Pílula da Medula Celestial',
    descricao: 'Pílula de Grau Céu. Restaura núcleos rachados e meridianos danificados.',
    valor: 60,
    efeitosAoUsar: { flags: { nucleoRachado: false, sequela: false, sequelaSemTratamento: false }, curaPercentual: 100 },
  },
  'minerio-estelar': { nome: 'Minério Estelar do Norte', descricao: 'Produto regional. Vale muito mais longe do Norte.', valor: 8 },
  'elixir-refinado': { nome: 'Elixir Refinado da Planície Central', descricao: 'Produto regional. Vale muito mais longe da Planície Central.', valor: 11 },
  'erva-jade-sul': { nome: 'Erva de Jade do Sul', descricao: 'Produto regional. Vale muito mais longe do Sul.', valor: 6 },
  'bambu-espiritual': { nome: 'Bambu Espiritual do Leste', descricao: 'Produto regional. Vale muito mais longe do Leste.', valor: 5 },
  'pigmento-dourado': { nome: 'Pigmento de Areia Dourada do Oeste', descricao: 'Produto regional. Vale muito mais longe do Oeste.', valor: 7 },
  'nucleo-besta': {
    nome: 'Núcleo de Besta Espiritual',
    descricao: 'Energia condensada de uma besta. Ingrediente valioso para alquimia e forja.',
    valor: 8,
  },
  'erva-espiritual': {
    nome: 'Erva Espiritual de 100 Anos',
    descricao: 'Ingrediente básico de pílulas.',
    valor: 4,
  },
  'talisma-escudo': {
    nome: 'Talismã de Escudo (Bronze)',
    descricao: 'Usado automaticamente no início da próxima luta: um escudo de 20% da sua vida.',
    valor: 7,
  },
  'talisma-combate': {
    nome: 'Talismã de Combate (Bronze)',
    descricao: 'Usado automaticamente no início da próxima luta, liberando um golpe instantâneo.',
    valor: 6,
  },
  'erva-500-anos': {
    nome: 'Erva Espiritual de 500 Anos',
    descricao: 'Cinco séculos de energia numa raiz. Ingrediente de pílulas de 4ª a 6ª Ordem.',
    valor: 30,
  },
  'erva-1000-anos': {
    nome: 'Erva Espiritual de 1000 Anos',
    descricao: 'Clãs fazem guerra por ervas assim. Ingrediente de pílulas de 7ª Ordem em diante.',
    valor: 180,
  },

  // GDD 4 — pílulas de 2ª a 10ª Ordem
  'pilula-fundacao': {
    nome: 'Pílula da Fundação Firme',
    descricao: '2ª Ordem. Assenta o qi nos meridianos: progresso sólido com pouca toxina.',
    valor: 14,
    efeitosAoUsar: { progresso: 40, toxina: 10 },
  },
  'pilula-mil-passaros': {
    nome: 'Pílula dos Mil Pássaros',
    descricao: '3ª Ordem. Reflexos de pássaro para sempre: Destreza permanente.',
    valor: 40,
    efeitosAoUsar: { atributos: { destreza: 1 }, toxina: 20 },
  },
  'pilula-cura-maior': {
    nome: 'Pílula de Cura Maior',
    descricao: '3ª Ordem. Fecha qualquer ferida e trata meridianos danificados.',
    valor: 35,
    efeitosAoUsar: { curaPercentual: 100, flags: { sequela: false, sequelaSemTratamento: false } },
  },
  'pilula-rompe-barreira': {
    nome: 'Pílula Rompe-Barreira',
    descricao: '4ª Ordem. Empurra o cultivo contra o gargalo do reino.',
    valor: 70,
    efeitosAoUsar: { progresso: 120, toxina: 25 },
  },
  'pilula-explosao-origem': {
    nome: 'Pílula da Explosão de Origem',
    descricao: '5ª Ordem (Origin Blasting Pill). Uma explosão de energia concentrada força o avanço — e machuca.',
    valor: 120,
    efeitosAoUsar: { progresso: 200, toxina: 35, danoPercentual: 15 },
  },
  'pilula-purificacao-celestial': {
    nome: 'Pílula da Purificação Celestial',
    descricao: '5ª Ordem. Limpa toda a toxina acumulada de uma vez.',
    valor: 90,
    efeitosAoUsar: { toxina: -100 },
  },
  'pilula-osso-jade': {
    nome: 'Pílula do Osso de Jade',
    descricao: '6ª Ordem. Transforma os ossos em jade: Constituição e Força permanentes.',
    valor: 200,
    efeitosAoUsar: { atributos: { constituicao: 2, forca: 1 }, toxina: 30 },
  },
  'pilula-alma-clara': {
    nome: 'Pílula da Alma Cristalina',
    descricao: '6ª Ordem. A mente fica clara como água parada: Espírito e Inteligência permanentes.',
    valor: 200,
    efeitosAoUsar: { atributos: { espirito: 2, inteligencia: 1 }, toxina: 30 },
  },
  'pilula-renascer-orgaos': {
    nome: 'Pílula do Renascimento de Órgãos',
    descricao: '7ª Ordem. Regenera órgãos e núcleos rachados, como se o corpo nascesse de novo.',
    valor: 350,
    efeitosAoUsar: { curaPercentual: 100, progresso: 60, flags: { nucleoRachado: false, sequela: false, sequelaSemTratamento: false } },
  },
  'pilula-juventude': {
    nome: 'Pílula da Primavera Eterna',
    descricao: '7ª Ordem. Reverte dez anos de idade.',
    valor: 450,
    efeitosAoUsar: { envelhecerMeses: -120, toxina: 20 },
  },
  'pilula-transformar-raiz': {
    nome: 'Pílula da Transformação da Raiz',
    descricao: '8ª Ordem. Reescreve a raiz espiritual: +1 grau. O que o nascimento negou, o fogo concede.',
    valor: 800,
    efeitosAoUsar: { grauRaiz: 1, toxina: 40 },
  },
  'pilula-osso-celestial-imperador': {
    nome: 'Pílula Imperial da Troca de Ossos Celestiais',
    descricao: '9ª Ordem (Heavenly Bone Changing Emperor Pill). Rompe um reino inteiro de uma vez.',
    valor: 1500,
    efeitosAoUsar: { avancarRank: true, toxina: 50 },
  },
  'pilula-divina': {
    nome: 'Pílula Divina',
    descricao: '10ª Ordem. Cada uma refinada é um evento histórico: rompe um reino, eleva a raiz, fortalece o corpo inteiro e devolve a juventude, sem toxina.',
    valor: 5000,
    efeitosAoUsar: {
      avancarRank: true,
      grauRaiz: 1,
      atributos: { forca: 2, constituicao: 2, destreza: 2, espirito: 2, inteligencia: 2, sorte: 2 },
      envelhecerMeses: -240,
      reputacao: 50,
    },
  },
};

/** Ordem de cada pílula (GDD 4), para exibir e validar fornalhas. */
export const ORDEM_PILULA: Record<string, number> = {
  'pilula-cura': 1,
  'pilula-chakra': 1,
  'pilula-purificacao': 1,
  'pilula-dourada': 2,
  'pilula-fundacao': 2,
  'pilula-mil-passaros': 3,
  'pilula-cura-maior': 3,
  'pilula-rompe-barreira': 4,
  'pilula-explosao-origem': 5,
  'pilula-purificacao-celestial': 5,
  'pilula-osso-jade': 6,
  'pilula-alma-clara': 6,
  'pilula-renascer-orgaos': 7,
  'pilula-medula-celestial': 7,
  'pilula-juventude': 7,
  'pilula-transformar-raiz': 8,
  'pilula-osso-celestial-imperador': 9,
  'pilula-divina': 10,
};

/**
 * Grau de pureza da pílula (anéis do núcleo, GDD 4) na escala universal: o id recebe o sufixo "@1".."@4"
 * (Prata → Lendário); sem sufixo é Bronze, então itens antigos continuam válidos.
 */
export function separarQualidade(id: string): { base: string; qualidade: number } {
  const [base, sufixo] = id.split('@');
  const qualidade = Number(sufixo);
  return { base, qualidade: Number.isInteger(qualidade) && qualidade > 0 && qualidade < QUALIDADES.length ? qualidade : 0 };
}

export function idComQualidade(base: string, qualidade: number): string {
  return qualidade > 0 ? `${base}@${qualidade}` : base;
}

/** Mais pureza: efeito multiplicado e menos toxina (−15% por grau). Efeitos únicos (romper reino, raiz) não mudam. */
function efeitosComQualidade(efeitos: Efeitos, qualidade: number): Efeitos {
  if (qualidade === 0) return efeitos;
  const mult = QUALIDADES[qualidade].multiplicador;
  const escalado: Efeitos = { ...efeitos };
  if (efeitos.progresso) escalado.progresso = Math.round(efeitos.progresso * mult);
  if (efeitos.curaPercentual) escalado.curaPercentual = Math.min(100, Math.round(efeitos.curaPercentual * mult));
  if (efeitos.envelhecerMeses && efeitos.envelhecerMeses < 0) escalado.envelhecerMeses = Math.round(efeitos.envelhecerMeses * mult);
  if (efeitos.toxina) {
    escalado.toxina = efeitos.toxina > 0 ? Math.round(efeitos.toxina * (1 - 0.15 * qualidade)) : Math.round(efeitos.toxina * mult);
  }
  if (efeitos.danoPercentual) escalado.danoPercentual = Math.round(efeitos.danoPercentual * (1 - 0.2 * qualidade));
  if (efeitos.atributos) {
    escalado.atributos = {};
    for (const [chave, valor] of Object.entries(efeitos.atributos) as [keyof Attributes, number][]) {
      escalado.atributos[chave] = Math.max(valor, Math.round(valor * mult));
    }
  }
  return escalado;
}

export function getConsumivel(id: string): ConsumivelInfo | undefined {
  const { base, qualidade } = separarQualidade(id);
  const info = CONSUMIVEIS[base];
  if (!info || qualidade === 0) return info;
  return {
    nome: `${info.nome} [${QUALIDADES[qualidade].nome}]`,
    descricao: `${info.descricao} Pureza ${QUALIDADES[qualidade].nome}: efeito ×${QUALIDADES[qualidade].multiplicador.toLocaleString('pt-BR')}, menos toxina.`,
    valor: Math.round(info.valor * QUALIDADES[qualidade].multiplicador),
    efeitosAoUsar: info.efeitosAoUsar ? efeitosComQualidade(info.efeitosAoUsar, qualidade) : undefined,
  };
}

export function nomeItem(id: string): string {
  const tecnica = tecnicaDoManual(id);
  if (tecnica) return `Manual: ${tecnica.nome} (${nomeGrau(tecnica)})`;
  return getConsumivel(id)?.nome ?? id;
}

export function descricaoItem(id: string): string {
  const tecnica = tecnicaDoManual(id);
  if (tecnica) {
    return `${NOME_CATEGORIA_TECNICA[tecnica.categoria]}. ${tecnica.descricao} Clique para estudar (teste de Compreensão). Cada tentativa que falha deixa a próxima mais fácil${tecnica.heranca ? '; o eco do dono deste manual de herança guia seu estudo' : ''}.`;
  }
  const info = getConsumivel(id);
  if (!info) return '';
  const ordem = ORDEM_PILULA[separarQualidade(id).base];
  return ordem && !info.descricao.includes('Ordem') ? `${ordem}ª Ordem. ${info.descricao}` : info.descricao;
}
