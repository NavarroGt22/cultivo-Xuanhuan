import type { Character } from './character';
import type { StoryState } from './story';
import { realmLabel } from './cultivation';

export interface RegistroJornada {
  turno: number;
  idadeMeses: number;
  categoria: 'historia' | 'atividade' | 'marco';
  titulo: string;
  texto: string;
}

export const LIMITE_DIARIO = 300;

export interface CronicaAncestral {
  nome: string;
  idadeMeses: number;
  reino: string;
  reputacao: number;
  registros: RegistroJornada[];
}

export function arquivarVida(c: Character, h: StoryState): CronicaAncestral {
  return { nome: c.nome, idadeMeses: c.idadeMeses, reino: realmLabel(c.cultivo), reputacao: c.reputacao,
    registros: (h.diario ?? []).map(r => ({ ...r })) };
}

export function registrarJornada(c: Character, h: StoryState, categoria: RegistroJornada['categoria'], titulo: string, texto: string): void {
  h.diario = [...(h.diario ?? []), { turno: h.turno, idadeMeses: c.idadeMeses, categoria, titulo, texto }].slice(-LIMITE_DIARIO);
}

/** Compara estados, sem inventar acontecimentos anteriores à instalação do diário. */
export function atualizarMarcos(c: Character, h: StoryState): void {
  const atual: Record<string, string> = {
    cultivo: realmLabel(c.cultivo),
    local: `${c.local.cidade} (${c.local.regiao})`,
    afiliacao: `${c.afiliacao.nome} — ${c.afiliacao.posto}`,
    tecnicas: String(c.tecnicas.length),
    objetivos: String(h.mundo.campanhaResgatada.length),
  };
  const anteriores = h.marcosDiario;
  if (!anteriores && !h.diario?.length) {
    registrarJornada(c, h, 'marco', 'O início das crônicas', h.turno === 0
      ? `A jornada de ${c.nome} começa. Cada escolha deixa uma marca no mundo.`
      : 'O diário começa a registrar sua jornada a partir deste momento. Acontecimentos anteriores não estão disponíveis.');
  }
  if (anteriores) {
    const titulos: Record<string, string> = { cultivo: 'Um novo estágio', local: 'Novos horizontes', afiliacao: 'Um novo lugar no mundo', tecnicas: 'Conhecimento marcial', objetivos: 'Objetivo cumprido' };
    for (const chave of Object.keys(atual)) {
      if (anteriores[chave] !== atual[chave]) {
        const texto = chave === 'tecnicas' ? `${atual[chave]} técnicas conhecidas.`
          : chave === 'objetivos' ? `${atual[chave]} objetivos da campanha resgatados.` : atual[chave];
        registrarJornada(c, h, 'marco', titulos[chave], texto);
      }
    }
  }
  h.marcosDiario = atual;
}
