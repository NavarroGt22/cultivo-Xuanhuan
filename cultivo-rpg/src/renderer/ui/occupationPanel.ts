import { ATTRIBUTE_INFO } from '../../game/attributes';
import { Character } from '../../game/character';
import {
  CATEGORIAS_OCUPACAO,
  atributoDoCargo,
  contratar,
  demitir,
  getCargo,
  getCategoria,
  listarVagas,
  motivoRequisitos,
  salarioAtual,
  CategoriaOcupacaoId,
} from '../../game/occupations';
import {
  CONTRIBUICAO_POR_ESTACAO,
  ehDiscipulo,
  fatorCultivoPassivo,
  listarOfertasSeita,
  motivoPromocao,
  postoAtual,
  promoverNaSeita,
  proximoPosto,
} from '../../game/sect';
import { REINOS } from '../../game/cultivation';
import { aplicarEfeitos } from '../../game/effects';
import {
  Instalacoes,
  NIVEL_MAX_INSTALACAO,
  NOME_INSTALACAO,
  TipoFaccao,
  custoInstalacao,
  custoRecrutamento,
  fundarFaccao,
  melhorarInstalacao,
  motivoBloqueioFundacao,
  membrosDaFamilia,
  recrutarMembros,
  rendaFaccao,
  requisitosFundacao,
  sincronizarFamilia,
} from '../../game/faction';
import { criarOverlay, escapeHtml } from './dom';
import { abrirResultado, avisar } from './resultView';
import { renderHierarquiaSeita, tratarCliqueHierarquia, tratarMudancaHierarquia } from './sectHierarchyView';
import type { StoryState } from '../../game/story';

function renderSeita(character: Character, pastaAberta: string | null): string {
  if (!ehDiscipulo(character)) return '';

  const posto = postoAtual(character);
  const proximo = proximoPosto(character);
  const motivo = motivoPromocao(character);
  const passivo = Math.round(fatorCultivoPassivo(character) * 100);

  const ofertas = listarOfertasSeita(character)
    .map(
      (oferta, indice) => `
        <button class="escolha oferta-seita" data-oferta="${indice}" ${oferta.bloqueio ? 'disabled' : ''}>
          <span>${escapeHtml(oferta.nome)}</span>
          <small>${escapeHtml(oferta.bloqueio ?? `${oferta.custo} de contribuição`)}</small>
        </button>`,
    )
    .join('');

  return `
    <div class="ocupacao-atual">
      <strong>${escapeHtml(posto.nome)} — ${escapeHtml(character.afiliacao.nome)}</strong>
      <span>Como discípulo, você <em>não precisa trabalhar</em>: a seita paga ${character.afiliacao.estipendio} pedras por estação
      e cada estação de deveres rende +${CONTRIBUICAO_POR_ESTACAO} de contribuição.</span>
      <span>Contribuição: <strong>${character.contribuicao}</strong> · Cultivo passivo: ${passivo}% ${
        character.ocupacao ? '(reduzido pelo emprego fora da seita — os deveres estão parados)' : '(ambiente da seita)'
      }</span>
      ${
        proximo
          ? `<small>Próximo posto: ${escapeHtml(proximo.nome)} — contribuição ${proximo.requisitos.contribuicao}, ${escapeHtml(REINOS[proximo.requisitos.rank - 1].nome)}, reputação ${proximo.requisitos.reputacao}</small>
             <button data-acao="promover-seita" ${motivo ? 'disabled' : ''} title="${escapeHtml(motivo ?? '')}">Pedir promoção a ${escapeHtml(proximo.nome)}</button>
             ${motivo ? `<small>${escapeHtml(motivo)}</small>` : ''}`
          : '<small>Você chegou ao posto mais alto de discípulo.</small>'
      }
    </div>
    ${pasta(
      'pavilhao',
      'Pavilhão de Contribuição',
      `${character.contribuicao} de contribuição`,
      `<div class="lista-atividades">${ofertas}</div>`,
      pastaAberta === 'pavilhao',
    )}`;
}

