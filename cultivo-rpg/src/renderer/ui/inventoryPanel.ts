import { formatarBonus } from '../../game/attributes';
import { Feito, NOME_FEITO, feitosDe, tracosDaVida } from '../../game/lifeTraits';
import { karmaDe, nivelKarma } from '../../game/karma';
import { DICA_SEM_METODO, metodoDeCultivo } from '../../game/cultivationMethod';
import { getIdentidade } from '../../game/soulAwakening';
import { Character, SLOTS_POR_TIPO, desequipar, equipar, getCharacterStats, getEffectiveAttributes } from '../../game/character';
import { Equipment, EquipmentType, NOME_TIPO_EQUIPAMENTO } from '../../game/equipment';
import { podeUsarConsumivel, usarConsumivel } from '../../game/effects';
import { descreverOrigem } from '../../game/origin';
import { PROFISSAO_IDS, PROFISSAO_INFO, tituloProfissao, xpParaProximoNivel } from '../../game/professions';
import { TIPO_RAIZ_INFO, descreverElementos, grauRaizInfo } from '../../game/spiritualRoot';
import { ESTILOS, ESTILO_IDS, NIVEIS_MAESTRIA, tituloMaestria, xpParaProximaMaestria } from '../../game/martialStyles';
import { NOME_CATEGORIA_TECNICA, Tecnica, chaveEstudo, dificuldadeEstudo, getTecnica, nomeGrau, tecnicaDoManual } from '../../game/techniques';
import { chanceDeSucesso } from '../../game/story';
import { influenciaFamilia, influenciaPessoal, pontosInfluenciaPessoal } from '../../game/influence';
import { descricaoItem } from '../../game/items';
import { descreverCompanheira } from '../../game/companion';
import { HERANCAS } from '../../game/inheritance';
import { getCicatriz } from '../../game/scars';
import { profeciaAtual } from '../../game/divination';
import { reducaoEstudoFaccao } from '../../game/faction';
import {
  CHANCE_YIN,
  DESCRICAO_NATUREZA,
  NOME_COMPATIBILIDADE,
  NOME_NATUREZA,
  avaliarCompatibilidade,
  compatibilidadeDaTecnica,
  nomeEnergia,
  sortearNaturezaQi,
} from '../../game/qiNature';
import { criarOverlay, escapeHtml } from './dom';
import { renderStatsGrid } from './hud';

const ORDEM_SLOTS: EquipmentType[] = ['arma', 'armadura', 'acessorio'];

function dicaItem(item: Equipment): string {
  return escapeHtml(`${item.descricao} (${item.grau}º Grau)`);
}

