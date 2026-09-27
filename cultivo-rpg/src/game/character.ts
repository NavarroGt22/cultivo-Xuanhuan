import { ATTRIBUTE_KEYS, Attributes, addAttributes } from './attributes';
import { Equipment, EquipmentType, getEquipment } from './equipment';
import { AlignmentState, createAlignment } from './alignment';
import { Inventory, addItem, createInventory } from './inventory';
import { Trait } from './traits';
import { SpiritualRoot } from './spiritualRoot';
import { CultivationState, createCultivation, getRealm } from './cultivation';
import { Afiliacao, CorpoEspecial, Origin, afiliacaoInicial } from './origin';
import { ProfissaoEstado, ProfissaoId, createProfissoes } from './professions';
import { DerivedStats, getDerivedStats } from './stats';
import type { OcupacaoEstado } from './occupations';
import { RegiaoId } from './world';
import { EstiloEstado, EstiloId, bonusDeEstilos, createEstilos } from './martialStyles';
import { aplicarPassivas } from './techniques';
import { aplicarModificadoresCicatrizes } from './scars';
import { Companheira, filhoteDaEspecie } from './companion';
import { especieParaFamilia } from './bestiary';
import { Noivado, arranjarNoivado } from './betrothal';
import type { GuerraClas } from './clanWar';
import type { Feito } from './lifeTraits';
import type { Relacao } from './relationships';
import type { Faccao } from './faction';

export type Genero = 'masculino' | 'feminino';
export type FlagValor = string | number | boolean;

export interface Character {
  campos?: import('./fields').CampoEspiritual[];
  mestrePessoal?: import('./mentor').MestrePessoal;
  nome: string;
  genero: Genero;
  traco: Trait;
  origem: Origin;
  afiliacao: Afiliacao;
  raizEspiritual: SpiritualRoot;
  cultivo: CultivationState;
  profissoes: Record<ProfissaoId, ProfissaoEstado>;
  atributosBase: Attributes;
  /** Equipamentos atualmente equipados. */
  equipamentos: Equipment[];
  alinhamento: AlignmentState;
  inventario: Inventory;
  vidaAtual: number;
  reputacao: number;
  idadeMeses: number;
  ocupacao: OcupacaoEstado | null;
  /** Pontos de Contribuição da seita (promoção de posto e Pavilhão de Contribuição). */
  contribuicao: number;
  /** Onde o personagem está agora (começa no local de nascimento). */
  local: { regiao: RegiaoId; cidade: string };
  /** Estilos marciais aprendidos ao longo da vida, cada um com sua maestria. */
  estilos: Record<EstiloId, EstiloEstado>;
  /** Ids de TECNICAS aprendidas. */
  tecnicas: string[];
  companheira: Companheira | null;
  relacoes: Relacao[];
  /** GDD 14.2: ids de CICATRIZES. */
  cicatrizes: string[];
  /** Seita ou Clã fundado pelo personagem (e herdado pelos descendentes). */
  faccao?: Faccao | null;
  /** Id de MORADIAS (market.ts). */
  moradia?: string | null;
  /** Id de MONTARIAS (market.ts). */
  montaria?: string | null;
  /** Ordem da fornalha alquímica (GDD 4); sem valor = básica de 2ª Ordem. */
  fornalha?: number;
  /** Noivado arranjado pela família (betrothal.ts). */
  noivado?: Noivado | null;
  /** Guerra de clãs em andamento (clanWar.ts). */
  guerra?: GuerraClas | null;
  /** Contadores do que você fez na vida (lifeTraits.ts). */
  feitos?: Partial<Record<Feito, number>>;
  /** Ids de TRACOS_VIDA ganhos pelos feitos ou pelo acaso. */
  tracosVida?: string[];
  /** Reputação e cotas com os grandes grupos mercadores (merchantGroups.ts). */
  mercadores?: Record<string, { reputacao: number; cotas: number }>;
  /** Nome de arquivo em /assets para o retrato do protagonista (opcional). */
  retrato?: string;
  /** Marcadores de história (eventos únicos, rival, companheiro etc.). */
  flags: Record<string, FlagValor>;
}

export interface CharacterCreationOptions {
  nome: string;
  genero: Genero;
  traco: Trait;
  origem: Origin;
  raizEspiritual: SpiritualRoot;
  atributosDistribuidos: Attributes;
  retrato?: string;
}

export const SLOTS_POR_TIPO: Record<EquipmentType, number> = {
  arma: 1,
  armadura: 1,
  acessorio: 2,
};

/** Distribuição do jogador + bônus de traço e corpo especial (mínimo 1). */
export function calcularAtributosBase(
  distribuicao: Attributes,
  traco: Trait,
  corpo: CorpoEspecial | null = null,
): Attributes {
  const total = addAttributes(distribuicao, traco.bonusAtributos, corpo?.bonusAtributos ?? {});
  for (const chave of ATTRIBUTE_KEYS) {
    total[chave] = Math.max(1, total[chave]);
  }
  return total;
}

