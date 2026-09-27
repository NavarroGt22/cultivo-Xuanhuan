import type { Character, FlagValor } from './character';
import type { StoryChoice, StoryNode } from './story';
import type { Origin } from './origin';
import type { SpiritualRoot } from './spiritualRoot';
import { CAPITULOS_HIS001, MARCAS_VISIVEIS_HIS001 } from './his001';

/**
 * Motor das histórias roteirizadas (docs/GDD_Historias_Xuanhuan.docx, seção 10). Na criação o
 * jogador escolhe a história: a "História do Pequeno Herói" é o jogo aberto de sempre; as demais
 * são campanhas com capítulos, cenas, escolhas rastreadas e variáveis narrativas.
 *
 * Regras (10.2): requisitos avaliados antes de mostrar a escolha; efeitos aplicados de uma vez;
 * cada escolha registrada com id, cena e idade; ids internos separados do texto.
 */
export type HistoriaId = 'pequeno-heroi' | 'HIS-001';

export interface HistoriaInfo {
  id: HistoriaId;
  titulo: string;
  resumo: string;
}

export const HISTORIAS: HistoriaInfo[] = [
  {
    id: 'pequeno-heroi',
    titulo: 'História do Pequeno Herói',
    resumo:
      'A vida aberta de um cultivador: o destino sorteia onde você nasce, e cada escolha, seita, amor e rixa é sua. Sem roteiro fixo — o mundo reage ao que você faz.',
  },
  {
    id: 'HIS-001',
    titulo: 'Renascimento do Demônio Celestial',
    resumo:
      'Campanha roteirizada. Aos oito anos, um camponês é declarado incapaz de cultivar. Aos doze, sua aldeia é exterminada por uma seita ortodoxa em busca de uma mina divina — e numa caverna o espera a consciência de Mo Wutian, criador do primeiro Qi Demoníaco. Nascimento fixo (família camponesa do Leste, Raiz do Vazio); nome, gênero, traço e atributos são seus.',
  },
];

export interface RegistroEscolha {
  escolha: string;
  cena: string;
  idadeMeses: number;
}

export interface EstadoNarrativo {
  historia: 'HIS-001';
  /** Id da cena atual (ou CENA_PAUSA). */
  cena: string;
  vars: Record<string, number>;
  flags: Record<string, FlagValor>;
  registro: RegistroEscolha[];
  /** Última cena concluída antes da pausa: de onde continuar quando houver novos capítulos. */
  pausadaEm?: string;
}

export interface EfeitoNarrativo {
  /** Id da escolha rastreada (ex.: HIS-001-ESC-001-A). */
  escolha?: string;
  vars?: Record<string, number>;
  flags?: Record<string, FlagValor>;
  /** Próxima cena; sem valor = a seguinte na ordem do capítulo. */
  proxima?: string;
}

export interface CenaNarrativa {
  id: string;
  titulo: string;
  /** Tempo que passa depois da cena (0 = mesmo dia). */
  meses: number;
  /** Quem fala na cena. */
  personagem?: string;
  montar: (character: Character, n: EstadoNarrativo) => { texto: string; escolhas: StoryChoice[] };
}

export interface CapituloNarrativo {
  numero: number;
  titulo: string;
  cenas: CenaNarrativa[];
}

export const CENA_PAUSA = 'HIS-001-PAUSA';

/** Faixas das variáveis principais (seção 7.1). */
const LIMITES: Record<string, [number, number]> = {
  'VAR-HUMANIDADE': [-100, 100],
  'VAR-VINCULO-MO': [-100, 100],
  'VAR-REPUTACAO': [-100, 100],
};

const CENAS: { cena: CenaNarrativa; capitulo: CapituloNarrativo }[] = CAPITULOS_HIS001.flatMap((capitulo) => capitulo.cenas.map((cena) => ({ cena, capitulo })));

function proximaCena(id: string): string {
  const i = CENAS.findIndex((x) => x.cena.id === id);
  return i >= 0 && i + 1 < CENAS.length ? CENAS[i + 1].cena.id : CENA_PAUSA;
}

export function capituloDaCena(id: string): CapituloNarrativo | undefined {
  return CENAS.find((x) => x.cena.id === id)?.capitulo;
}

export function iniciarNarrativa(character: Character): void {
  character.historia = 'HIS-001';
  character.narrativa = { historia: 'HIS-001', cena: CENAS[0].cena.id, vars: {}, flags: {}, registro: [] };
}