function renderFaccao(character: Character, pastaAberta: string | null, nomeDigitado: string): string {
  const faccao = character.faccao;
  if (!faccao) {
    const botoes = (['cla', 'seita'] as TipoFaccao[])
      .map((tipo) => {
        const bloqueio = motivoBloqueioFundacao(character, tipo, nomeDigitado);
        return `
          <button class="escolha" data-fundar="${tipo}" ${bloqueio ? 'disabled' : ''}>
            <span>Fundar ${tipo === 'cla' ? 'um Clã' : 'uma Seita'}</span>
            <small>${escapeHtml(bloqueio ?? `Custo: ${requisitosFundacao(tipo)}`)}</small>
          </button>`;
      })
      .join('');
    const conteudo = `
      <p class="dica">Clã: ${escapeHtml(requisitosFundacao('cla'))}. Seita: ${escapeHtml(requisitosFundacao('seita'))}.
      Como fundador você deixa sua afiliação atual, não recebe mais estipêndio e passa a viver da renda dos membros.
      Seus herdeiros nascem dentro da facção. Com alinhamento negativo ela nasce não-ortodoxa.</p>
      <label class="opcao">Nome: <input type="text" id="nome-faccao" maxlength="30" value="${escapeHtml(nomeDigitado)}" placeholder="ex.: Lótus Celeste" /></label>
      <div class="lista-atividades">${botoes}</div>`;
    return pasta('fundar', 'Fundar Clã ou Seita', 'crie sua própria facção', conteudo, pastaAberta === 'fundar');
  }

  sincronizarFamilia(character);
  const renda = rendaFaccao(character);
  const familia = membrosDaFamilia(character);
  const { salaCultivo, biblioteca, muralhas } = faccao.instalacoes;
  const manutencao = (salaCultivo + biblioteca + muralhas) * 3;
  const custoRecruta = custoRecrutamento(faccao);
  const instalacoes = (Object.keys(NOME_INSTALACAO) as (keyof Instalacoes)[])
    .map((chave) => {
      const nivel = faccao.instalacoes[chave];
      const custo = custoInstalacao(nivel);
      const bloqueio =
        nivel >= NIVEL_MAX_INSTALACAO ? 'Nível máximo' : character.inventario.pedrasEspirituais < custo ? `Requer ${custo} pedras` : null;
      return `
        <button class="escolha" data-instalacao="${chave}" ${bloqueio ? 'disabled' : ''}>
          <span>${escapeHtml(NOME_INSTALACAO[chave])} — nível ${nivel}/${NIVEL_MAX_INSTALACAO}</span>
          <small>${escapeHtml(bloqueio ?? `Melhorar: ${custo} pedras`)}</small>
        </button>`;
    })
    .join('');

  return `
    <div class="ocupacao-atual">
      <strong>${escapeHtml(character.afiliacao.posto ?? 'Fundador')} — ${escapeHtml(faccao.nome)}${faccao.ortodoxa ? '' : ' (não-ortodoxa)'}</strong>
      <span>${faccao.membros} membros${familia ? ` (${familia} da sua família)` : ''} · renda ~${renda.total} pedras/estação (${renda.membros} dos membros + ${renda.prestigio} de ofertas pela sua fama) · manutenção ${manutencao}/estação</span>
      <span class="dica">Cada membro rende mais quanto mais alto o seu reino (+30% por reino); cônjuges, Companheiros(as) de Dao e filhos entram na ${escapeHtml(faccao.nome)} sozinhos.</span>
      <span>Cultivo passivo: ${Math.round(fatorCultivoPassivo(character) * 100)}% · estudo de manuais −${biblioteca * 2} · ataques de inimigos −${muralhas * 25}%</span>
      <button data-acao="recrutar" ${character.inventario.pedrasEspirituais < custoRecruta ? 'disabled' : ''}>Recrutar membros (${custoRecruta} pedras)</button>
    </div>
    ${pasta('instalacoes', 'Instalações', `${salaCultivo + biblioteca + muralhas} nível(is)`, `<div class="lista-atividades">${instalacoes}</div>`, pastaAberta === 'instalacoes')}`;
}

