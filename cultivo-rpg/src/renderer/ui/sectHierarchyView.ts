import type { Character } from '../../game/character';
import type { DesfechoExibido, StoryState } from '../../game/story';
import { descreverEscolha, executarEscolha, gastarEnergia } from '../../game/story';
import { descreverCultivo, faixaBesta, inimigoDoNpc } from '../../game/npcs';
import { aplicarVitoriaDesafio, ordenarRoster, podeDesafiar } from '../../game/sectRoster';
import { rosterDaSeita } from '../../game/worldState';
import { motivoBloqueioDestruirNucleo } from '../../game/coreDestruction';
import { aleijarNpc } from '../../game/bounties';
import { aplicarEfeitos } from '../../game/effects';
import { escapeHtml } from './dom';

export const ENERGIA_DESAFIO = 2;
let dueloDemoniaco = false;

/** Hierarquia da seita (Líder, Anciões, discípulos) com os desafios por vaga. Mostrada em Seita e Ocupação. */
export function renderHierarquiaSeita(character: Character, historia: StoryState): string {
  const roster = rosterDaSeita(historia.mundo, character);
  if (!roster) return '';
  const semEnergia = historia.energia < ENERGIA_DESAFIO;
  let postoAtual = '';
  const linhas = ordenarRoster(roster)
    .map((membro) => {
      const cabecalho = membro.posto !== postoAtual ? `<tr class="grupo-posto"><td colspan="4">${escapeHtml(membro.posto)}</td></tr>` : '';
      postoAtual = membro.posto;
      const botao = podeDesafiar(character, membro)
        ? `<button class="botao-pequeno" data-desafiar="${membro.id}" ${semEnergia ? 'disabled' : ''}>Desafiar</button>`
        : '';
      return `${cabecalho}
        <tr>
          <td>${escapeHtml(membro.nome)}</td>
          <td>${escapeHtml(descreverCultivo(membro.rank, membro.estagio))}</td>
          <td>${Math.floor(membro.idade)} anos · Raiz ${membro.raizGrau}</td>
          <td>${botao}</td>
        </tr>`;
    })
    .join('');
  const bestas = roster.bestas
    .map((b) => `<li><strong>${escapeHtml(b.nome)}</strong> <small>— ${faixaBesta(b.rank)} · ${escapeHtml(descreverCultivo(b.rank, b.estagio))}</small></li>`)
    .join('');
  return `
    <p class="dica">Você: <strong>${escapeHtml(character.afiliacao.posto)}</strong>. Desafie discípulos do seu posto para subir no conceito da seita,
    ou do posto acima para <strong>tomar a vaga deles</strong> (${ENERGIA_DESAFIO} de energia).</p>
    <label class="opcao"><input type="checkbox" id="duelo-demoniaco" ${dueloDemoniaco ? 'checked' : ''} />
      Duelo Demoníaco: destruir o núcleo de quem eu vencer (exige vantagem de cultivo; alinhamento −25, Inimigo Jurado${
        character.afiliacao.ortodoxa ? ', <strong>expulsão desta seita ortodoxa</strong>' : ''
      })</label>
    <table class="tabela-ranking">
      <thead><tr><th>Nome</th><th>Cultivo</th><th>Idade · Raiz</th><th></th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <h3>Bestas Guardiãs da Seita</h3>
    <ul class="ficha">${bestas}</ul>`;
}

export function tratarMudancaHierarquia(alvo: HTMLInputElement): void {
  if (alvo.id === 'duelo-demoniaco') dueloDemoniaco = alvo.checked;
}

/** Desafio a um membro da seita. Devolve o resultado, ou null se o clique não era daqui. */
export function tratarCliqueHierarquia(
  alvo: HTMLElement,
  character: Character,
  historia: StoryState,
): { resultado: DesfechoExibido; extras: string[]; titulo: string } | null {
  const botao = alvo.closest<HTMLButtonElement>('[data-desafiar]');
  if (!botao || botao.disabled) return null;
  const roster = rosterDaSeita(historia.mundo, character);
  const membro = roster?.membros.find((m) => m.id === botao.dataset.desafiar);
  if (!roster || !membro || !podeDesafiar(character, membro)) return null;
  const escolha = {
    texto: `Desafiar ${membro.nome}`,
    combate: inimigoDoNpc(membro),
    resultado: { texto: `${membro.nome} cai diante de toda a seita.`, efeitos: { reputacao: 4, contribuicao: 10 } },
    falha: { texto: `${membro.nome} te derrota com facilidade. Os discípulos cochicham.`, efeitos: { reputacao: -2 } },
  };
  if (descreverEscolha(character, escolha).bloqueio || !gastarEnergia(historia, ENERGIA_DESAFIO)) return null;
  const resultado = executarEscolha(character, escolha);
  const extras = resultado.vitoria ? aplicarVitoriaDesafio(character, roster, membro) : [];
  if (resultado.vitoria && dueloDemoniaco && !motivoBloqueioDestruirNucleo(character, membro.rank, membro.estagio)) {
    const rankVitima = membro.rank;
    aleijarNpc(membro);
    membro.posto = 'Discípulo Externo';
    extras.push(...aplicarEfeitos(character, { destruirNucleo: { nome: membro.nome, afiliacao: `Mestre e aliados de ${membro.nome}`, rank: rankVitima } }));
  }
  return { resultado, extras, titulo: `Desafio: ${membro.nome}` };
}
