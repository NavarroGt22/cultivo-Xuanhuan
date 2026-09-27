import { Character } from '../../game/character';
import { ATTRIBUTE_INFO, AttributeKey } from '../../game/attributes';
import { descricaoItem, nomeItem } from '../../game/items';
import {
  FORNALHAS,
  MONTARIAS,
  MORADIAS,
  SUPRIMENTOS,
  comprarEquipamento,
  comprarFornalha,
  comprarMontaria,
  comprarMoradia,
  comprarSuprimento,
  equipamentosAVenda,
  getMontaria,
  getMoradia,
  motivoBloqueioEquipamento,
  motivoBloqueioFornalha,
  motivoBloqueioMontaria,
  motivoBloqueioMoradia,
  motivoBloqueioSuprimento,
  precoEquipamento,
  precoSuprimento,
  precoComDesconto,
  valorRevenda,
} from '../../game/market';
import { criarOverlay, escapeHtml } from './dom';
import { abrirResultado, avisar } from './resultView';
import type { StoryState } from '../../game/story';
import { executarEscolha, gastarEnergia } from '../../game/story';
import { REGIOES } from '../../game/world';
import {
  ENERGIA_CONTRATO,
  GRUPOS_MERCADORES,
  comprarCota,
  descontoMercador,
  escolhaContrato,
  precoCota,
  registrarContrato,
  riqueza,
  tituloReputacao,
  venderCota,
} from '../../game/merchantGroups';

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

function botao(atributos: string, titulo: string, detalhe: string, bloqueio: string | null, dica = ''): string {
  return `
    <button class="escolha" ${atributos} ${bloqueio ? 'disabled' : ''} title="${escapeHtml(dica)}">
      <span>${titulo}</span>
      <small>${escapeHtml(bloqueio ?? detalhe)}</small>
    </button>`;
}

function renderMoradias(character: Character): string {
  const atual = getMoradia(character.moradia);
  const troca = atual ? ` Ao se mudar, a casa atual é vendida por ${valorRevenda(atual.preco)} pedras.` : '';
  const lista = MORADIAS.map((m) =>
    botao(
      `data-moradia="${m.id}"`,
      `${escapeHtml(m.nome)} <small>(${escapeHtml(m.classe)} · ${m.raridade})</small>`,
      `${precoComDesconto(character, m.preco)} pedras · cultivo +${Math.round(m.densidade * 100)}% · segurança ${Math.round(m.seguranca * 100)}% · manutenção ${m.manutencao}/estação${m.prestigio ? ` · reputação +${m.prestigio}` : ''}`,
      motivoBloqueioMoradia(character, m),
      m.descricao,
    ),
  ).join('');
  return `
    <p class="dica">A densidade espiritual da casa soma ao seu cultivo passivo; as formações afastam vingadores e ladrões. A manutenção é cobrada a cada estação — sem pedras, a casa é penhorada.${troca}</p>
    <div class="lista-atividades">${lista}</div>`;
}

function renderMontarias(character: Character): string {
  const atual = getMontaria(character.montaria);
  const troca = atual ? ` Ao trocar, a atual é vendida por ${valorRevenda(atual.preco)} pedras.` : '';
  const lista = MONTARIAS.map((m) => {
    const extras = [
      `viagem −${Math.round(m.desconto * 100)}%`,
      m.voadora ? 'voa (sem emboscadas)' : '',
      m.comercio ? `comércio +${Math.round(m.comercio * 100)}%` : '',
      `manutenção ${m.manutencao}/estação`,
    ]
      .filter(Boolean)
      .join(' · ');
    return botao(
      `data-montaria="${m.id}"`,
      `${escapeHtml(m.nome)} <small>(${escapeHtml(m.classe)} · ${m.raridade})</small>`,
      `${precoComDesconto(character, m.preco)} pedras · ${extras}`,
      motivoBloqueioMontaria(character, m),
      m.descricao,
    );
  }).join('');
  return `
    <p class="dica">Montarias barateiam as viagens entre regiões. As voadoras (espadas, barcos voadores, bestas aladas) passam por cima das emboscadas; barcos levam mais carga e vendem melhor nas Rotas Comerciais.${troca}</p>
    <div class="lista-atividades">${lista}</div>`;
}

