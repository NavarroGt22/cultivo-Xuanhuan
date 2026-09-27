import { Character } from '../../game/character';
import { TITULO_RANKING, TipoRanking, ranking } from '../../game/rankings';
import { NOME_TIPO_FACCAO, rankingFaccoes } from '../../game/regionalFactions';
import { rankingMercadores, tituloReputacao } from '../../game/merchantGroups';
import { REGIOES, RegiaoId } from '../../game/world';
import { StoryState } from '../../game/story';
import { criarOverlay, escapeHtml } from './dom';

const TAMANHO_TOP = 10;
type Aba = TipoRanking | 'seitas' | 'clas' | 'mercadores';
const ROTULO_ABA: Record<'seitas' | 'clas' | 'mercadores', string> = { seitas: 'Seitas', clas: 'Clãs', mercadores: 'Grupos Mercadores' };
const ORDEM_REGIOES = (Object.keys(REGIOES) as RegiaoId[]).sort((a, b) => REGIOES[a].posicao - REGIOES[b].posicao);

function tabelaPessoas(character: Character, historia: StoryState, aba: TipoRanking, regiao: RegiaoId): string {
  const lista = ranking(historia.mundo, character, aba, regiao);
  const posicao = lista.findIndex((e) => e.jogador);
  const linhas = lista
    .slice(0, TAMANHO_TOP)
    .map(
      (entrada, i) => `
      <tr class="${entrada.jogador ? 'linha-jogador' : ''}">
        <td>#${i + 1}</td>
        <td>${escapeHtml(entrada.nome)}</td>
        <td>${escapeHtml(entrada.detalhe)}</td>
        <td>${escapeHtml(entrada.afiliacao)}</td>
      </tr>`,
    )
    .join('');
  const aqui = regiao === character.local.regiao;
  const suaPosicao = !aqui
    ? `<p class="dica">Você está ${REGIOES[character.local.regiao].preposicao === 'na' ? 'na' : 'no'} ${escapeHtml(REGIOES[character.local.regiao].nome)}: só aparece no ranking da região onde está.</p>`
    : posicao < 0
      ? `<p class="dica">${aba === 'alquimia' ? 'Aprenda Alquimia para entrar neste ranking.' : aba === 'talento' ? 'Só entram cultivadores de até 40 anos com a raiz revelada.' : ''}</p>`
      : posicao >= TAMANHO_TOP
        ? `<p class="dica">Sua posição: <strong>#${posicao + 1}</strong> de ${lista.length}.</p>`
        : '';
  return `
    <table class="tabela-ranking">
      <thead><tr><th></th><th>Nome</th><th>${aba === 'alquimia' ? 'Título' : 'Cultivo'}</th><th>Afiliação</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    ${suaPosicao}`;
}

function tabelaMercadores(character: Character, historia: StoryState): string {
  const linhas = rankingMercadores(historia.mundo)
    .map(({ grupo, riqueza }, i) => {
      const rel = character.mercadores?.[grupo.id];
      return `
      <tr class="${rel?.cotas ? 'linha-jogador' : ''}">
        <td>#${i + 1}</td>
        <td>${escapeHtml(grupo.nome)}<br /><small>${escapeHtml(grupo.especialidade)}</small></td>
        <td>${escapeHtml(REGIOES[grupo.sede].nome)}</td>
        <td>${riqueza.toLocaleString('pt-BR')}</td>
        <td>${rel ? `${rel.cotas} cota(s) · ${tituloReputacao(rel.reputacao)}` : '—'}</td>
      </tr>`;
    })
    .join('');
  return `
    <table class="tabela-ranking">
      <thead><tr><th></th><th>Grupo</th><th>Sede</th><th>Riqueza</th><th>Você</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="dica">Os grandes grupos mercadores atravessam as cinco regiões. Negocie com eles no Mercado → Grandes Grupos Mercadores.</p>`;
}

