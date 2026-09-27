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
import { REINOS } from '../../game/cultivation';
import {
  ENERGIA_ATAQUE,
  ENERGIA_PROVOCAR,
  ENERGIA_SABOTAGEM,
  bloqueioProvocar,
  provocarGuerra,
  rivaisProvocaveis,
  ESTACOES_MAXIMAS,
  PLACAR_DECISIVO,
  custoTregua,
  escolhaAtaque,
  escolhaDueloLider,
  escolhaSabotagem,
  podeTerGuerra,
  proporTregua,
  registrarPontoDeGuerra,
  situacaoDaGuerra,
  verificarFimDaGuerra,
} from '../../game/clanWar';
import { criarOverlay, escapeHtml } from './dom';
import { abrirResultado, avisar, renderEnergia } from './resultView';
import { renderRixas, resumoRixas, tratarCliqueRixa } from './feudsView';
import { renderSupremas, resumoSupremas } from './supremeSectsView';
import { bloqueioSupremaAnfitria } from '../../game/supremeSects';

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
  const proibido = bloqueioSupremaAnfitria(character);

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
        <button class="primario" data-acao="andar" ${semEnergia || proibido ? 'disabled' : ''}>${escapeHtml(proibido ?? (semEnergia ? 'Sem energia' : `Subir (${ENERGIA_ANDAR} de energia)`))}</button>
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
    bloqueioSupremaAnfitria(character) ??
    (historia.energia < ENERGIA_TORNEIO
      ? `Requer ${ENERGIA_TORNEIO} de energia`
      : character.inventario.pedrasEspirituais < TAXA_INSCRICAO
        ? `Requer ${TAXA_INSCRICAO} pedras de inscrição`
        : character.idadeMeses < 14 * 12
          ? 'Requer 14 anos'
          : null);
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