function renderFornalhas(character: Character): string {
  const lista = FORNALHAS.map((f) =>
    botao(`data-fornalha="${f.ordem}"`, escapeHtml(f.nome), `${precoComDesconto(character, f.preco)} pedras`, motivoBloqueioFornalha(character, f)),
  ).join('');
  return `
    <p class="dica">Uma pílula só pode ser refinada numa fornalha de Ordem igual ou maior. Sua fornalha atual: <strong>${character.fornalha ?? 2}ª Ordem</strong>.</p>
    <div class="lista-atividades">${lista}</div>`;
}

function renderArmas(character: Character): string {
  const lista = equipamentosAVenda()
    .map((e, indice) => {
      const bonus = (Object.entries(e.bonusAtributos) as [AttributeKey, number][])
        .map(([chave, valor]) => `+${valor} ${ATTRIBUTE_INFO[chave].nome}`)
        .join(', ');
      return botao(
        `data-equipamento="${indice}"`,
        `${escapeHtml(e.nome)} <small>(${e.grau}º grau)</small>`,
        `${precoEquipamento(character, e)} pedras · ${bonus}`,
        motivoBloqueioEquipamento(character, e),
        e.descricao,
      );
    })
    .join('');
  return `
    <p class="dica">Armas, armaduras e acessórios vão para a bolsa (Inventário) para equipar. Peças de 4º e 5º grau ficam no Pavilhão de Tesouros e só são vendidas a quem tem fama. Os preços seguem a região.</p>
    <div class="lista-atividades">${lista}</div>`;
}

function renderSuprimentos(character: Character): string {
  const lista = SUPRIMENTOS.map((s, indice) => {
    const preco = precoSuprimento(character, s);
    return `
      <div class="linha-compra">
        ${botao(`data-suprimento="${indice}" data-qtd="1"`, escapeHtml(nomeItem(s.id)), `${preco} pedras`, motivoBloqueioSuprimento(character, s, 1), descricaoItem(s.id))}
        ${botao(`data-suprimento="${indice}" data-qtd="5"`, '×5', `${preco * 5} pedras`, motivoBloqueioSuprimento(character, s, 5))}
      </div>`;
  }).join('');
  return `
    <p class="dica">Pílulas básicas, ervas por idade (ingredientes de pílulas de Ordem alta), núcleos de besta e talismãs. Pílulas de 4ª Ordem em diante não se vendem em loja: refine-as ou dispute-as em leilões.</p>
    <div class="lista-atividades">${lista}</div>`;
}

function renderMercadores(character: Character, historia: StoryState): string {
  const semEnergia = historia.energia < ENERGIA_CONTRATO;
  const desconto = Math.round(descontoMercador(character) * 100);
  const cartoes = GRUPOS_MERCADORES.map((g) => {
    const rel = character.mercadores?.[g.id] ?? { reputacao: 0, cotas: 0 };
    const preco = precoCota(historia.mundo, g);
    return `
      <div class="objetivo">
        <div><strong>${escapeHtml(g.nome)}</strong><small>${escapeHtml(REGIOES[g.sede].nome)} · ${escapeHtml(g.especialidade)}</small></div>
        <p><small>${escapeHtml(g.descricao)}</small></p>
        <p><small>Reputação ${rel.reputacao} (<strong>${tituloReputacao(rel.reputacao)}</strong>) · ${rel.cotas} cota(s) · cota a ${preco} pedras · riqueza ${riqueza(historia.mundo, g).toLocaleString('pt-BR')}</small></p>
        <div class="botoes-interacao">
          <button class="botao-pequeno" data-contrato="${g.id}" ${semEnergia ? 'disabled title="Sem energia"' : ''}>Aceitar contrato (${ENERGIA_CONTRATO} de energia · ${ATTRIBUTE_INFO[g.atributo].nome})</button>
          <button class="botao-pequeno" data-cota="${g.id}" ${character.inventario.pedrasEspirituais < preco ? 'disabled' : ''}>Comprar cota (${preco})</button>
          <button class="botao-pequeno" data-vender-cota="${g.id}" ${rel.cotas <= 0 ? 'disabled' : ''}>Vender cota</button>
        </div>
      </div>`;
  }).join('');
  return `
    <p class="dica">Casas comerciais mais antigas que muitas seitas. Cotas pagam dividendos a cada estação (o valor segue a riqueza do grupo).
    Contratos rendem pedras e reputação: Parceiro (20) dá 5% de desconto em todo o Mercado, Associado (50) 10% e Conselheiro (100) 15% e dividendos maiores.
    Seu desconto atual: <strong>${desconto}%</strong>.</p>
    <div class="lista-objetivos">${cartoes}</div>`;
}

