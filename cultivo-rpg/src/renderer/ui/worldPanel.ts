import { Character } from '../../game/character';
import { DesfechoExibido, ENERGIA_POR_ESTACAO, StoryState, descreverEscolha, executarEscolha, gastarEnergia } from '../../game/story';
import { ENERGIA_ANDAR, NOME_TIPO_ANDAR, TORRES, andarAtual, cultivoDoAndar, escolhaDoAndar, tipoDoAndar } from '../../game/towers';
import {
  ENERGIA_TORNEIO,
  ENERGIA_TORNEIO_ALQUIMIA,
  INTERVALO_TORNEIO,
  INTERVALO_TORNEIO_ALQUIMIA,
  TAXA_ALQUIMIA,
  TAXA_INSCRICAO,
  disputarTorneio,
  disputarTorneioAlquimia,
  nomeTorneio,
  torneioAberto,
  torneioAlquimiaAberto,
} from '../../game/tournaments';
import { IMPOSTO, PRODUTOS_REGIONAIS, comprarProduto, descreverRota, precoCompra, precoVendaProduto, produtoDaRegiao, venderProduto } from '../../game/trade';
import { quantidadeItem } from '../../game/inventory';
import { descreverCultivo } from '../../game/npcs';
import { REGIOES, RegiaoId } from '../../game/world';
import { criarOverlay, escapeHtml } from './dom';
import { ativarReproducao, renderEnergia, renderMensagens, renderResultado } from './resultView';

function pasta(id: string, titulo: string, resumo: string, conteudo: string, aberta: boolean): string {
  return `
    <div class="pasta ${aberta ? 'aberta' : ''}">
      <button class="pasta-cabecalho" data-pasta="${id}">
        <span>${aberta ? '▾' : '▸'} ${escapeHtml(titulo)}</span>
        <small>${escapeHtml(resumo)}</small>
      </button>
      ${aberta ? `<div class="pasta-conteudo">${conteudo}</div>` : ''}
    </div>`;
}

function renderTorre(character: Character, historia: StoryState): { resumo: string; conteudo: string } {
  const torre = TORRES[character.local.regiao];
  const atual = andarAtual(historia.mundo, torre.regiao);
  const proximo = atual + 1;
  const topo = atual >= torre.andares;
  const semEnergia = historia.energia < ENERGIA_ANDAR;

  const outras = (Object.keys(TORRES) as RegiaoId[])
    .filter((r) => r !== torre.regiao)
    .map((r) => `${TORRES[r].nome} (${REGIOES[r].nome}): andar ${andarAtual(historia.mundo, r)}/${TORRES[r].andares}`)
    .join(' · ');

  let botao = '<p class="dica">Você chegou ao topo desta torre! Poucos no mundo podem dizer o mesmo.</p>';
  if (!topo) {
    const escolha = escolhaDoAndar(character, torre, proximo);
    const info = descreverEscolha(character, escolha);
    const { rank, estagio } = cultivoDoAndar(torre, proximo);
    botao = `
      <div class="objetivo">
        <div><strong>${proximo}º andar — ${NOME_TIPO_ANDAR[tipoDoAndar(proximo)]}</strong><small>${escapeHtml(descreverCultivo(rank, estagio))}</small></div>
        <p><small>${escapeHtml(info.detalhe ?? '')}</small></p>
        <button class="primario" data-acao="andar" ${semEnergia ? 'disabled' : ''}>${semEnergia ? 'Sem energia' : `Subir (${ENERGIA_ANDAR} de energia)`}</button>
      </div>`;
  }

  return {
    resumo: `andar ${atual}/${torre.andares}`,
    conteudo: `
      <p class="dica"><strong>${escapeHtml(torre.nome)}</strong> — cada andar testa algo diferente (combate, compreensão de inscrições, resistência da alma) e a cada 10 há um guardião.
      Recompensa por andar alcançado; a cada 10 andares, um manual e reputação${torre.prestigiosa ? ' — e aqui, notícia continental' : ''}.</p>
      ${botao}
      <p class="dica">Outras torres: ${escapeHtml(outras)}</p>`,
  };
}

