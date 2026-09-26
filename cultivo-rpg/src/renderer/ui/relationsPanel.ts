import { Character } from '../../game/character';
import { DesfechoExibido, ENERGIA_POR_ESTACAO, StoryState, descreverEscolha, executarEscolha, gastarEnergia } from '../../game/story';
import { descreverCultivo, faixaBesta, inimigoDoNpc } from '../../game/npcs';
import { MembroSeita, aplicarVitoriaDesafio, ordenarRoster, podeDesafiar } from '../../game/sectRoster';
import { rosterDaSeita } from '../../game/worldState';
import { ehDiscipulo } from '../../game/sect';
import { SOBRENOMES, NOMES } from '../../game/world';
import { escolher } from '../../game/rng';
import { criarOverlay, escapeHtml } from './dom';
import { ativarReproducao, renderEnergia, renderMensagens, renderResultado } from './resultView';
import { ENERGIA_INTERACAO, INTERACOES, descreverRelacao, limiteDoHarem, parceirosRomanticos } from '../../game/relationships';
import { ENERGIA_EXTERMINIO, exterminarFamilia, imporSubmissao, inimigoIntimidado, motivoBloqueioSubmissao } from '../../game/feuds';
import { tituloProfissao } from '../../game/professions';
import { alternarModoEvolucao } from '../../game/companion';
import { motivoBloqueioDestruirNucleo } from '../../game/coreDestruction';
import { aleijarNpc } from '../../game/bounties';
import { aplicarEfeitos } from '../../game/effects';

const ENERGIA_DESAFIO = 2;

/** Pais são gerados uma vez e guardados nas flags. */
function garantirFamilia(character: Character): void {
  if (character.origem.tipo === 'orfao' || character.flags.pai) return;
  const sobrenome = character.origem.nomeCasa.split(' ').pop() ?? escolher(SOBRENOMES);
  character.flags.pai = `${sobrenome} ${escolher(NOMES)}`;
  character.flags.mae = `${escolher(SOBRENOMES)} ${escolher(NOMES)}`;
}

function linha(tipo: string, nome: string, detalhe = ''): string {
  return `<li><strong>${escapeHtml(tipo)}:</strong> ${escapeHtml(nome)}${detalhe ? ` <small>— ${escapeHtml(detalhe)}</small>` : ''}</li>`;
}

function renderPessoais(character: Character): string {
  const f = character.flags;
  const itens: string[] = [];

  if (character.origem.tipo === 'orfao') {
    itens.push(linha('Tutor', `Monges do templo de ${character.origem.cidade}`));
  } else {
    itens.push(linha('Pai', String(f.pai), character.origem.nomeCasa));
    itens.push(linha('Mãe', String(f.mae)));
  }
  if (typeof f.mestre === 'string' && f.mestre !== 'recusou') itens.push(linha('Mestre (Shifu)', f.mestre, 'o velho de roupas gastas'));
  if (f.rival) itens.push(linha('Rival de Cultivo', String(f.rival), `${Number(f.vitoriasRival ?? 0)} vitória(s) sobre ele`));
  if (typeof f.casamentoAlianca === 'string' && !['recusado', 'fugiu'].includes(f.casamentoAlianca)) {
    itens.push(linha('Cônjuge (aliança de clã)', f.casamentoAlianca));
  }

  return `<ul class="ficha">${itens.join('')}</ul>`;
}

function renderCompanheira(character: Character): string {
  const besta = character.companheira;
  if (!besta) return '';
  const domador = character.profissoes.domador;
  return `
    <h3>Besta Companheira</h3>
    <div class="ocupacao-atual">
      <strong>${escapeHtml(besta.nome)} — ${escapeHtml(besta.especie)}</strong>
      <span>${faixaBesta(besta.rank)} · ${escapeHtml(descreverCultivo(besta.rank, besta.estagio))} (${Math.floor(besta.progresso)}%)</span>
      <span>Vínculo ${Math.round(besta.vinculo)}/100 · ${Math.floor(besta.idade)} anos ${besta.deInfancia ? '· criada com você desde a infância' : ''}</span>
      <span>Domador: ${escapeHtml(tituloProfissao('domador', domador) ?? 'não é domador')}</span>
      <span>${besta.deInfancia ? '<strong>Vínculo de Nascença</strong>: pode alcançar a Técnica de Fusão em combate.' : 'Contrato de alma: alcança Ataques Combinados (Fusão só com vínculo perfeito).'}</span>
      <span>Evolução: <strong>${besta.modoEvolucao === 'conjunta' ? 'Conjunta' : 'Independente'}</strong> —
        ${besta.modoEvolucao === 'conjunta' ? 'o reino dela acompanha o seu.' : 'cultiva no próprio ritmo, pode te ultrapassar ou ficar para trás, e às vezes encontra tesouros sozinha.'}</span>
      <button data-acao="modo-besta">Mudar para evolução ${besta.modoEvolucao === 'conjunta' ? 'independente' : 'conjunta'}</button>
      <small>Luta ao seu lado em todo combate; a sincronia entre vocês sobe a cada rodada.</small>
    </div>`;
}