function renderGuerra(character: Character, historia: StoryState): { resumo: string; conteudo: string } {
  const g = character.guerra;
  if (!g) {
    if (!podeTerGuerra(character)) {
      return { resumo: 'sem clã ou seita', conteudo: '<p class="dica">Guerras acontecem entre seitas e clãs. Pertença a um (ou funde o seu) para ter inimigos à altura.</p>' };
    }
    const bloqueio = bloqueioProvocar(character, historia.energia);
    const rivais = rivaisProvocaveis(historia.mundo, character)
      .map(({ faccao, razao }) => {
        const forca = razao >= 1.3 ? 'mais fortes que vocês' : razao <= 0.75 ? 'mais fracos' : 'parelhos';
        return `<button class="escolha" data-provocar="${escapeHtml(faccao.nome)}" ${bloqueio ? 'disabled' : ''}>
          <span>Provocar guerra contra o ${escapeHtml(faccao.nome)}</span>
          <small>${escapeHtml(bloqueio ?? `${forca} (poder ×${razao.toLocaleString('pt-BR')}) · ${ENERGIA_PROVOCAR} de energia`)}</small></button>`;
      })
      .join('');
    return {
      resumo: 'em paz',
      conteudo: `<p class="dica">Nenhuma guerra no momento. Rivais podem declarar guerra à sua casa a qualquer momento — ou você mesmo pode provocar uma.
        Vencer faz seu clã ou seita crescer (membros e prestígio da família) e transforma o rival em vassalo; perder custa caro. Escolher rivais mais fracos é mais seguro; mais fortes, mais glorioso.</p>
        <div class="lista-atividades">${rivais || '<p class="vazio-texto">Nenhum rival à altura na região.</p>'}</div>`,
    };
  }
  const barra = Math.round(((g.placar + PLACAR_DECISIVO) / (PLACAR_DECISIVO * 2)) * 100);
  const semEnergia = (custo: number): boolean => historia.energia < custo;
  const dueloFeito = character.flags.dueloLiderTurno === historia.turno;
  const tregua = custoTregua(character);
  const comparacao = g.razao >= 1.3 ? 'mais fortes que vocês' : g.razao <= 0.75 ? 'mais fracos que vocês' : 'parelhos com vocês';
  return {
    resumo: `contra o ${g.inimigo} · ${situacaoDaGuerra(g)}`,
    conteudo: `
      <p><strong>Guerra contra o ${escapeHtml(g.inimigo)}</strong> — ${escapeHtml(g.motivo)}. Eles começaram ${comparacao}.</p>
      <div class="barra" title="${PLACAR_DECISIVO} = vitória, −${PLACAR_DECISIVO} = derrota">
        <div class="barra-preenchimento" style="width: ${barra}%"></div>
        <span class="barra-texto">Placar ${g.placar > 0 ? '+' : ''}${g.placar} · ${escapeHtml(situacaoDaGuerra(g))} · estação ${g.estacoes}/${ESTACOES_MAXIMAS}</span>
      </div>
      <p class="dica">A cada estação a guerra pende para o lado mais forte${character.faccao ? ' (suas muralhas seguram parte dos ataques)' : ''}. Placar +${PLACAR_DECISIVO}: o inimigo vira vassalo e você leva os espólios. −${PLACAR_DECISIVO}: você perde pedras, reputação${character.faccao ? ', membros e uma instalação' : ''}. Depois de ${ESTACOES_MAXIMAS} estações, armistício.</p>
      <div class="lista-atividades">
        <button class="escolha" data-acao="guerra-ataque" ${semEnergia(ENERGIA_ATAQUE) ? 'disabled' : ''}>
          <span>Liderar um ataque</span><small>${semEnergia(ENERGIA_ATAQUE) ? 'Sem energia' : `${ENERGIA_ATAQUE} de energia · luta contra um talento inimigo · placar +1`}</small></button>
        <button class="escolha" data-acao="guerra-duelo" ${semEnergia(ENERGIA_ATAQUE) || dueloFeito ? 'disabled' : ''}>
          <span>Desafiar ${escapeHtml(g.lider.nome)}, o líder</span><small>${dueloFeito ? 'Uma vez por capítulo' : semEnergia(ENERGIA_ATAQUE) ? 'Sem energia' : `${ENERGIA_ATAQUE} de energia · ${escapeHtml(REINOS[g.lider.rank - 1]?.nome ?? '')} (força real) · placar +3`}</small></button>
        <button class="escolha" data-acao="guerra-sabotagem" ${semEnergia(ENERGIA_SABOTAGEM) ? 'disabled' : ''}>
          <span>Sabotar os depósitos</span><small>${semEnergia(ENERGIA_SABOTAGEM) ? 'Sem energia' : `${ENERGIA_SABOTAGEM} de energia · Destreza · placar +1`}</small></button>
        <button class="escolha" data-acao="guerra-tregua" ${character.inventario.pedrasEspirituais < tregua ? 'disabled' : ''}>
          <span>Propor trégua</span><small>${tregua > 0 ? `Indenização de ${tregua} pedras` : 'Com vantagem, sem custo'}</small></button>
      </div>`,
  };
}