/** Painel Mercado: moradias, montarias e barcos voadores, fornalhas, armas, suprimentos e grupos mercadores. */
export function abrirMercado(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let mensagens: string[] = [];
  let pastaAberta: string | null = null;

  const render = (): void => {
    const scroll = overlay.querySelector('.painel')?.scrollTop ?? 0;
    const casa = getMoradia(character.moradia);
    const montaria = getMontaria(character.montaria);
    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Mercado</h2>
        <p><strong>${character.inventario.pedrasEspirituais}</strong> pedras espirituais · Moradia: <strong>${escapeHtml(casa?.nome ?? 'nenhuma')}</strong> · Montaria: <strong>${escapeHtml(montaria?.nome ?? 'nenhuma')}</strong> · Fornalha: <strong>${character.fornalha ?? 2}ª Ordem</strong></p>
        ${pasta('moradias', 'Moradias', casa ? `você mora em ${casa.nome}` : 'sem casa própria', renderMoradias(character), pastaAberta === 'moradias')}
        ${pasta('montarias', 'Montarias, Espadas e Barcos Voadores', montaria ? `você tem ${montaria.nome}` : 'a pé', renderMontarias(character), pastaAberta === 'montarias')}
        ${pasta('armas', 'Armas e Armaduras', `${equipamentosAVenda().length} peças`, renderArmas(character), pastaAberta === 'armas')}
        ${pasta('fornalhas', 'Fornalhas Alquímicas', `até a 10ª Ordem`, renderFornalhas(character), pastaAberta === 'fornalhas')}
        ${pasta('suprimentos', 'Ervas, Pílulas e Talismãs', `${SUPRIMENTOS.length} itens`, renderSuprimentos(character), pastaAberta === 'suprimentos')}
        ${pasta('mercadores', 'Grandes Grupos Mercadores', `desconto atual ${Math.round(descontoMercador(character) * 100)}%`, renderMercadores(character, historia), pastaAberta === 'mercadores')}
      </div>`;
    const painel = overlay.querySelector('.painel');
    if (painel) painel.scrollTop = scroll;
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
      mensagens = [];
      render();
      return;
    }

    const mercador = alvo.closest<HTMLButtonElement>('[data-contrato], [data-cota], [data-vender-cota]');
    if (mercador && !mercador.disabled) {
      const dm = mercador.dataset;
      if (dm.contrato) {
        if (!gastarEnergia(historia, ENERGIA_CONTRATO)) return;
        const resultado = executarEscolha(character, escolhaContrato(character, dm.contrato));
        const extras = registrarContrato(character);
        aoAlterar();
        render();
        abrirResultado(resultado, extras, 'Contrato mercante');
        return;
      }
      mensagens = dm.cota ? comprarCota(character, historia.mundo, dm.cota) : venderCota(character, historia.mundo, dm.venderCota ?? '');
      aoAlterar();
      render();
      avisar(mensagens);
      mensagens = [];
      return;
    }

    const alvoBotao = alvo.closest<HTMLButtonElement>('button.escolha');
    if (!alvoBotao || alvoBotao.disabled) return;
    const d = alvoBotao.dataset;

    if (d.moradia) {
      const m = MORADIAS.find((x) => x.id === d.moradia);
      if (m) mensagens = comprarMoradia(character, m);
    } else if (d.montaria) {
      const m = MONTARIAS.find((x) => x.id === d.montaria);
      if (m) mensagens = comprarMontaria(character, m);
    } else if (d.fornalha) {
      const f = FORNALHAS.find((x) => x.ordem === Number(d.fornalha));
      if (f) mensagens = comprarFornalha(character, f);
    } else if (d.equipamento) {
      const e = equipamentosAVenda()[Number(d.equipamento)];
      if (e) mensagens = comprarEquipamento(character, e);
    } else if (d.suprimento) {
      const s = SUPRIMENTOS[Number(d.suprimento)];
      if (s) mensagens = comprarSuprimento(character, s, Number(d.qtd ?? 1));
    } else {
      return;
    }

    aoAlterar();
    render();
    avisar(mensagens);
    mensagens = [];
  });

  render();
}
