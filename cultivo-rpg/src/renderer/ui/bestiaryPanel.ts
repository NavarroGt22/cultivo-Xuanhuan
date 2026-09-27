import type { Character } from '../../game/character';
import { ESPECIES, EspecieBesta, FATOR_FASE, Linhagem, rankMaximoDaFase, rankNascimento } from '../../game/bestiary';
import { especieDaCompanheira } from '../../game/companion';
import { REINOS } from '../../game/cultivation';
import { NOME_ELEMENTO } from '../../game/spiritualRoot';
import { REGIOES } from '../../game/world';
import { criarOverlay, escapeHtml } from './dom';
import { renderCompanheira, tratarCliqueCompanheira } from './companionView';
import { avisar } from './resultView';

const normalizar = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const ORDEM: Linhagem[] = ['Comum', 'Espiritual', 'Demoníaca', 'Divina', 'Ancestral'];

function reino(rank: number): string {
  return `${rank} · ${REINOS[rank - 1]?.nome ?? '?'}`;
}

function cartao(e: EspecieBesta, character: Character): string {
  const regioes = e.regioes.length ? e.regioes.map((r) => REGIOES[r].nome).join(', ') : 'Todas as regiões';
  const companheira = character.companheira && especieDaCompanheira(character.companheira)?.id === e.id;
  const domada = Boolean(character.flags[`bestiario:${e.id}`]);
  const selo = companheira ? '<small class="nav-badge">Sua companheira</small>' : domada ? '<small class="nav-badge">Já domada</small>' : '';
  return `<article class="guia-item">
    <small>Linhagem ${e.linhagem}${e.elemento ? ` · ${NOME_ELEMENTO[e.elemento]}` : ''} · ${escapeHtml(regioes)}</small>
    <h3>${escapeHtml(e.nome)} ${selo}</h3>
    <p>${escapeHtml(e.descricao)}</p>
    <p><strong>Adultos selvagens:</strong> ${escapeHtml(reino(e.reinos[0]))} até ${escapeHtml(reino(e.reinos[1]))}.</p>
    <p><strong>Filhote:</strong> nasce no ${escapeHtml(reino(rankNascimento(e)))} e não rompe reinos · <strong>Jovem</strong> a partir de ${Math.ceil(e.maturidade * 0.3)} ano(s), até ${escapeHtml(REINOS[rankMaximoDaFase(e, 'Jovem') - 1].nome)} · <strong>Adulta</strong> aos ${e.maturidade} anos · <strong>Anciã</strong> aos ${e.maturidade * 5}, podendo passar do teto da espécie.</p>
  </article>`;
}

/** Bestiário: todas as espécies do jogo, suas linhagens e reinos. */
export function abrirBestiario(character: Character, aoAlterar: () => void = () => {}): void {
  const overlay = criarOverlay();
  overlay.innerHTML = `<section class="painel painel-jornada">
    <button class="fechar" aria-label="Fechar">×</button><p class="eyebrow">Pavilhão do conhecimento</p>
    <h2>Bestiário</h2>
    <p class="descricao">Todas as ${ESPECIES.length} bestas conhecidas do mundo. A força de uma besta vem da linhagem e da idade, não de quem a encontra:
    um filhote divino já nasce acima de um aprendiz, mas só luta com ${Math.round(FATOR_FASE.Filhote * 100)}% da força até crescer
    (jovem ${Math.round(FATOR_FASE.Jovem * 100)}%, adulta ${Math.round(FATOR_FASE.Adulta * 100)}%, anciã ${Math.round(FATOR_FASE['Anciã'] * 100)}%).
    Linhagens mais nobres também cultivam mais rápido.</p>
    <div class="companheira-bestiario"></div>
    <label class="busca-label">Pesquisar<input type="search" class="busca-jornada" placeholder="Nome, região ou elemento…" /></label>
    <div class="abas" role="group" aria-label="Linhagem"></div><div class="conteudo-jornada"></div></section>`;
  const desenharCompanheira = (): void => {
    overlay.querySelector('.companheira-bestiario')!.innerHTML = renderCompanheira(character);
  };
  overlay.addEventListener('click', (e) => {
    const alvo = e.target as HTMLElement;
    if (e.target === overlay || alvo.closest('.fechar')) {
      overlay.remove();
      return;
    }
    const mensagens = tratarCliqueCompanheira(alvo, character);
    if (mensagens) {
      aoAlterar();
      desenharCompanheira();
      avisar(mensagens);
    }
  });
  desenharCompanheira();

  const busca = overlay.querySelector<HTMLInputElement>('input')!;
  let filtro: Linhagem | 'todas' = 'todas';
  const render = (): void => {
    overlay.querySelector('.abas')!.innerHTML = (['todas', ...ORDEM] as const)
      .map((id) => {
        const rotulo = id === 'todas' ? 'Todas' : `${id} (${ESPECIES.filter((e) => e.linhagem === id).length})`;
        return `<button class="aba ${filtro === id ? 'ativa' : ''}" data-filtro="${id}" aria-pressed="${filtro === id}">${rotulo}</button>`;
      })
      .join('');
    const termo = normalizar(busca.value);
    const lista = ESPECIES.filter((e) => filtro === 'todas' || e.linhagem === filtro)
      .filter((e) => {
        const regioes = e.regioes.length ? e.regioes.map((r) => REGIOES[r].nome).join(' ') : 'todas as regioes';
        return normalizar(`${e.nome} ${e.linhagem} ${regioes} ${e.elemento ? NOME_ELEMENTO[e.elemento] : ''} ${e.descricao}`).includes(termo);
      })
      .sort((a, b) => ORDEM.indexOf(a.linhagem) - ORDEM.indexOf(b.linhagem) || a.reinos[0] - b.reinos[0]);
    overlay.querySelector('.conteudo-jornada')!.innerHTML =
      lista.map((e) => cartao(e, character)).join('') || '<p class="estado-vazio">Nenhuma besta encontrada. Tente outra palavra.</p>';
  };
  busca.addEventListener('input', render);
  overlay.querySelector('.abas')!.addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-filtro]')?.dataset.filtro;
    if (id) {
      filtro = id as Linhagem | 'todas';
      render();
    }
  });
  render();
}