function renderAtual(character: Character): string {
  const estado = character.ocupacao;
  if (!estado) {
    return ehDiscipulo(character)
      ? '<p class="vazio-texto">Sem emprego fora da seita — seu tempo vai para os deveres e o cultivo.</p>'
      : `<p class="vazio-texto">Você não tem ocupação. Escolha uma vaga abaixo. Sem emprego, o cultivo passivo é ${Math.round(fatorCultivoPassivo(character) * 100)}%.</p>`;
  }

  const categoria = getCategoria(estado.categoria);
  const cargo = getCargo(estado);
  const proximo = categoria.carreira ? categoria.cargos[estado.cargo + 1] : undefined;
  const bloqueioProximo = proximo ? motivoRequisitos(character, proximo.requisitos) : null;

  return `
    <div class="ocupacao-atual">
      <strong>${escapeHtml(cargo.nome)}</strong>
      <span>${escapeHtml(categoria.nome)} · ${estado.estacoes} estações no cargo</span>
      <span>Salário: ~${salarioAtual(character)} pedras por estação · Avaliação por ${ATTRIBUTE_INFO[atributoDoCargo(estado)].nome}</span>
      <div class="barra barra-desempenho" title="100 = promoção, 0 = demissão">
        <div class="barra-preenchimento" style="width: ${estado.desempenho}%"></div>
        <span class="barra-texto">Desempenho ${estado.desempenho}/100</span>
      </div>
      ${
        proximo
          ? `<small>Próximo cargo: ${escapeHtml(proximo.nome)}${bloqueioProximo ? ` — ${escapeHtml(bloqueioProximo)}` : ''}</small>`
          : categoria.carreira
            ? '<small>Você está no topo desta carreira.</small>'
            : ''
      }
      <button data-acao="demitir">Pedir demissão</button>
    </div>`;
}

function pasta(id: string, titulo: string, resumo: string, conteudo: string, aberta: boolean): string {
  return `
    <div class="pasta ${aberta ? 'aberta' : ''}">
      <button class="pasta-cabecalho" data-pasta="${escapeHtml(id)}">
        <span>${aberta ? '▾' : '▸'} ${escapeHtml(titulo)}</span>
        <small>${escapeHtml(resumo)}</small>
      </button>
      ${aberta ? `<div class="pasta-conteudo">${conteudo}</div>` : ''}
    </div>`;
}

/** Uma pasta por carreira; dentro dela, a descrição, a escada de cargos e as vagas abertas. */
function renderVagas(character: Character, pastaAberta: string | null): string {
  const vagas = listarVagas(character);
  return CATEGORIAS_OCUPACAO.map((categoria) => {
    const daCategoria = vagas.filter((vaga) => vaga.categoria.id === categoria.id);
    const abertas = daCategoria.filter((v) => !v.bloqueio).length;
    const trabalhaAqui = character.ocupacao?.categoria === categoria.id;

    const botoes = daCategoria
      .map((vaga) => {
        const atual = trabalhaAqui && character.ocupacao?.cargo === vaga.indice;
        const bloqueio = atual ? 'Seu emprego atual' : vaga.bloqueio;
        const atributo = vaga.cargo.atributo ?? categoria.atributo;
        return `
          <button class="escolha vaga" data-categoria="${categoria.id}" data-indice="${vaga.indice}" ${bloqueio ? 'disabled' : ''}>
            <span>${escapeHtml(vaga.cargo.nome)}</span>
            <small>${escapeHtml(bloqueio ?? `~${vaga.cargo.salario} pedras/estação · ${ATTRIBUTE_INFO[atributo].nome}`)}</small>
          </button>`;
      })
      .join('');

    const escada = categoria.carreira
      ? `<p class="dica">Carreira: ${categoria.cargos
          .map((c, i) => (trabalhaAqui && character.ocupacao?.cargo === i ? `<strong>${escapeHtml(c.nome)}</strong>` : escapeHtml(c.nome)))
          .join(' → ')}</p>`
      : '';

    const extras = [
      categoria.famaPorEstacao ? 'rende reputação a cada estação' : '',
      categoria.xpProfissao ? 'rende experiência de ofício' : '',
      categoria.risco ? 'risco de prisão' : '',
    ]
      .filter(Boolean)
      .join(' · ');

    const conteudo = `
      <p class="dica">${escapeHtml(categoria.descricao)}${extras ? ` <em>(${escapeHtml(extras)})</em>` : ''}</p>
      ${escada}
      <div class="lista-atividades">${botoes}</div>`;

    const resumo = trabalhaAqui ? 'você trabalha aqui' : `${abertas} vaga(s) disponível(is)`;
    return pasta(`cat-${categoria.id}`, categoria.nome, resumo, conteudo, pastaAberta === `cat-${categoria.id}`);
  }).join('');
}