function renderFicha(character: Character): string {
  const raizRevelada = Boolean(character.flags.raizRevelada);
  const raiz = character.raizEspiritual;
  const corpo = character.origem.corpoEspecial;

  const profissoes = PROFISSAO_IDS.map((id) => {
    const estado = character.profissoes[id];
    const titulo = tituloProfissao(id, estado);
    return `<li><strong>${PROFISSAO_INFO[id].nome}:</strong> ${
      titulo ? `${titulo} (${estado.xp}/${xpParaProximoNivel(estado.nivel)} xp)` : 'não aprendida'
    }</li>`;
  }).join('');

  const familia = influenciaFamilia(character);
  const pessoal = influenciaPessoal(character);
  const herancas = HERANCAS.filter((h) => character.flags[`heranca:${h.id}`]).map((h) => h.nome).join('; ');
  const profecia = profeciaAtual(character);

  const estilos = ESTILO_IDS.filter((id) => character.estilos[id].nivel > 0)
    .map((id) => {
      const estado = character.estilos[id];
      const progresso = estado.nivel < NIVEIS_MAESTRIA.length ? ` (${estado.xp}/${xpParaProximaMaestria(estado.nivel)} xp)` : '';
      return `${escapeHtml(ESTILOS[id].nome)} — ${tituloMaestria(estado)}${progresso}`;
    })
    .join('; ');

  const tecnicas = character.tecnicas
    .map(getTecnica)
    .filter((t): t is Tecnica => Boolean(t))
    .map((t) => {
      const qi = avaliarCompatibilidade(character, t.id);
      return `<span title="${escapeHtml(`${t.descricao} — ${qi.rotulo}: ${qi.texto}`)}">${escapeHtml(t.nome)} (${nomeGrau(t)}, ${NOME_CATEGORIA_TECNICA[t.categoria]}, Qi ${escapeHtml(NOME_COMPATIBILIDADE[compatibilidadeDaTecnica(t.id)])}${qi.classe === 'seguro' ? '' : ` — ${escapeHtml(qi.rotulo)}`})</span>`;
    })
    .join('; ');

  const metodo = metodoDeCultivo(character);
  const almaDesperta = getIdentidade(String(character.flags.almaDespertada ?? ''));
  const tracosVida = tracosDaVida(character);
  const contagem = feitosDe(character);
  const karma = nivelKarma(character);
  const feitos =
    (Object.keys(NOME_FEITO) as Feito[])
      .filter((f) => contagem[f] > 0)
      .map((f) => `${contagem[f]} ${NOME_FEITO[f]}`)
      .join(' · ') || 'nada digno de nota ainda';

  const linhas = [
    `<li><strong>Origem:</strong> ${escapeHtml(descreverOrigem(character.origem))} · <strong>Traço:</strong> ${escapeHtml(character.traco.nome)}</li>`,
    tracosVida.length
      ? `<li><strong>Traços da vida:</strong><ul>${tracosVida
          .map((t) => `<li><strong>${escapeHtml(t.nome)}</strong> — ${escapeHtml(t.descricao)} <em>Ajuda: ${escapeHtml(t.vantagem)}. Atrapalha: ${escapeHtml(t.desvantagem)}.</em></li>`)
          .join('')}</ul></li>`
      : '',
    `<li><strong>Feitos:</strong> ${escapeHtml(feitos)}</li>`,
    `<li><strong>Karma:</strong> ${escapeHtml(karma.nome)} (${karmaDe(character)}) — ${escapeHtml(karma.descricao)}${
      karma.tribulacao ? `; ${karma.tribulacao > 0 ? '+' : ''}${karma.tribulacao} na dificuldade da Tribulação Celestial` : ''
    }. Crueldades e mortes pesam; boas ações aliviam.</li>`,
    almaDesperta
      ? `<li><strong>${character.traco.id === 'heranca-escondida' ? 'Sangue desperto' : 'Alma desperta'}:</strong> ${escapeHtml(almaDesperta.titulo)}</li>`
      : character.flags.almaDespertada === 'contida'
        ? '<li><strong>Alma desperta:</strong> memórias contidas — você escolheu continuar sendo quem é</li>'
        : '',
    raizRevelada
      ? `<li><strong>Método de cultivo:</strong> ${metodo ? escapeHtml(metodo) : `<em>nenhum</em> — ${escapeHtml(DICA_SEM_METODO)}`}</li>`
      : '',
    `<li><strong>Influência da família:</strong> ${escapeHtml(familia.nome)} — ${escapeHtml(familia.alcance)}</li>`,
    `<li><strong>Influência pessoal:</strong> ${escapeHtml(pessoal.nome)} (${pontosInfluenciaPessoal(character)} pts) — ${escapeHtml(pessoal.alcance)}</li>`,
    `<li><strong>Estilos marciais:</strong> ${estilos || 'nenhum ainda'}</li>`,
    character.naturezaQi
      ? `<li><strong>Natureza do Qi:</strong> ${escapeHtml(NOME_NATUREZA[character.naturezaQi])} — ${escapeHtml(DESCRICAO_NATUREZA[character.naturezaQi])}. Energia atual: ${nomeEnergia(character.cultivo.rank)}.</li>`
      : `<li><strong>Natureza do Qi:</strong> ainda não definida neste save. Ela decide quais técnicas combinam com você (não é um novo recurso: seu ${nomeEnergia(character.cultivo.rank)} continua o mesmo).
          <div class="botoes-interacao">
            <button class="botao-pequeno" data-natureza="yin">Meu Qi é Yin</button>
            <button class="botao-pequeno" data-natureza="yang">Meu Qi é Yang</button>
            <button class="botao-pequeno" data-natureza="corpo">Deixar o corpo decidir (~${Math.round(CHANCE_YIN[character.genero] * 100)}% Yin)</button>
          </div></li>`,
    `<li><strong>Técnicas:</strong> ${tecnicas || 'nenhuma ainda — encontre manuais em pavilhões, mercadores e ruínas'}</li>`,
    `<li><strong>Raiz espiritual:</strong> ${
      raizRevelada
        ? `Grau ${raiz.grau} — ${grauRaizInfo(raiz.grau).nome} · ${TIPO_RAIZ_INFO[raiz.tipo].nome} · ${descreverElementos(raiz)}`
        : '??? (revelada na Cerimônia do Despertar)'
    }</li>`,
    corpo ? `<li><strong>Corpo especial:</strong> ${raizRevelada ? `${corpo.nome} — ${corpo.descricao}` : '???'}</li>` : '',
    `<li><strong>Reputação:</strong> ${character.reputacao} · <strong>Toxina de pílula:</strong> ${Math.round(character.cultivo.toxina)}/100</li>`,
    character.companheira ? `<li><strong>Besta companheira:</strong> ${escapeHtml(descreverCompanheira(character.companheira))}</li>` : '',
    herancas ? `<li><strong>Heranças:</strong> ${escapeHtml(herancas)}</li>` : '',
    character.origem.reencarnacao && Number(character.flags.memoriasDespertadas ?? 0) > 0
      ? `<li><strong>Vida passada:</strong> ${escapeHtml(character.origem.reencarnacao.nomeAntigo)}, ${escapeHtml(character.origem.reencarnacao.titulo)} — ${escapeHtml(character.origem.reencarnacao.comoMorreu)} (${Number(character.flags.memoriasDespertadas)}/3 memórias)</li>`
      : character.origem.reencarnacao
        ? '<li><strong>Sonhos estranhos:</strong> memórias que não são suas…</li>'
        : '',
    profecia ? `<li><strong>Profecia:</strong> "${escapeHtml(profecia.texto)}"</li>` : '',
    character.cicatrizes.length
      ? `<li><strong>Cicatrizes:</strong> ${character.cicatrizes
          .map((id) => getCicatriz(id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
          .map((c) => `<span title="${escapeHtml(c.descricao)}">${escapeHtml(c.nome)}</span>`)
          .join('; ')}</li>`
      : '',
    character.flags.sequela ? `<li><strong>Sequela:</strong> ${escapeHtml(String(character.flags.sequela))} (1 Pílula de Cura ou 3 pedras por estação)</li>` : '',
    character.flags.nucleoRachado ? '<li><strong>Núcleo Rachado:</strong> cultivo −40% até uma Pílula da Medula Celestial</li>' : '',
    character.origem.herancaSelada && character.flags.herancaSelada ? '<li><strong>Pingente de jade:</strong> algo dorme dentro dele…</li>' : '',
    profissoes,
  ];

  return `<ul class="ficha">${linhas.join('')}</ul>`;
}

