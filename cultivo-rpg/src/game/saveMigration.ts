import { SAVE_VERSION, SaveData } from '../shared/types';
import { createEstilos } from './martialStyles';
import { createProfissoes } from './professions';
import { createMundo } from './worldState';
import { ENERGIA_POR_ESTACAO } from './story';

/**
 * Atualiza saves de versões antigas preenchendo tudo que foi adicionado depois com valores padrão,
 * em vez de descartá-los. Saves anteriores à história procedural (sem `historia`) não têm como migrar.
 */
type Json = any;

function preencher<T extends object>(alvo: Json, padrao: T): T {
  const resultado: Json = alvo && typeof alvo === 'object' ? alvo : {};
  for (const [chave, valor] of Object.entries(padrao)) {
    if (resultado[chave] === undefined || resultado[chave] === null) {
      resultado[chave] = valor;
    }
  }
  return resultado as T;
}

/** Correções pequenas que valem para qualquer versão (dados criados antes de um sistema existir). */
function normalizar(dados: Json): void {
  const c = dados.character;
  for (const r of c.relacoes ?? []) {
    // Rixas criadas antes de existir a força do Patriarca inimigo.
    if (r.tipo === 'Inimigo Jurado' && (r.rank ?? 1) <= 1) {
      r.rank = Math.min(10, Math.max(2, (c.cultivo?.rank ?? 1) + 2));
      r.estagio = 5;
    }
  }
}

export function migrarSave(dados: Json): SaveData | null {
  if (!dados || typeof dados !== 'object' || !dados.character || !dados.historia) return null;
  if (typeof dados.versao === 'number' && dados.versao > SAVE_VERSION) return null;
  normalizar(dados);
  if (dados.versao === SAVE_VERSION) return dados as SaveData;

  const c = dados.character;
  const origem = c.origem ?? {};
  preencher(origem, { familiaDomadora: false, herancaSelada: false, reencarnacao: null });
  c.origem = origem;

  preencher(c, {
    tecnicas: [],
    companheira: null,
    relacoes: [],
    cicatrizes: [],
    contribuicao: 0,
    ocupacao: null,
    reputacao: 0,
    idadeMeses: 12 * 12,
    flags: {},
    local: { regiao: origem.regiao ?? 'leste', cidade: origem.cidade ?? 'Porto do Salgueiro' },
  });

  c.estilos = { ...createEstilos(), ...(c.estilos ?? {}) };
  c.profissoes = { ...createProfissoes(), ...(c.profissoes ?? {}) };
  c.cultivo = preencher(c.cultivo, { rank: 1, estagio: 1, progresso: 0, toxina: 0 });
  if (c.companheira) {
    preencher(c.companheira, { vinculo: 30, idade: 0, deInfancia: false, modoEvolucao: 'independente', progresso: 0 });
  }
  if (typeof c.vidaAtual !== 'number' || c.vidaAtual <= 0) c.vidaAtual = 1;

  const h = dados.historia;
  preencher(h, { turno: 0, avisos: [], recentes: [], energia: ENERGIA_POR_ESTACAO, contagemAtividades: {}, desfecho: null });
  h.mundo = { ...createMundo(), ...(h.mundo ?? {}) };
  h.mundo.torres = h.mundo.torres ?? {};

  dados.versao = SAVE_VERSION;
  return dados as SaveData;
}