/** Nascimento canônico de HIS-001 (seções 2.1 e 4.1): família camponesa do Campo Sereno, no Leste. */
export function origemHis001(nome: string): Origin {
  const sobrenome = nome.trim().split(/\s+/)[0] || 'Lin';
  return {
    regiao: 'leste',
    cidade: 'Aldeia do Campo Sereno',
    tipo: 'familia-comum',
    nomeCasa: `Família ${sobrenome}`,
    ramo: null,
    ortodoxa: true,
    corpoEspecial: null,
    pedrasIniciais: 0,
    alinhamentoBase: 0,
    familiaDomadora: false,
    herancaSelada: false,
    reencarnacao: null,
  };
}

/** Raiz do Vazio: incompatível com a circulação comum, lida pelo cristal como raiz inútil. */
export const RAIZ_DO_VAZIO: SpiritualRoot = { grau: 1, tipo: 'vazio', elementos: [] };

/** Ajusta um personagem recém-criado para começar HIS-001 aos oito anos, sem nada além da família. */
export function prepararHis001(character: Character): void {
  character.idadeMeses = 8 * 12;
  character.raizEspiritual = { ...RAIZ_DO_VAZIO };
  character.inventario.pedrasEspirituais = 0;
  character.inventario.itens = [];
  character.noivado = null;
  iniciarNarrativa(character);
}

export function variavel(character: Character, id: string): number {
  return character.narrativa?.vars[id] ?? 0;
}

function irPara(n: EstadoNarrativo, destino: string, de: string): void {
  if (destino === CENA_PAUSA) n.pausadaEm = de;
  n.cena = destino;
}

export function aplicarEfeitoNarrativo(character: Character, efeito: EfeitoNarrativo): string[] {
  const n = character.narrativa;
  if (!n) return [];
  for (const [id, delta] of Object.entries(efeito.vars ?? {})) {
    const [min, max] = LIMITES[id] ?? [0, 100];
    n.vars[id] = Math.max(min, Math.min(max, (n.vars[id] ?? 0) + delta));
  }
  Object.assign(n.flags, efeito.flags ?? {});
  if (efeito.escolha) n.registro.push({ escolha: efeito.escolha, cena: n.cena, idadeMeses: character.idadeMeses });
  const atual = n.cena;
  irPara(n, efeito.proxima ?? proximaCena(atual), atual);
  const mensagens: string[] = [];
  const antes = capituloDaCena(atual);
  const depois = capituloDaCena(n.cena);
  if (antes && antes !== depois) mensagens.push(`Fim do Capítulo ${antes.numero} — ${antes.titulo}.`);
  return mensagens;
}

/** Garante o avanço mesmo se uma escolha (ou falha) não disse para onde ir. */
export function concluirCena(character: Character, cenaId: string): void {
  const n = character.narrativa;
  if (!n || n.cena !== cenaId || cenaId === CENA_PAUSA) return;
  irPara(n, proximaCena(cenaId), cenaId);
}

function noDePausa(character: Character): StoryNode {
  const ultimo = character.narrativa?.pausadaEm ? capituloDaCena(character.narrativa.pausadaEm) : undefined;
  return {
    id: CENA_PAUSA,
    evento: 'HIS-001',
    titulo: 'A história continua…',
    texto: `Você chegou ao fim do que já foi escrito de **Renascimento do Demônio Celestial**${ultimo ? ` (Capítulo ${ultimo.numero} — ${ultimo.titulo})` : ''}.\n\nOs próximos capítulos ainda estão sendo trazidos para o jogo. Seu save fica guardado exatamente aqui e continua sozinho quando eles chegarem.`,
    escolhas: [{ texto: 'Aguardar o próximo capítulo.', resultado: { texto: 'A neve cai sobre a boca da montanha. A história espera por você.' } }],
    meses: 0,
  };
}

/** O próximo evento da campanha, ou null se o personagem não segue uma história roteirizada. */
export function noDaNarrativa(character: Character): StoryNode | null {
  const n = character.narrativa;
  if (!n) return null;
  if (n.cena === CENA_PAUSA && n.pausadaEm && proximaCena(n.pausadaEm) !== CENA_PAUSA) n.cena = proximaCena(n.pausadaEm);
  const achado = CENAS.find((x) => x.cena.id === n.cena);
  if (!achado) return noDePausa(character);
  const { cena, capitulo } = achado;
  const { texto, escolhas } = cena.montar(character, n);
  return {
    id: cena.id,
    evento: 'HIS-001',
    titulo: `Capítulo ${capitulo.numero} · ${cena.titulo}`,
    texto,
    escolhas,
    meses: cena.meses,
    personagem: cena.personagem ? { nome: cena.personagem } : undefined,
  };
}

/** O que o jogador pode ver da própria história (as variáveis numéricas ficam ocultas, seção 10.3). */
export function marcasVisiveis(character: Character): string[] {
  const n = character.narrativa;
  if (!n) return [];
  return MARCAS_VISIVEIS_HIS001.map((m) => m(n)).filter((x): x is string => Boolean(x));
}