function renderSlots(character: Character): string {
  return ORDEM_SLOTS.flatMap((tipo) => {
    const equipadosDoTipo = character.equipamentos
      .map((item, indice) => ({ item, indice }))
      .filter(({ item }) => item.tipo === tipo);

    return Array.from({ length: SLOTS_POR_TIPO[tipo] }, (_, posicao) => {
      const slot = equipadosDoTipo[posicao];
      if (!slot) {
        return `
          <div class="slot vazio">
            <span class="slot-tipo">${NOME_TIPO_EQUIPAMENTO[tipo]}</span>
            <span class="slot-nome">— vazio —</span>
          </div>`;
      }
      return `
        <button class="slot cheio" data-desequipar="${slot.indice}" title="${dicaItem(slot.item)} — clique para desequipar">
          <span class="slot-tipo">${NOME_TIPO_EQUIPAMENTO[tipo]}</span>
          <span class="slot-nome">${escapeHtml(slot.item.nome)}</span>
          <span class="slot-bonus">${formatarBonus(slot.item.bonusAtributos)}</span>
        </button>`;
    });
  }).join('');
}

function renderBolsa(character: Character): string {
  const equipamentos = character.inventario.equipamentos.map(
    (item, indice) => `
      <button class="item-bolsa" data-equipar="${indice}" title="${dicaItem(item)} — clique para equipar">
        <span class="slot-tipo">${NOME_TIPO_EQUIPAMENTO[item.tipo]}</span>
        <span class="slot-nome">${escapeHtml(item.nome)}</span>
        <span class="slot-bonus">${formatarBonus(item.bonusAtributos)}</span>
      </button>`,
  );

  const compreensao = getEffectiveAttributes(character).inteligencia;
  const itens = character.inventario.itens.map((item) => {
    const usavel = podeUsarConsumivel(item.id);
    const tecnica = tecnicaDoManual(item.id);
    let tipo = usavel ? 'Consumível — clique para usar' : 'Material';
    let detalhe = '';
    if (tecnica) {
      if (character.tecnicas.includes(tecnica.id)) {
        tipo = 'Manual repetido — clique para vender';
      } else {
        const dificuldade = Math.max(5, dificuldadeEstudo(tecnica, Number(character.flags[chaveEstudo(tecnica.id)] ?? 0)) - reducaoEstudoFaccao(character));
        const chance = Math.round(chanceDeSucesso(compreensao, dificuldade) * 100);
        const qi = avaliarCompatibilidade(character, tecnica.id);
        tipo = qi.executavel ? 'Manual — clique para estudar' : 'Manual — só a teoria';
        detalhe = `<span class="slot-detalhe">Qi ${escapeHtml(NOME_COMPATIBILIDADE[compatibilidadeDaTecnica(tecnica.id)])} · ${escapeHtml(qi.rotulo)}: ${escapeHtml(qi.texto)}</span>
          <span class="slot-detalhe">Compreensão ${compreensao} vs. ${dificuldade} · ${chance}%</span>`;
      }
    }
    const conteudo = `
        <span class="slot-tipo">${tipo}</span>
        <span class="slot-nome">${escapeHtml(item.nome)}</span>
        ${detalhe}
        <span class="slot-bonus">x${item.quantidade}</span>`;
    const dica = escapeHtml(descricaoItem(item.id));
    return usavel
      ? `<button class="item-bolsa consumivel usavel" data-usar="${item.id}" title="${dica}">${conteudo}</button>`
      : `<div class="item-bolsa consumivel" title="${dica}">${conteudo}</div>`;
  });

  const conteudo = [...equipamentos, ...itens];
  return conteudo.length > 0 ? conteudo.join('') : '<p class="vazio-texto">A bolsa está vazia.</p>';
}