export function createCharacter(opcoes: CharacterCreationOptions): Character {
  const inventario = createInventory(opcoes.origem.pedrasIniciais + (opcoes.traco.pedrasEspirituaisBonus ?? 0));
  addItem(inventario, 'pilula-chakra', 1);
  addItem(inventario, 'pilula-cura', 2);

  const character: Character = {
    nome: opcoes.nome,
    genero: opcoes.genero,
    traco: opcoes.traco,
    origem: opcoes.origem,
    afiliacao: afiliacaoInicial(opcoes.origem),
    raizEspiritual: opcoes.raizEspiritual,
    cultivo: createCultivation(),
    profissoes: createProfissoes(),
    atributosBase: calcularAtributosBase(opcoes.atributosDistribuidos, opcoes.traco, opcoes.origem.corpoEspecial),
    equipamentos: [],
    alinhamento: createAlignment((opcoes.traco.alinhamentoInicial ?? 0) + opcoes.origem.alinhamentoBase),
    inventario,
    vidaAtual: 0,
    reputacao: 0,
    idadeMeses: 0,
    ocupacao: null,
    contribuicao: 0,
    local: { regiao: opcoes.origem.regiao, cidade: opcoes.origem.cidade },
    estilos: createEstilos(),
    tecnicas: [],
    companheira: null,
    relacoes: [],
    cicatrizes: [],
    retrato: opcoes.retrato,
    flags: {},
    noivado: arranjarNoivado(opcoes.origem, opcoes.genero),
  };

  if (opcoes.origem.familiaDomadora) {
    const especie = especieParaFamilia(opcoes.origem.regiao);
    character.companheira = filhoteDaEspecie(especie, 6, true);
    character.flags[`bestiario:${especie.id}`] = true;
    character.profissoes.domador = { nivel: 1, xp: 0 };
  }
  if (opcoes.origem.herancaSelada) {
    character.flags.herancaSelada = true;
  }

  const tunica = getEquipment('tunica-linho');
  if (tunica) {
    inventario.equipamentos.push(tunica);
    equipar(character, 0);
  }

  character.vidaAtual = getCharacterStats(character).vida;
  return character;
}

/** Atributos base + equipamentos + maestria dos estilos marciais. */
export function getEffectiveAttributes(character: Character): Attributes {
  return addAttributes(
    character.atributosBase,
    ...character.equipamentos.map((item) => item.bonusAtributos),
    bonusDeEstilos(character.estilos),
  );
}

export function getCharacterStats(character: Character): DerivedStats {
  const base = getDerivedStats(
    getEffectiveAttributes(character),
    character.raizEspiritual,
    character.cultivo,
    character.origem.corpoEspecial?.multiplicadorCultivo ?? 1,
  );
  return aplicarModificadoresCicatrizes(aplicarPassivas(base, character.tecnicas), character);
}

export function idadeAnos(character: Character): number {
  return Math.floor(character.idadeMeses / 12);
}

export function expectativaDeVidaAnos(character: Character): number {
  return getRealm(character.cultivo).expectativaAnos * (character.origem.corpoEspecial?.multiplicadorVida ?? 1);
}

/** Cura (ou fere, se negativo) uma porcentagem da vida máxima; nunca passa do máximo. */
export function alterarVidaPercentual(character: Character, percentual: number, minimo = 0): void {
  const vidaMax = getCharacterStats(character).vida;
  character.vidaAtual = Math.max(minimo, Math.min(vidaMax, Math.round(character.vidaAtual + (vidaMax * percentual) / 100)));
}

export function limitarVida(character: Character): void {
  character.vidaAtual = Math.min(character.vidaAtual, getCharacterStats(character).vida);
}

/** Move um item da bolsa para o corpo; se o slot estiver cheio, troca com o mais antigo do mesmo tipo. */
export function equipar(character: Character, indiceNaBolsa: number): boolean {
  const bolsa = character.inventario.equipamentos;
  const item = bolsa[indiceNaBolsa];
  if (!item) return false;

  bolsa.splice(indiceNaBolsa, 1);

  const indiceMesmoTipo = character.equipamentos.findIndex((equipado) => equipado.tipo === item.tipo);
  const quantidadeMesmoTipo = character.equipamentos.filter((equipado) => equipado.tipo === item.tipo).length;
  if (quantidadeMesmoTipo >= SLOTS_POR_TIPO[item.tipo]) {
    desequipar(character, indiceMesmoTipo);
  }

  character.equipamentos.push(item);
  return true;
}

export function desequipar(character: Character, indiceEquipado: number): boolean {
  const item = character.equipamentos[indiceEquipado];
  if (!item) return false;

  character.equipamentos.splice(indiceEquipado, 1);
  character.inventario.equipamentos.push(item);
  limitarVida(character);
  return true;
}