function renderTorneio(character: Character, historia: StoryState): { resumo: string; conteudo: string } {
  const aberto = torneioAberto(historia);
  const faltam = historia.mundo.proximoTorneio - historia.turno;
  const bloqueio =
    historia.energia < ENERGIA_TORNEIO
      ? `Requer ${ENERGIA_TORNEIO} de energia`
      : character.inventario.pedrasEspirituais < TAXA_INSCRICAO
        ? `Requer ${TAXA_INSCRICAO} pedras de inscrição`
        : character.idadeMeses < 14 * 12
          ? 'Requer 14 anos'
          : null;
  return {
    resumo: aberto ? 'inscrições abertas!' : `próximo em ${faltam} estação(ões)`,
    conteudo: `
      <p class="dica">Clãs e seitas comuns da região se enfrentam em 3 rodadas (quartas, semifinal, final) contra cultivadores do ranking.
      Vence quem chegar mais longe. Acontece a cada ${INTERVALO_TORNEIO} estações. Títulos conquistados: <strong>${historia.mundo.titulosTorneio}</strong>.</p>
      ${
        aberto
          ? `<button class="primario" data-acao="torneio" ${bloqueio ? 'disabled' : ''}>${escapeHtml(bloqueio ?? `Inscrever-se no ${nomeTorneio(character)} (${TAXA_INSCRICAO} pedras, ${ENERGIA_TORNEIO} de energia)`)}</button>`
          : '<p class="vazio-texto">As inscrições ainda não abriram.</p>'
      }`,
  };
}

function renderTorneioAlquimia(character: Character, historia: StoryState): { resumo: string; conteudo: string } {
  const nivel = character.profissoes.alquimia.nivel;
  const aberto = torneioAlquimiaAberto(historia);
  const faltam = (historia.mundo.proximoTorneioAlquimia ?? 0) - historia.turno;
  const bloqueio =
    nivel === 0
      ? 'Requer ser alquimista'
      : historia.energia < ENERGIA_TORNEIO_ALQUIMIA
        ? `Requer ${ENERGIA_TORNEIO_ALQUIMIA} de energia`
        : character.inventario.pedrasEspirituais < TAXA_ALQUIMIA
          ? `Requer ${TAXA_ALQUIMIA} pedras`
          : null;
  return {
    resumo: nivel === 0 ? 'só para alquimistas' : aberto ? 'inscrições abertas!' : `próximo em ${faltam} estação(ões)`,
    conteudo: `
      <p class="dica">Três rodadas de refino contra alquimistas do ranking da região. Sua pílula vale Inteligência + nível de Alquimia × 3 + d20.
      Prêmios: pedras, experiência de Alquimia e muita fama — alquimistas campeões são disputados por clãs inteiros.
      Acontece a cada ${INTERVALO_TORNEIO_ALQUIMIA} estações. Títulos: <strong>${historia.mundo.titulosAlquimia ?? 0}</strong>.</p>
      ${
        aberto
          ? `<button class="primario" data-acao="torneio-alquimia" ${bloqueio ? 'disabled' : ''}>${escapeHtml(bloqueio ?? `Inscrever-se (${TAXA_ALQUIMIA} pedras, ${ENERGIA_TORNEIO_ALQUIMIA} de energia)`)}</button>`
          : '<p class="vazio-texto">As inscrições ainda não abriram.</p>'
      }`,
  };
}

function renderComercio(character: Character, contrabando: boolean): { resumo: string; conteudo: string } {
  const local = character.local.regiao;
  const produtoLocal = produtoDaRegiao(local);

  const vendas = PRODUTOS_REGIONAIS.filter((p) => quantidadeItem(character.inventario, p.id) > 0)
    .map((p) => {
      const qtd = quantidadeItem(character.inventario, p.id);
      const preco = precoVendaProduto(character, p, contrabando);
      return `
        <button class="escolha" data-vender-produto="${p.id}">
          <span>Vender ${qtd}× ${escapeHtml(p.nome)}</span>
          <small>${preco} pedras cada${p.regiao === local ? ' (produto local, vale pouco aqui)' : ''}</small>
        </button>`;
    })
    .join('');

  const rotas = (Object.keys(REGIOES) as RegiaoId[]).map((r) => `<li>${escapeHtml(descreverRota(r))}</li>`).join('');

  return {
    resumo: `${produtoLocal.nome} · imposto ${Math.round(IMPOSTO[local] * 100)}%`,
    conteudo: `
      <p class="dica">Compre o produto da região onde ele nasce e venda longe dela por mais que o dobro. Viajar é em Atividades → Viagem; escoltas de caravana aparecem no quadro de Missões.</p>
      <div class="lista-atividades">
        <button class="escolha" data-acao="comprar-1"><span>Comprar 1× ${escapeHtml(produtoLocal.nome)}</span><small>${precoCompra(produtoLocal)} pedras</small></button>
        <button class="escolha" data-acao="comprar-5"><span>Comprar 5× ${escapeHtml(produtoLocal.nome)}</span><small>${precoCompra(produtoLocal) * 5} pedras</small></button>
      </div>
      <label class="opcao"><input type="checkbox" id="contrabando" ${contrabando ? 'checked' : ''} />
        Contrabandear (não paga imposto; teste de Destreza — se falhar, a carga é confiscada)</label>
      <div class="lista-atividades">${vendas || '<p class="vazio-texto">Nenhum produto regional na bolsa.</p>'}</div>
      <h3>Rotas</h3>
      <ul class="ficha">${rotas}</ul>`,
  };
}

