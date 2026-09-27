import type { Character } from '../../game/character';
import { alternarModoEvolucao, especieDaCompanheira, faseDaCompanheira, linhagemDaCompanheira, tetoDeReino } from '../../game/companion';
import { FATOR_FASE } from '../../game/bestiary';
import { REINOS } from '../../game/cultivation';
import { descreverCultivo } from '../../game/npcs';
import { tituloProfissao } from '../../game/professions';
import { escapeHtml } from './dom';

/** Cartão da besta companheira (mostrado no Bestiário). */
export function renderCompanheira(character: Character): string {
  const besta = character.companheira;
  if (!besta) return '';
  const fase = faseDaCompanheira(besta);
  const especie = especieDaCompanheira(besta);
  const teto = tetoDeReino(besta);
  return `
    <section class="guia-item">
      <p class="eyebrow">Sua besta companheira</p>
      <h3>${escapeHtml(besta.nome)} — ${escapeHtml(besta.especie)}</h3>
      <p>Linhagem <strong>${linhagemDaCompanheira(besta)}</strong> · <strong>${fase}</strong> (força em combate ×${FATOR_FASE[fase].toLocaleString('pt-BR')}) · ${escapeHtml(descreverCultivo(besta.rank, besta.estagio))} (${Math.floor(besta.progresso)}%)</p>
      <p>Vínculo ${Math.round(besta.vinculo)}/100 · ${Math.floor(besta.idade)} anos${especie ? ` (adulta aos ${especie.maturidade})` : ''}${besta.deInfancia ? ' · criada com você desde a infância' : ''}</p>
      <p>Teto nesta fase: ${escapeHtml(REINOS[teto - 1]?.nome ?? '')}${especie ? ` · teto da espécie: ${escapeHtml(REINOS[especie.reinos[1] - 1]?.nome ?? '')}` : ''}. ${fase === 'Filhote' ? 'Filhotes não rompem reinos: ela precisa crescer.' : ''}</p>
      <p>Domador: ${escapeHtml(tituloProfissao('domador', character.profissoes.domador) ?? 'não é domador')} · ${
        besta.deInfancia ? '<strong>Vínculo de Nascença</strong>: pode alcançar a Técnica de Fusão em combate.' : 'Contrato de alma: alcança Ataques Combinados (Fusão só com vínculo perfeito).'
      }</p>
      <p>Evolução: <strong>${besta.modoEvolucao === 'conjunta' ? 'Conjunta' : 'Independente'}</strong> — ${
        besta.modoEvolucao === 'conjunta' ? 'sobe de reino com você, até o limite da idade dela.' : 'cultiva no próprio ritmo, pode te ultrapassar ou ficar para trás, e às vezes encontra tesouros sozinha.'
      }</p>
      <div class="acoes"><button data-acao="modo-besta">Mudar para evolução ${besta.modoEvolucao === 'conjunta' ? 'independente' : 'conjunta'}</button></div>
    </section>`;
}

/** Trata o clique no cartão; devolve as mensagens, ou null se o clique não era dele. */
export function tratarCliqueCompanheira(alvo: HTMLElement, character: Character): string[] | null {
  if (!alvo.closest('[data-acao="modo-besta"]') || !character.companheira) return null;
  return [alternarModoEvolucao(character.companheira)];
}