function renderPessoas(character: Character, historia: StoryState): string {
  if (character.relacoes.length === 0) {
    return '<h3>Pessoas</h3><p class="vazio-texto">Ninguém ainda. Use "Conhecer pessoas novas" em Atividades → Social.</p>';
  }
  const semEnergia = historia.energia < ENERGIA_INTERACAO;
  const cartoes = character.relacoes
    .map((r) => {
      if (r.tipo === 'Inimigo Jurado') {
        const intimidado = inimigoIntimidado(character, r);
        const bloqueioSubmissao = motivoBloqueioSubmissao(character, r);
        const semEnergiaExterminio = historia.energia < ENERGIA_EXTERMINIO;
        return `
          <div class="objetivo inimigo-jurado">
            <div><strong>${escapeHtml(r.nome)}</strong><small>Inimigo Jurado${intimidado ? ' · intimidado — não ousa agir' : ''}</small></div>
            <p><small>${escapeHtml(descreverRelacao(r))}. ${intimidado ? 'Você está tão acima deles que os vingadores pararam de vir.' : 'Enquanto a rixa durar, vingadores podem aparecer a qualquer momento.'}</small></p>
            <div class="botoes-interacao">
              <button class="botao-pequeno" data-exterminar="${r.id}" ${semEnergiaExterminio ? 'disabled' : ''} title="Três lutas seguidas: guardas, ancião e Patriarca. Alinhamento −30.">
                Exterminar a família (${ENERGIA_EXTERMINIO} de energia)</button>
              <button class="botao-pequeno" data-submissao="${r.id}" ${bloqueioSubmissao ? `disabled title="${escapeHtml(bloqueioSubmissao)}"` : ''}>
                Impor submissão (virar vassalo)</button>
            </div>
            ${bloqueioSubmissao ? `<p><small>Submissão: ${escapeHtml(bloqueioSubmissao)}.</small></p>` : ''}
          </div>`;
      }
      if (r.tipo === 'Vassalo') {
        return `
          <div class="objetivo">
            <div><strong>${escapeHtml(r.nome)}</strong><small>Vassalo</small></div>
            <p><small>${escapeHtml(descreverRelacao(r))}</small></p>
          </div>`;
      }
      const botoes = INTERACOES.map((interacao) => {
        const bloqueio = interacao.bloqueio(character, r) ?? (semEnergia ? 'Sem energia' : null);
        if (bloqueio === 'Não se aplica') return '';
        return `<button class="botao-pequeno" data-interagir="${interacao.id}" data-pessoa="${r.id}" ${bloqueio ? `disabled title="${escapeHtml(bloqueio)}"` : ''}>${escapeHtml(interacao.rotulo)}</button>`;
      }).join('');
      return `
        <div class="objetivo">
          <div><strong>${escapeHtml(r.nome)}</strong><small>${escapeHtml(r.tipo)} · Relação ${Math.round(r.relacao)}</small></div>
          <p><small>${escapeHtml(descreverRelacao(r))}</small></p>
          <div class="botoes-interacao">${botoes}</div>
        </div>`;
    })
    .join('');
  const harem = parceirosRomanticos(character);
  const limite = limiteDoHarem(character);
  const infoHarem = `<p class="dica">Harém: <strong>${harem.length}/${limite}</strong> parceiro(s). O limite cresce com sua influência pessoal.
    Com mais de um, há ciúmes — um banquete ajuda a manter a harmonia. Cada Companheiro(a) de Dao dá +10% de cultivo (até +30%).</p>`;
  return `<h3>Pessoas (${ENERGIA_INTERACAO} de energia por interação)</h3>${infoHarem}<div class="lista-objetivos">${cartoes}</div>`;
}

let dueloDemoniaco = false;

