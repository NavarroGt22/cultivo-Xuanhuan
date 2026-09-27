import type { Character } from './character';
import type { MundoState } from './worldState';
import type { RegiaoId } from './world';
import { ESPECIES, EspecieBesta, LINHAGENS } from './bestiary';
import { FICHAS, NOME_PAPEL } from './bestiaryDeep';
import { entradasCodex } from './codex';
import { especieDaCompanheira, faseDaCompanheira } from './companion';
import { escolher, inteiro } from './rng';

/**
 * Bestiário Profundo — Fase 2 (docs/GDD_Bestiario_Profundo_Xuanhuan.docx, seção 3): o bestiário
 * mostra o que o personagem sabe. Cada espécie tem um nível de 0 a 5; rumores podem ser
 * verdadeiros, exagerados ou falsos e só se confirmam (ou caem) quando a espécie é compreendida.
 *
 * O nível efetivo é o maior entre o registrado e o que já se deduz do save (Codex, doma,
 * companheira) — por isso saves antigos migram sem escrita e recarregar nunca duplica nada.
 */
export type NivelConhecimento = 0 | 1 | 2 | 3 | 4 | 5;

export const NOME_NIVEL: Record<NivelConhecimento, string> = {
  0: 'Desconhecida',
  1: 'Reconhecida',
  2: 'Estudada',
  3: 'Compreendida',
  4: 'Dominada',
  5: 'Lendária',
};

export const COMO_AVANCAR: Record<NivelConhecimento, string> = {
  0: 'Ouça rumores de caçadores ou encontre a besta na jornada.',
  1: 'Siga os rastros dela na região onde vive, ou enfrente-a algumas vezes.',
  2: 'Vença-a em combate ou conclua o estudo dos rastros (mais difícil).',
  3: 'Dome uma besta desta espécie.',
  4: 'Crie um vínculo profundo (90+) com uma companheira adulta desta espécie.',
  5: 'Você conhece esta espécie como poucos no mundo.',
};

/** Grupo de campos da ficha e o nível que o revela (seção 3). */
export type CampoFicha =
  | 'identidade'
  | 'ecologia'
  | 'combate'
  | 'vinculo'
  | 'lenda';

export const NIVEL_DO_CAMPO: Record<CampoFicha, NivelConhecimento> = {
  identidade: 1,
  ecologia: 2,
  combate: 3,
  vinculo: 4,
  lenda: 5,
};

export function campoVisivel(nivel: NivelConhecimento, campo: CampoFicha): boolean {
  return nivel >= NIVEL_DO_CAMPO[campo];
}

export type TipoRumor = 'verdadeiro' | 'exagerado' | 'falso';

export interface RumorBesta {
  id: string;
  texto: string;
  /** 0–1: o quanto o caçador parecia seguro. Não é garantia. */
  confiabilidade: number;
  tipo: TipoRumor;
  estado: 'relato' | 'confirmado' | 'desmentido';
}

export interface ConhecimentoBesta {
  nivel: NivelConhecimento;
  pistas: string[];
  rumores: RumorBesta[];
  encontros: number;
  derrotadas: number;
  ultimaRegiao?: RegiaoId;
}

export const ENERGIA_RASTREAR = 1;
export const ENERGIA_RUMOR = 1;
export const CUSTO_RUMOR = 3;
/** A partir de "Compreendida", conhecer a fraqueza enfraquece a besta em combate. */
export const FATOR_FRAQUEZA_CONHECIDA = 0.9;

function registro(character: Character, id: string): ConhecimentoBesta {
  const todos = (character.conhecimentoBestas = character.conhecimentoBestas ?? {});
  return (todos[id] = todos[id] ?? { nivel: 0, pistas: [], rumores: [], encontros: 0, derrotadas: 0 });
}

export function conhecimentoRegistrado(character: Character, id: string): ConhecimentoBesta | undefined {
  return character.conhecimentoBestas?.[id];
}

export function nivelConhecimento(character: Character, mundo: MundoState | undefined, especie: EspecieBesta): NivelConhecimento {
  let nivel: number = conhecimentoRegistrado(character, especie.id)?.nivel ?? 0;
  if (entradasCodex(mundo, 'bestas').includes(especie.nome)) nivel = Math.max(nivel, 1);
  const companheira = character.companheira && especieDaCompanheira(character.companheira)?.id === especie.id ? character.companheira : null;
  if (character.flags[`bestiario:${especie.id}`] || companheira) nivel = Math.max(nivel, 4);
  if (companheira && companheira.vinculo >= 90 && ['Adulta', 'Anciã'].includes(faseDaCompanheira(companheira))) nivel = 5;
  return nivel as NivelConhecimento;
}