export function abrirMundo(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let pastaAberta: string | null = 'torre';
  let mensagens: string[] = [];
  let resultado: DesfechoExibido | null = null;
  let contrabando = false;

  const render = (): void => {
    const torre = renderTorre(character, historia);
    const torneio = renderTorneio(character, historia);
    const alquimia = renderTorneioAlquimia(character, historia);
    const comercio = renderComercio(character, contrabando);

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Mundo — ${escapeHtml(REGIOES[character.local.regiao].nome)}</h2>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}
        ${renderMensagens(mensagens)}
        ${resultado ? renderResultado(resultado) : ''}
        ${pasta('torre', 'Torre de Prova', torre.resumo, torre.conteudo, pastaAberta === 'torre')}
        ${pasta('torneio', 'Torneio Regional', torneio.resumo, torneio.conteudo, pastaAberta === 'torneio')}
        ${pasta('alquimia', 'Torneio de Alquimia', alquimia.resumo, alquimia.conteudo, pastaAberta === 'alquimia')}
        ${pasta('comercio', 'Rotas Comerciais', comercio.resumo, comercio.conteudo, pastaAberta === 'comercio')}
      </div>`;
    ativarReproducao(overlay, resultado, render);
  };

  overlay.addEventListener('change', (evento) => {
    const alvo = evento.target as HTMLInputElement;
    if (alvo.id === 'contrabando') {
      contrabando = alvo.checked;
      render();
    }
  });

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      aoAlterar();
      return;
    }

    const botaoPasta = alvo.closest<HTMLElement>('[data-pasta]');
    if (botaoPasta) {
      pastaAberta = pastaAberta === botaoPasta.dataset.pasta ? null : (botaoPasta.dataset.pasta ?? null);
      render();
      return;
    }

    const acao = alvo.closest<HTMLButtonElement>('[data-acao]');
    const venda = alvo.closest<HTMLElement>('[data-vender-produto]');
    if (acao?.disabled) return;

    if (acao?.dataset.acao === 'andar') {
      const torre = TORRES[character.local.regiao];
      const proximo = andarAtual(historia.mundo, torre.regiao) + 1;
      if (proximo > torre.andares || !gastarEnergia(historia, ENERGIA_ANDAR)) return;
      resultado = executarEscolha(character, escolhaDoAndar(character, torre, proximo));
      if (resultado.sucesso) historia.mundo.torres[torre.regiao] = proximo;
      mensagens = [];
    } else if (acao?.dataset.acao === 'torneio') {
      if (!torneioAberto(historia) || !gastarEnergia(historia, ENERGIA_TORNEIO)) return;
      resultado = disputarTorneio(character, historia);
      mensagens = [];
    } else if (acao?.dataset.acao === 'torneio-alquimia') {
      if (!torneioAlquimiaAberto(historia) || character.profissoes.alquimia.nivel === 0 || !gastarEnergia(historia, ENERGIA_TORNEIO_ALQUIMIA)) return;
      resultado = disputarTorneioAlquimia(character, historia);
      mensagens = [];
    } else if (acao?.dataset.acao === 'comprar-1' || acao?.dataset.acao === 'comprar-5') {
      mensagens = comprarProduto(character, acao.dataset.acao === 'comprar-5' ? 5 : 1);
      resultado = null;
    } else if (venda?.dataset.venderProduto) {
      const produto = PRODUTOS_REGIONAIS.find((p) => p.id === venda.dataset.venderProduto);
      if (!produto) return;
      mensagens = venderProduto(character, produto, contrabando);
      resultado = null;
    } else {
      return;
    }

    aoAlterar();
    render();
    overlay.querySelector('.painel')?.scrollTo({ top: 0 });
  });

  render();
}
