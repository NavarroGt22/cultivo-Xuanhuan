import type { Character } from '../../game/character';
import type { StoryState } from '../../game/story';
import { CategoriaCodex, NOME_CATEGORIA, entradasCodex, totalCodex } from '../../game/codex';
import { REGIOES } from '../../game/world';
import { SUPREMAS, nivelReputacao, reputacaoSuprema } from '../../game/supremeSects';
import { TECNICAS, nomeGrau } from '../../game/techniques';
import { ESPECIES } from '../../game/bestiary';
import { HERANCAS } from '../../game/inheritance';
import { NOME_ELEMENTO } from '../../game/spiritualRoot';
import { descreverCultivo } from '../../game/npcs';
import { descreverRelacao, ehRelacaoDePoder } from '../../game/relationships';
import { criarOverlay, escapeHtml } from './dom';

type Aba = CategoriaCodex | 'pessoas';
const ABAS: Aba[] = ['regioes', 'supremas', 'faccoes', 'tecnicas', 'bestas', 'herancas', 'pessoas'];
const normalizar = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

interface Entrada {
  titulo: string;
  subtitulo: string;
  texto: string;
}

function entradas(character: Character, historia: StoryState, aba: Aba): Entrada[] {
  const mundo = historia.mundo;
  if (aba === 'pessoas') {
    return character.relacoes
      .filter((r) => !ehRelacaoDePoder(r))
      .map((r) => ({ titulo: r.nome, subtitulo: r.tipo, texto: descreverRelacao(r) }));
  }
  const nomes = entradasCodex(mundo, aba);
  const lista: (Entrada | null | undefined)[] = nomes.map((nome) => {
    if (aba === 'regioes') {
      const r = Object.values(REGIOES).find((x) => x.nome === nome);
      return r && { titulo: r.nome, subtitulo: `${r.posicao}º em força`, texto: `${r.descricao} Cidades: ${r.cidades.join(', ')}. Fauna: ${r.fauna.join(', ')}.` };
    }
    if (aba === 'supremas') {
      const s = SUPREMAS.find((x) => x.nome === nome);
      if (!s) return null;
      const valor = reputacaoSuprema(character, s.nome);
      return { titulo: s.nome, subtitulo: `Seita Suprema ${s.ortodoxa ? 'ortodoxa' : 'demoníaca'} · ${REGIOES[s.regiao].nome}`, texto: `Sua reputação: ${nivelReputacao(valor)} (${valor}).` };
    }
    if (aba === 'faccoes') {
      const f = Object.values(mundo.faccoesPorRegiao ?? {}).flatMap((l) => l ?? []).find((x) => x.nome === nome);
      return f && { titulo: f.nome, subtitulo: `${f.tipo === 'cla' ? 'Clã' : 'Seita'}${f.ortodoxa ? '' : ' não-ortodoxa'} · ${REGIOES[f.regiao].nome}`, texto: `Líder: ${f.lider.nome}, ${descreverCultivo(f.lider.rank, f.lider.estagio)}. ${f.membros} membros.` };
    }
    if (aba === 'tecnicas') {
      const t = TECNICAS.find((x) => x.nome === nome);
      return t && { titulo: t.nome, subtitulo: `${nomeGrau(t)}${character.tecnicas.includes(t.id) ? ' · você conhece' : ''}`, texto: t.descricao };
    }
    if (aba === 'bestas') {
      const e = ESPECIES.find((x) => x.nome === nome);
      return e && { titulo: e.nome, subtitulo: `Linhagem ${e.linhagem}${e.elemento ? ` · ${NOME_ELEMENTO[e.elemento]}` : ''}`, texto: e.descricao };
    }
    const h = HERANCAS.find((x) => x.nome === nome);
    return h && { titulo: h.nome, subtitulo: `${h.dono}${character.flags[`heranca:${h.id}`] ? ' · despertada por você' : ''}`, texto: h.descricao };
  });
  return lista.filter((e): e is Entrada => Boolean(e)).sort((a, b) => a.titulo.localeCompare(b.titulo));
}

/** Codex (GDD 15.5): tudo o que o personagem (e a família) já descobriu. */
export function abrirCodex(character: Character, historia: StoryState): void {
  const overlay = criarOverlay();
  const totalPossivel = Object.keys(REGIOES).length + SUPREMAS.length + TECNICAS.length + ESPECIES.length + HERANCAS.length;
  overlay.innerHTML = `<section class="painel painel-jornada">
    <button class="fechar" aria-label="Fechar">×</button><p class="eyebrow">Pavilhão do conhecimento</p>
    <h2>Codex</h2>
    <p class="descricao">Tudo o que você viu e ouviu ao longo da jornada é anotado aqui sozinho: regiões, Seitas Supremas, seitas e clãs,
    técnicas, bestas e heranças. O conhecimento fica com a família e passa ao herdeiro. ${totalCodex(historia.mundo)} entradas descobertas
    (de ${totalPossivel}+ no mundo, sem contar seitas e clãs).</p>
    <label class="busca-label">Pesquisar<input type="search" class="busca-jornada" placeholder="Nome ou descrição…" /></label>
    <div class="abas" role="group" aria-label="Categoria"></div><div class="conteudo-jornada"></div></section>`;

  const busca = overlay.querySelector<HTMLInputElement>('input')!;
  let aba: Aba = 'regioes';
  const render = (): void => {
    overlay.querySelector('.abas')!.innerHTML = ABAS.map((id) => {
      const rotulo = id === 'pessoas' ? 'Pessoas' : NOME_CATEGORIA[id];
      const quantidade = entradas(character, historia, id).length;
      return `<button class="aba ${aba === id ? 'ativa' : ''}" data-aba="${id}" aria-pressed="${aba === id}">${rotulo} (${quantidade})</button>`;
    }).join('');
    const termo = normalizar(busca.value);
    const lista = entradas(character, historia, aba).filter((e) => normalizar(`${e.titulo} ${e.subtitulo} ${e.texto}`).includes(termo));
    overlay.querySelector('.conteudo-jornada')!.innerHTML =
      lista.map((e) => `<article class="guia-item"><small>${escapeHtml(e.subtitulo)}</small><h3>${escapeHtml(e.titulo)}</h3><p>${escapeHtml(e.texto)}</p></article>`).join('') ||
      '<p class="estado-vazio">Nada anotado aqui ainda. Explore o mundo — o Codex se preenche sozinho.</p>';
  };
  overlay.addEventListener('click', (e) => {
    const alvo = e.target as HTMLElement;
    if (e.target === overlay || alvo.closest('.fechar')) {
      overlay.remove();
      return;
    }
    const id = alvo.closest<HTMLElement>('[data-aba]')?.dataset.aba;
    if (id) {
      aba = id as Aba;
      render();
    }
  });
  busca.addEventListener('input', render);
  render();
}