/** Sobe o nível registrado (nunca desce). Ao chegar a "Compreendida", resolve os rumores. */
export function elevarConhecimento(character: Character, especie: EspecieBesta, alvo: NivelConhecimento, pista?: string): string[] {
  const r = registro(character, especie.id);
  const mensagens: string[] = [];
  if (pista && !r.pistas.includes(pista)) r.pistas.push(pista);
  if (alvo <= r.nivel) return mensagens;
  r.nivel = alvo;
  mensagens.push(`Bestiário: ${especie.nome} agora está ${NOME_NIVEL[alvo].toLowerCase()} (nível ${alvo}).`);
  if (alvo >= 3) mensagens.push(...resolverRumores(character, especie));
  return mensagens;
}

function resolverRumores(character: Character, especie: EspecieBesta): string[] {
  const r = registro(character, especie.id);
  const pendentes = r.rumores.filter((x) => x.estado === 'relato');
  if (!pendentes.length) return [];
  let corrigidos = 0;
  for (const rumor of pendentes) {
    rumor.estado = rumor.tipo === 'falso' ? 'desmentido' : 'confirmado';
    if (rumor.tipo !== 'verdadeiro') corrigidos++;
  }
  character.reputacao += corrigidos;
  const confirmados = pendentes.length - corrigidos;
  return [
    `Você confere o que ouviu sobre ${especie.nome}: ${confirmados} relato(s) confirmado(s), ${corrigidos} falso(s) ou exagerado(s) corrigido(s)${corrigidos ? ` — os caçadores da região agradecem (reputação +${corrigidos})` : ''}.`,
  ];
}

export function especieDoInimigo(nome: string): EspecieBesta | undefined {
  return [...ESPECIES].sort((a, b) => b.nome.length - a.nome.length).find((e) => nome.includes(e.nome));
}

/** Toda luta contra uma besta ensina algo: encontros levam a "Estudada"; vitórias, a "Compreendida". */
export function registrarEncontroBesta(character: Character, nomeInimigo: string, vitoria: boolean): string[] {
  const especie = especieDoInimigo(nomeInimigo);
  if (!especie) return [];
  const r = registro(character, especie.id);
  r.encontros += 1;
  if (vitoria) r.derrotadas += 1;
  r.ultimaRegiao = character.local.regiao;
  const alvo: NivelConhecimento = r.derrotadas >= 2 ? 3 : r.encontros >= 3 ? 2 : 1;
  return elevarConhecimento(character, especie, alvo, `Enfrentada ${r.encontros} vez(es), vencida ${r.derrotadas}.`);
}

export function vivesNaRegiao(especie: EspecieBesta, regiao: RegiaoId): boolean {
  return especie.regioes.length === 0 || especie.regioes.includes(regiao);
}

export function bloqueioRastrear(character: Character, mundo: MundoState | undefined, especie: EspecieBesta, energia: number): string | null {
  const nivel = nivelConhecimento(character, mundo, especie);
  if (nivel === 0) return 'Você ainda não sabe o que procurar';
  if (nivel >= 3) return 'Os rastros não têm mais nada a ensinar';
  if (!vivesNaRegiao(especie, character.local.regiao)) return 'Esta besta não vive nesta região';
  if (character.idadeMeses < 12 * 12) return 'Requer 12 anos';
  if (energia < ENERGIA_RASTREAR) return 'Sem energia';
  return null;
}

/** Dificuldade de seguir rastros: linhagens nobres escondem melhor seus sinais. */
export function dificuldadeRastrear(character: Character, mundo: MundoState | undefined, especie: EspecieBesta): number {
  const ordem = ['Comum', 'Espiritual', 'Demoníaca', 'Divina', 'Ancestral'].indexOf(especie.linhagem);
  return 11 + ordem * 3 + (nivelConhecimento(character, mundo, especie) >= 2 ? 4 : 0);
}