export function abrirMundo(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let pastaAberta: string | null = character.guerra ? 'guerra' : 'torre';
  let mensagens: string[] = [];
  let resultado: DesfechoExibido | null = null;
  let contrabando = false;

  const render = (): void => {
    const torre = renderTorre(character, historia);
    const torneio = renderTorneio(character, historia);
    const alquimia = renderTorneioAlquimia(character, historia);
    const comercio = renderComercio(character, contrabando);
    const guerra = renderGuerra(character, historia);

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Mundo — ${escapeHtml(REGIOES[character.local.regiao].nome)}</h2>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}
        ${pasta('guerra', 'Guerra de Clãs', guerra.resumo, guerra.conteudo, pastaAberta === 'guerra')}
        ${pasta('rixas', 'Rixas de Sangue e Vassalos', resumoRixas(character), renderRixas(character, historia), pastaAberta === 'rixas')}
        ${pasta('supremas', 'Seitas Supremas', resumoSupremas(character), renderSupremas(character), pastaAberta === 'supremas')}
        ${pasta('torre', 'Torre de Prova', torre.resumo, torre.conteudo, pastaAberta === 'torre')}
        ${pasta('torneio', 'Torneio Regional', torneio.resumo, torneio.conteudo, pastaAberta === 'torneio')}
        ${pasta('alquimia', 'Torneio de Alquimia', alquimia.resumo, alquimia.conteudo, pastaAberta === 'alquimia')}
        ${pasta('comercio', 'Rotas Comerciais', comercio.resumo, comercio.conteudo, pastaAberta === 'comercio')}
      </div>`;
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

    const rixa = tratarCliqueRixa(alvo, character, historia);
    if (rixa) {
      aoAlterar();
      render();
      if (rixa.resultado) abrirResultado(rixa.resultado, rixa.mensagens, rixa.titulo);
      else avisar(rixa.mensagens);
      return;
    }

    const provocar = alvo.closest<HTMLButtonElement>('[data-provocar]');
    if (provocar && !provocar.disabled) {
      if (bloqueioProvocar(character, historia.energia) || !gastarEnergia(historia, ENERGIA_PROVOCAR)) return;
      const mensagens = provocarGuerra(historia.mundo, character, provocar.dataset.provocar ?? '');
      aoAlterar();
      render();
      avisar(mensagens);
      return;
    }

    const acao = alvo.closest<HTMLButtonElement>('[data-acao]');
    const venda = alvo.closest<HTMLElement>('[data-vender-produto]');
    if (acao?.disabled) return;

    if (acao?.dataset.acao === 'andar') {
      const torre = TORRES[character.local.regiao];
      const proximo = andarAtual(historia.mundo, torre.regiao) + 1;
      if (proximo > torre.andares || bloqueioSupremaAnfitria(character) || !gastarEnergia(historia, ENERGIA_ANDAR)) return;
      resultado = executarEscolha(character, escolhaDoAndar(character, torre, proximo));
      if (resultado.sucesso) historia.mundo.torres[torre.regiao] = proximo;
      mensagens = [];
    } else if (acao?.dataset.acao === 'torneio') {
      if (!torneioAberto(historia) || bloqueioSupremaAnfitria(character) || !gastarEnergia(historia, ENERGIA_TORNEIO)) return;
      resultado = disputarTorneio(character, historia);
      mensagens = [];
    } else if (acao?.dataset.acao === 'torneio-alquimia') {
      if (!torneioAlquimiaAberto(historia) || character.profissoes.alquimia.nivel === 0 || !gastarEnergia(historia, ENERGIA_TORNEIO_ALQUIMIA)) return;
      resultado = disputarTorneioAlquimia(character, historia);
      mensagens = [];
    } else if (acao?.dataset.acao?.startsWith('guerra-') && character.guerra) {
      const tipo = acao.dataset.acao;
      if (tipo === 'guerra-tregua') {
        mensagens = proporTregua(character);
        resultado = null;
      } else {
        const custo = tipo === 'guerra-sabotagem' ? ENERGIA_SABOTAGEM : ENERGIA_ATAQUE;
        if (tipo === 'guerra-duelo' && character.flags.dueloLiderTurno === historia.turno) return;
        if (!gastarEnergia(historia, custo)) return;
        if (tipo === 'guerra-duelo') character.flags.dueloLiderTurno = historia.turno;
        const escolha = tipo === 'guerra-ataque' ? escolhaAtaque(character) : tipo === 'guerra-duelo' ? escolhaDueloLider(character) : escolhaSabotagem(character);
        resultado = executarEscolha(character, escolha);
        const ponto = registrarPontoDeGuerra(character);
        if (ponto) resultado.mensagens.push(`Placar da guerra ${ponto > 0 ? '+' : ''}${ponto}.`);
        resultado.mensagens.push(...verificarFimDaGuerra(historia.mundo, character));
        mensagens = [];
      }
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
    if (resultado) abrirResultado(resultado, mensagens, 'Mundo');
    else avisar(mensagens);
    resultado = null;
    mensagens = [];
  });

  render();
}