export function abrirOcupacao(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let mensagens: string[] = [];
  let pastaAberta: string | null = character.ocupacao ? `cat-${character.ocupacao.categoria}` : null;
  let nomeFaccao = '';

  const render = (): void => {
    const titulo = character.faccao ? 'Sua Facção e Ocupação' : ehDiscipulo(character) ? 'Seita e Ocupação' : 'Ocupação';
    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>${titulo}</h2>
        ${renderFaccao(character, pastaAberta, nomeFaccao)}
        ${renderSeita(character, pastaAberta)}
        ${ehDiscipulo(character) ? pasta('hierarquia', `Hierarquia do ${character.afiliacao.nome}`, 'líder, anciões, discípulos e desafios por vaga', renderHierarquiaSeita(character, historia), pastaAberta === 'hierarquia') : ''}
        <h3>${ehDiscipulo(character) ? 'Emprego fora da seita (opcional)' : 'Emprego atual'}</h3>
        ${renderAtual(character)}
        <p class="dica">
          Salário e avaliação acontecem a cada estação. Desempenho 100 = promoção; 0 = demissão.
          Trabalhar ocupa tempo: com emprego, o cultivo passivo cai para 15%.
          ${ehDiscipulo(character) && character.afiliacao.ortodoxa ? 'Uma seita ortodoxa expulsa quem for pego trabalhando no Submundo.' : ''}
        </p>
        <h3>Carreiras</h3>
        ${renderVagas(character, pastaAberta)}
      </div>`;
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;

    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      return;
    }

    const botaoPasta = alvo.closest<HTMLElement>('[data-pasta]');
    if (botaoPasta) {
      pastaAberta = pastaAberta === botaoPasta.dataset.pasta ? null : (botaoPasta.dataset.pasta ?? null);
      render();
      return;
    }

    const desafio = tratarCliqueHierarquia(alvo, character, historia);
    if (desafio) {
      aoAlterar();
      render();
      abrirResultado(desafio.resultado, desafio.extras, desafio.titulo);
      return;
    }

    const oferta = alvo.closest<HTMLButtonElement>('.oferta-seita');
    const botaoFundar = alvo.closest<HTMLButtonElement>('[data-fundar]');
    const botaoInstalacao = alvo.closest<HTMLButtonElement>('[data-instalacao]');

    if (botaoFundar) {
      if (botaoFundar.disabled) return;
      mensagens = fundarFaccao(character, botaoFundar.dataset.fundar as TipoFaccao, nomeFaccao);
      pastaAberta = null;
    } else if (botaoInstalacao) {
      if (botaoInstalacao.disabled) return;
      mensagens = melhorarInstalacao(character, botaoInstalacao.dataset.instalacao as keyof Instalacoes);
    } else if (alvo.closest('[data-acao="recrutar"]')) {
      mensagens = recrutarMembros(character);
    } else if (alvo.closest('[data-acao="demitir"]')) {
      mensagens = demitir(character);
    } else if (alvo.closest('[data-acao="promover-seita"]')) {
      mensagens = promoverNaSeita(character);
    } else if (oferta) {
      if (oferta.disabled) return;
      const item = listarOfertasSeita(character)[Number(oferta.dataset.oferta)];
      if (!item || item.bloqueio) return;
      mensagens = [`Trocou ${item.custo} de contribuição por ${item.nome}.`, ...aplicarEfeitos(character, { ...item.efeitos, contribuicao: -item.custo })];
    } else {
      const botao = alvo.closest<HTMLButtonElement>('.vaga');
      if (!botao || botao.disabled) return;
      mensagens = contratar(character, botao.dataset.categoria as CategoriaOcupacaoId, Number(botao.dataset.indice));
    }

    aoAlterar();
    render();
    avisar(mensagens);
    mensagens = [];
  });

  overlay.addEventListener('change', (evento) => tratarMudancaHierarquia(evento.target as HTMLInputElement));

  overlay.addEventListener('input', (evento) => {
    const campo = evento.target as HTMLInputElement;
    if (campo.id !== 'nome-faccao') return;
    nomeFaccao = campo.value;
    const inicio = campo.selectionStart;
    render();
    const novo = overlay.querySelector<HTMLInputElement>('#nome-faccao');
    novo?.focus();
    if (novo && inicio !== null) novo.setSelectionRange(inicio, inicio);
  });

  render();
}