function tabelaFaccoes(character: Character, historia: StoryState, regiao: RegiaoId, filtro: 'seitas' | 'clas'): string {
  const lista = rankingFaccoes(historia.mundo, character, regiao, filtro);
  const cronica = (historia.mundo.cronicaFaccoes ?? []).slice(0, 5);
  const linhas = lista
    .map(
      (f, i) => `
      <tr class="${f.sua ? 'linha-jogador' : ''}">
        <td>#${i + 1}</td>
        <td>${escapeHtml(f.nome)}${f.sua ? ' (sua)' : ''}<br /><small>${NOME_TIPO_FACCAO[f.tipo]}${f.ortodoxa ? '' : ' · não-ortodoxa'}${f.emGuerraCom ? ` · em guerra com ${escapeHtml(f.emGuerraCom)}` : ''}</small></td>
        <td>${escapeHtml(f.lider)}</td>
        <td>${f.membros.toLocaleString('pt-BR')}</td>
        <td>${f.poder.toLocaleString('pt-BR')}</td>
      </tr>`,
    )
    .join('');
  return `
    <table class="tabela-ranking">
      <thead><tr><th></th><th>Seita / Clã</th><th>Líder</th><th>Membros</th><th>Poder</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="dica">O poder soma a força do líder, o número de membros e os cultivadores conhecidos de cada facção. ${
      filtro === 'clas'
        ? 'Clãs dependem do próprio sangue e raramente superam uma seita — só os clãs ancestrais chegam lá.'
        : 'As Seitas Supremas atraem os melhores discípulos das seitas menores com recursos que elas não podem igualar.'
    } Guerras mudam o ranking com o tempo.</p>
    ${cronica.length ? `<h3>Notícias do mundo das facções</h3><ul class="ficha">${cronica.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : ''}`;
}

export function abrirRankings(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let aba: Aba = 'forca';
  let regiao: RegiaoId = character.local.regiao;

  const render = (): void => {
    const abas = ([...(Object.keys(TITULO_RANKING) as TipoRanking[]), 'seitas', 'clas', 'mercadores'] as Aba[])
      .map((tipo) => `<button class="aba ${tipo === aba ? 'ativa' : ''}" data-aba="${tipo}">${tipo === 'seitas' || tipo === 'clas' || tipo === 'mercadores' ? ROTULO_ABA[tipo] : TITULO_RANKING[tipo]}</button>`)
      .join('');
    const conteudo =
      aba === 'mercadores'
        ? tabelaMercadores(character, historia)
        : aba === 'seitas' || aba === 'clas'
          ? tabelaFaccoes(character, historia, regiao, aba)
          : tabelaPessoas(character, historia, aba, regiao);
    const regioes = ORDEM_REGIOES.map(
      (id) =>
        `<button class="aba ${id === regiao ? 'ativa' : ''}" data-regiao="${id}">${escapeHtml(REGIOES[id].nome)}${id === character.local.regiao ? ' •' : ''}</button>`,
    ).join('');

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Rankings — ${escapeHtml(REGIOES[regiao].nome)}</h2>
        <div class="abas" aria-label="Região">${regioes}</div>
        <div class="abas" aria-label="Ranking">${abas}</div>
        ${conteudo}
        <p class="dica">Os cultivadores e as facções de cada região também avançam com o tempo. Duelos no quadro de missões enfrentam pessoas do ranking da região onde você está (•).</p>
      </div>`;
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      aoAlterar();
      return;
    }
    const botaoAba = alvo.closest<HTMLElement>('[data-aba]');
    if (botaoAba?.dataset.aba) {
      aba = botaoAba.dataset.aba as Aba;
      render();
      return;
    }
    const botaoRegiao = alvo.closest<HTMLElement>('[data-regiao]');
    if (botaoRegiao?.dataset.regiao) {
      regiao = botaoRegiao.dataset.regiao as RegiaoId;
      render();
    }
  });

  render();
}