/** Abre o painel de inventário; `aoAlterar` é chamado a cada mudança para atualizar a tela de fundo. */
export function abrirInventario(character: Character, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let mensagens: string[] = [];

  const render = (): void => {
    overlay.innerHTML = `
      <div class="painel painel-inventario">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Inventário</h2>

        <div class="pedras-espirituais" title="Moeda espiritual universal: comércio, formações e cultivo.">
          <span class="pedra-icone"></span>
          <strong>${character.inventario.pedrasEspirituais}</strong>
          <span>Pedras Espirituais</span>
        </div>

        <h3>Ficha</h3>
        ${renderFicha(character)}

        <h3>Equipado</h3>
        <div class="slots">${renderSlots(character)}</div>

        <h3>Atributos de combate</h3>
        ${renderStatsGrid(getCharacterStats(character))}

        <h3>Bolsa</h3>
        ${mensagens.length > 0 ? `<div class="mensagens" data-mensagens-bolsa>${mensagens.map((m) => `<p>${escapeHtml(m)}</p>`).join('')}</div>` : ''}
        <div class="bolsa">${renderBolsa(character)}</div>
        <p class="dica">Clique num equipamento para equipar ou desequipar, ou numa pílula para usá-la.</p>
      </div>`;
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;

    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      return;
    }

    const botaoEquipar = alvo.closest<HTMLElement>('[data-equipar]');
    const botaoDesequipar = alvo.closest<HTMLElement>('[data-desequipar]');
    const botaoUsar = alvo.closest<HTMLElement>('[data-usar]');
    const botaoNatureza = alvo.closest<HTMLElement>('[data-natureza]');

    if (botaoNatureza && !character.naturezaQi) {
      const escolha = botaoNatureza.dataset.natureza;
      character.naturezaQi = escolha === 'yin' || escolha === 'yang' ? escolha : sortearNaturezaQi(character.genero);
      mensagens = [`Natureza do Qi definida: ${NOME_NATUREZA[character.naturezaQi]}.`];
    } else if (botaoEquipar) {
      equipar(character, Number(botaoEquipar.dataset.equipar));
      mensagens = [];
    } else if (botaoDesequipar) {
      desequipar(character, Number(botaoDesequipar.dataset.desequipar));
      mensagens = [];
    } else if (botaoUsar?.dataset.usar) {
      mensagens = usarConsumivel(character, botaoUsar.dataset.usar);
    } else {
      return;
    }

    const rolagem = overlay.querySelector('.painel')?.scrollTop ?? 0;
    aoAlterar();
    render();
    const painel = overlay.querySelector('.painel');
    if (painel) painel.scrollTop = rolagem;
    overlay.querySelector('[data-mensagens-bolsa]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  render();
}