function renderSeita(character: Character, historia: StoryState): string {
  const roster = rosterDaSeita(historia.mundo, character);
  if (!roster) return '';

  const semEnergia = historia.energia < ENERGIA_DESAFIO;
  let postoAtual = '';
  const linhas = ordenarRoster(roster)
    .map((membro) => {
      const cabecalho = membro.posto !== postoAtual ? `<tr class="grupo-posto"><td colspan="4">${escapeHtml(membro.posto)}</td></tr>` : '';
      postoAtual = membro.posto;
      const desafiavel = podeDesafiar(character, membro);
      const botao = desafiavel
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
    <h3>${escapeHtml(roster.nome)} ${roster.suprema ? '(Seita Suprema)' : ''}</h3>
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

export function abrirRelacoes(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let resultado: DesfechoExibido | null = null;
  let extras: string[] = [];
  garantirFamilia(character);

  const render = (): void => {
    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Relações</h2>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}
        ${resultado ? renderResultado(resultado, extras) : renderMensagens(extras)}
        <h3>Família e vínculos</h3>
        ${renderPessoais(character)}
        ${renderCompanheira(character)}
        ${renderPessoas(character, historia)}
        ${renderSeita(character, historia)}
      </div>`;
    ativarReproducao(overlay, resultado, render);
  };

  overlay.addEventListener('change', (evento) => {
    const alvo = evento.target as HTMLInputElement;
    if (alvo.id === 'duelo-demoniaco') dueloDemoniaco = alvo.checked;
  });

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      aoAlterar();
      return;
    }

    if (alvo.closest('[data-acao="modo-besta"]') && character.companheira) {
      resultado = null;
      extras = [alternarModoEvolucao(character.companheira)];
      aoAlterar();
      render();
      return;
    }

    const exterminar = alvo.closest<HTMLButtonElement>('[data-exterminar]');
    const submissao = alvo.closest<HTMLButtonElement>('[data-submissao]');
    if ((exterminar && !exterminar.disabled) || (submissao && !submissao.disabled)) {
      const id = exterminar?.dataset.exterminar ?? submissao?.dataset.submissao;
      const inimigo = character.relacoes.find((r) => r.id === id && r.tipo === 'Inimigo Jurado');
      if (!inimigo) return;
      if (exterminar) {
        if (!gastarEnergia(historia, ENERGIA_EXTERMINIO)) return;
        resultado = exterminarFamilia(character, inimigo);
        extras = [];
      } else {
        resultado = null;
        extras = imporSubmissao(character, inimigo);
      }
      aoAlterar();
      render();
      overlay.querySelector('.painel')?.scrollTo({ top: 0 });
      return;
    }

    const interagir = alvo.closest<HTMLButtonElement>('[data-interagir]');
    if (interagir && !interagir.disabled) {
      const pessoa = character.relacoes.find((r) => r.id === interagir.dataset.pessoa);
      const interacao = INTERACOES.find((i) => i.id === interagir.dataset.interagir);
      if (!pessoa || !interacao || interacao.bloqueio(character, pessoa) || !gastarEnergia(historia, ENERGIA_INTERACAO)) return;
      resultado = null;
      extras = interacao.executar(character, pessoa);
      aoAlterar();
      render();
      overlay.querySelector('.painel')?.scrollTo({ top: 0 });
      return;
    }

    const botao = alvo.closest<HTMLButtonElement>('[data-desafiar]');
    if (!botao || botao.disabled) return;
    const roster = rosterDaSeita(historia.mundo, character);
    const membro: MembroSeita | undefined = roster?.membros.find((m) => m.id === botao.dataset.desafiar);
    if (!roster || !membro || !podeDesafiar(character, membro) || !gastarEnergia(historia, ENERGIA_DESAFIO)) return;

    const escolha = {
      texto: `Desafiar ${membro.nome}`,
      combate: inimigoDoNpc(membro),
      resultado: { texto: `${membro.nome} cai diante de toda a seita.`, efeitos: { reputacao: 4, contribuicao: 10 } },
      falha: { texto: `${membro.nome} te derrota com facilidade. Os discípulos cochicham.`, efeitos: { reputacao: -2 } },
    };
    if (descreverEscolha(character, escolha).bloqueio) return;
    resultado = executarEscolha(character, escolha);
    extras = resultado.vitoria ? aplicarVitoriaDesafio(character, roster, membro) : [];
    if (resultado.vitoria && dueloDemoniaco && !motivoBloqueioDestruirNucleo(character, membro.rank, membro.estagio)) {
      const rankVitima = membro.rank;
      aleijarNpc(membro);
      membro.posto = 'Discípulo Externo';
      extras.push(...aplicarEfeitos(character, { destruirNucleo: { nome: membro.nome, afiliacao: `Mestre e aliados de ${membro.nome}`, rank: rankVitima } }));
    }

    aoAlterar();
    render();
    overlay.querySelector('.painel')?.scrollTo({ top: 0 });
  });

  render();
}
