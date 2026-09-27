import type { Character } from '../../game/character';
import type { DesfechoExibido, StoryState } from '../../game/story';
import { gastarEnergia } from '../../game/story';
import { descreverRelacao } from '../../game/relationships';
import { ENERGIA_EXTERMINIO, exterminarFamilia, imporSubmissao, inimigoIntimidado, motivoBloqueioSubmissao } from '../../game/feuds';
import { escapeHtml } from './dom';

/** Rixas de sangue e famílias vassalas (mostradas no painel Mundo, junto da guerra). */
export function renderRixas(character: Character, historia: StoryState): string {
  const semEnergia = historia.energia < ENERGIA_EXTERMINIO;
  const cartoes = character.relacoes
    .filter((r) => r.tipo === 'Inimigo Jurado' || r.tipo === 'Vassalo')
    .map((r) => {
      if (r.tipo === 'Vassalo') {
        return `
          <div class="objetivo">
            <div><strong>${escapeHtml(r.nome)}</strong><small>Vassalo</small></div>
            <p><small>${escapeHtml(descreverRelacao(r))}</small></p>
          </div>`;
      }
      const intimidado = inimigoIntimidado(character, r);
      const bloqueioSubmissao = motivoBloqueioSubmissao(character, r);
      return `
        <div class="objetivo inimigo-jurado">
          <div><strong>${escapeHtml(r.nome)}</strong><small>Inimigo Jurado${intimidado ? ' · intimidado — não ousa agir' : ''}</small></div>
          <p><small>${escapeHtml(descreverRelacao(r))}. ${intimidado ? 'Você está tão acima deles que os vingadores pararam de vir.' : 'Enquanto a rixa durar, vingadores podem aparecer a qualquer momento.'}</small></p>
          <div class="botoes-interacao">
            <button class="botao-pequeno" data-exterminar="${r.id}" ${semEnergia ? 'disabled' : ''} title="Três lutas seguidas: guardas, ancião e Patriarca. Alinhamento −30.">
              Exterminar a família (${ENERGIA_EXTERMINIO} de energia)</button>
            <button class="botao-pequeno" data-submissao="${r.id}" ${bloqueioSubmissao ? `disabled title="${escapeHtml(bloqueioSubmissao)}"` : ''}>
              Impor submissão (virar vassalo)</button>
          </div>
          ${bloqueioSubmissao ? `<p><small>Submissão: ${escapeHtml(bloqueioSubmissao)}.</small></p>` : ''}
        </div>`;
    })
    .join('');
  return cartoes
    ? `<div class="lista-objetivos">${cartoes}</div>`
    : '<p class="vazio-texto">Nenhuma rixa de sangue nem família vassala. Destruir núcleos cria inimigos jurados; vencer guerras e impor submissão cria vassalos.</p>';
}

export function resumoRixas(character: Character): string {
  const inimigos = character.relacoes.filter((r) => r.tipo === 'Inimigo Jurado').length;
  const vassalos = character.relacoes.filter((r) => r.tipo === 'Vassalo').length;
  return `${inimigos} rixa(s) · ${vassalos} vassalo(s)`;
}

/** Trata exterminar/impor submissão. Devolve o que aconteceu, ou null se o clique não era daqui. */
export function tratarCliqueRixa(
  alvo: HTMLElement,
  character: Character,
  historia: StoryState,
): { resultado?: DesfechoExibido; titulo?: string; mensagens: string[] } | null {
  const exterminar = alvo.closest<HTMLButtonElement>('[data-exterminar]');
  const submissao = alvo.closest<HTMLButtonElement>('[data-submissao]');
  if ((!exterminar || exterminar.disabled) && (!submissao || submissao.disabled)) return null;
  const id = exterminar?.dataset.exterminar ?? submissao?.dataset.submissao;
  const inimigo = character.relacoes.find((r) => r.id === id && r.tipo === 'Inimigo Jurado');
  if (!inimigo) return { mensagens: [] };
  if (exterminar) {
    if (!gastarEnergia(historia, ENERGIA_EXTERMINIO)) return { mensagens: ['Sem energia.'] };
    return { resultado: exterminarFamilia(character, inimigo), titulo: `Extermínio: ${inimigo.nome}`, mensagens: [] };
  }
  return { mensagens: imporSubmissao(character, inimigo) };
}