/** A pista que cada nível revela, tirada da ficha da espécie. */
export function pistaDoNivel(especie: EspecieBesta, nivel: NivelConhecimento): string {
  const ficha = FICHAS[especie.id];
  if (!ficha) return especie.descricao;
  if (nivel >= 3) return ficha.fraqueza;
  if (nivel >= 2) return ficha.comportamento;
  return ficha.nicho;
}

export function codinome(especie: EspecieBesta): string {
  const papel = FICHAS[especie.id]?.papelEcologico[0];
  const elemento: Record<string, string> = { agua: 'das águas', fogo: 'do fogo', madeira: 'das florestas', metal: 'do metal', terra: 'da terra' };
  const base = papel ? NOME_PAPEL[papel] : 'Criatura';
  return `${base} ${especie.elemento ? elemento[especie.elemento] : 'sem nome'}`;
}

const FALSOS = [
  'só ataca em noites de lua cheia',
  'foge de quem carrega ferro frio',
  'o sangue dela cura qualquer ferida, até meridianos partidos',
  'nunca atravessa água corrente',
  'obedece a quem lhe oferecer vinho de arroz',
  'perde toda a força ao meio-dia',
  'enxerga só o que se move',
  'dorme um ano inteiro depois de comer',
];

/**
 * Rumor de caçador sobre uma espécie da região que você ainda conhece pouco. Pode ser verdade,
 * exagero ou pura invenção — a confiabilidade é só a impressão que o caçador passou.
 */
export function ouvirRumor(character: Character, mundo: MundoState | undefined): { especie: EspecieBesta; rumor: RumorBesta; mensagens: string[] } | null {
  const candidatas = ESPECIES.filter((e) => vivesNaRegiao(e, character.local.regiao) && nivelConhecimento(character, mundo, e) <= 2);
  if (!candidatas.length) return null;
  const pesadas = candidatas.flatMap((e) => Array(Math.max(1, Math.round(LINHAGENS[e.linhagem].raridade * 2))).fill(e) as EspecieBesta[]);
  const especie = escolher(pesadas);
  const ficha = FICHAS[especie.id];
  const sorteio = Math.random();
  const tipo: TipoRumor = sorteio < 0.55 ? 'verdadeiro' : sorteio < 0.75 ? 'exagerado' : 'falso';
  const verdade = ficha ? escolher([ficha.comportamento, ficha.fraqueza, ficha.assinatura]).split('.')[0].toLowerCase() : especie.descricao.toLowerCase();
  const texto =
    tipo === 'verdadeiro'
      ? `Dizem que a ${especie.nome}: ${verdade}.`
      : tipo === 'exagerado'
        ? `Juram que a ${especie.nome}: ${verdade} — e que é três vezes maior do que qualquer um imagina.`
        : `Contam que a ${especie.nome} ${escolher(FALSOS)}.`;
  const confiabilidade = Math.round((tipo === 'verdadeiro' ? inteiro(55, 90) : tipo === 'exagerado' ? inteiro(40, 75) : inteiro(30, 70)) ) / 100;
  const rumor: RumorBesta = { id: Math.random().toString(36).slice(2, 9), texto, confiabilidade, tipo, estado: 'relato' };
  const r = registro(character, especie.id);
  r.rumores.push(rumor);
  const mensagens = [`Um caçador na taverna conta: "${texto}" (parece ${confiabilidade >= 0.6 ? 'provável' : 'duvidoso'}).`];
  mensagens.push(...elevarConhecimento(character, especie, 1));
  return { especie, rumor, mensagens };
}

/** Sinal de fraqueza mostrado na luta quando você já compreende a espécie. */
export function fraquezaConhecida(character: Character, especie: EspecieBesta): string | null {
  if (nivelConhecimento(character, undefined, especie) < 3) return null;
  return FICHAS[especie.id]?.fraqueza.split('.')[0] ?? null;
}

export function rotuloConfiabilidade(rumor: RumorBesta): string {
  if (rumor.estado === 'confirmado') return rumor.tipo === 'exagerado' ? 'confirmado (exagerado)' : 'confirmado';
  if (rumor.estado === 'desmentido') return 'desmentido';
  return rumor.confiabilidade >= 0.6 ? 'relato provável' : 'relato duvidoso';
}

/** Conhecida = pelo menos "Reconhecida" (nível 1). */
export function especieConhecida(character: Character, mundo: MundoState | undefined, especie: EspecieBesta): boolean {
  return nivelConhecimento(character, mundo, especie) >= 1;
}
