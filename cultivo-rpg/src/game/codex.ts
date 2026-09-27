import type { Character } from './character';
import type { MundoState } from './worldState';
import { REGIOES } from './world';
import { SUPREMAS } from './supremeSects';
import { TECNICAS, getTecnica } from './techniques';
import { ESPECIES } from './bestiary';
import { HERANCAS } from './inheritance';
import { especieDaCompanheira } from './companion';

/**
 * GDD 15.5 — Codex: o que o personagem descobre (regiões, Seitas Supremas, seitas e clãs, técnicas,
 * bestas, heranças) é registrado sozinho, lendo os textos de cada evento. Fica no mundo, então
 * o conhecimento passa ao herdeiro. As pessoas vêm direto de Relações.
 */
export type CategoriaCodex = 'regioes' | 'supremas' | 'faccoes' | 'tecnicas' | 'bestas' | 'herancas';

export const NOME_CATEGORIA: Record<CategoriaCodex, string> = {
  regioes: 'Regiões',
  supremas: 'Seitas Supremas',
  faccoes: 'Seitas e Clãs',
  tecnicas: 'Técnicas',
  bestas: 'Bestas',
  herancas: 'Heranças',
};

export function entradasCodex(mundo: MundoState | undefined, categoria: CategoriaCodex): string[] {
  return mundo?.codex?.[categoria] ?? [];
}

export function totalCodex(mundo?: MundoState): number {
  return (Object.keys(NOME_CATEGORIA) as CategoriaCodex[]).reduce((soma, cat) => soma + entradasCodex(mundo, cat).length, 0);
}

function nomesConhecidos(mundo: MundoState): Record<CategoriaCodex, string[]> {
  const supremas = new Set(SUPREMAS.map((s) => s.nome));
  const faccoes = Object.values(mundo.faccoesPorRegiao ?? {}).flatMap((lista) => (lista ?? []).map((f) => f.nome)).filter((n) => !supremas.has(n));
  return {
    regioes: Object.values(REGIOES).map((r) => r.nome),
    supremas: [...supremas],
    faccoes,
    tecnicas: TECNICAS.map((t) => t.nome),
    bestas: ESPECIES.map((e) => e.nome),
    herancas: HERANCAS.map((h) => h.nome),
  };
}

/** Registra o que aparece no texto e o que o personagem já tem; retorna o aviso das novidades. */
export function registrarNoCodex(mundo: MundoState, character: Character, texto: string): string[] {
  const codex = (mundo.codex = mundo.codex ?? {});
  const novos: string[] = [];
  const adicionar = (categoria: CategoriaCodex, nome: string | undefined): void => {
    if (!nome) return;
    const lista = (codex[categoria] = codex[categoria] ?? []);
    if (lista.includes(nome)) return;
    lista.push(nome);
    novos.push(nome);
  };

  adicionar('regioes', REGIOES[character.local.regiao].nome);
  const afiliacao = character.afiliacao.nome;
  if (SUPREMAS.some((s) => s.nome === afiliacao)) adicionar('supremas', afiliacao);
  for (const id of character.tecnicas) adicionar('tecnicas', getTecnica(id)?.nome);
  if (character.companheira) adicionar('bestas', especieDaCompanheira(character.companheira)?.nome);
  for (const h of HERANCAS) if (character.flags[`heranca:${h.id}`]) adicionar('herancas', h.nome);

  const conhecidos = nomesConhecidos(mundo);
  for (const categoria of Object.keys(conhecidos) as CategoriaCodex[]) {
    for (const nome of conhecidos[categoria]) if (texto.includes(nome)) adicionar(categoria, nome);
  }
  if (conhecidos.faccoes.includes(afiliacao)) adicionar('faccoes', afiliacao);

  if (!novos.length) return [];
  const lista = novos.length > 3 ? `${novos.slice(0, 3).join(', ')} e mais ${novos.length - 3}` : novos.join(', ');
  return [`Novo no Codex: ${lista}.`];
}
