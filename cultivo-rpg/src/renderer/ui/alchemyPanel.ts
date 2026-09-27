import { Character } from '../../game/character';
import {
  ENERGIA_REFINO,
  INGREDIENTE_BONUS,
  Oficio,
  RECEITAS,
  dificuldadeReceita,
  motivoBloqueioReceita,
  nivelOficio,
  ordemFornalha,
  precoArtefato,
  precoVenda,
  refinar,
  venderArtefato,
  venderItem,
} from '../../game/alchemyWorkshop';
import { descricaoItem, getConsumivel, nomeItem } from '../../game/items';
import { quantidadeItem } from '../../game/inventory';
import { PROFISSAO_INFO, tituloProfissao, xpParaProximoNivel } from '../../game/professions';
import { ENERGIA_POR_ESTACAO, StoryState, gastarEnergia } from '../../game/story';
import { tecnicaDoManual } from '../../game/techniques';
import { ENERGIA_FORJA, QUALIDADES, RECEITAS_FORJA, descreverMateriais, forjar, motivoBloqueioForja, valorDeForja } from '../../game/forge';
import { criarOverlay, escapeHtml } from './dom';
import { avisar, renderEnergia } from './resultView';

export function temOficio(character: Character): boolean {
  return character.profissoes.alquimia.nivel > 0 || character.profissoes.inscricao.nivel > 0 || character.profissoes.refinador.nivel > 0;
}

type AbaOficio = Oficio | 'forja';

function renderForja(character: Character, historia: StoryState): string {
  const semEnergia = historia.energia < ENERGIA_FORJA;
  const receitas = RECEITAS_FORJA.map((receita, indice) => {
    const bloqueio = motivoBloqueioForja(character, receita) ?? (semEnergia ? 'Sem energia' : null);
    const bonus = Object.entries(receita.bonus).map(([k, v]) => `+${v} ${k.slice(0, 3).toUpperCase()}`).join(' ');
    return `
      <button class="escolha" data-forjar="${indice}" ${bloqueio ? 'disabled' : ''}>
        <span>${escapeHtml(receita.nome)} <small>(${receita.grau}º grau · base ${bonus})</small></span>
        <small>${escapeHtml(bloqueio ?? `${descreverMateriais(receita)} · valor ${valorDeForja(character)} vs. ${receita.dificuldade}`)}</small>
      </button>`;
  }).join('');
  const qualidades = QUALIDADES.map((q) => `${q.nome} ×${q.multiplicador.toLocaleString('pt-BR')} (margem ${q.margem}+)`).join(' · ');
  return `
    <h3>Forjar (${ENERGIA_FORJA} de energia cada)</h3>
    <p class="dica">O teste usa a média de Força e Inteligência + 2 por nível de forja. Quanto mais você passa da dificuldade, melhor a qualidade, que multiplica os bônus da peça: ${escapeHtml(qualidades)}.</p>
    <p class="dica">Materiais: compre produtos regionais no painel Mundo → Rotas Comerciais; núcleos de besta vêm de caçadas.</p>
    <div class="lista-atividades">${receitas}</div>`;
}

/** Aba de ofícios: refinar pílulas (Alquimia), gravar talismãs (Inscrição), vender produção e artefatos. */
export function abrirOficios(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  let mensagens: string[] = [];
  let usarIngrediente = false;
  let aba: AbaOficio =
    character.profissoes.alquimia.nivel > 0 ? 'alquimia' : character.profissoes.inscricao.nivel > 0 ? 'inscricao' : 'forja';

  const render = (): void => {
    const oficio: Oficio = aba === 'forja' ? 'alquimia' : aba;
    const profissaoAba = aba === 'forja' ? 'refinador' : aba;
    const estado = character.profissoes[profissaoAba];
    const ingrediente = INGREDIENTE_BONUS[oficio];
    const quantidadeIngrediente = quantidadeItem(character.inventario, ingrediente);
    const semEnergia = historia.energia < ENERGIA_REFINO;

    const abas = (['alquimia', 'inscricao', 'forja'] as AbaOficio[])
      .filter((o) => character.profissoes[o === 'forja' ? 'refinador' : o].nivel > 0)
      .map((o) => `<button class="aba ${o === aba ? 'ativa' : ''}" data-oficio="${o}">${o === 'forja' ? 'Forja' : PROFISSAO_INFO[o].nome}</button>`)
      .join('');

    const receitas = RECEITAS.map((receita, indice) => ({ receita, indice }))
      .filter(({ receita }) => receita.oficio === oficio)
      .map(({ receita, indice }) => {
        const bloqueio = motivoBloqueioReceita(character, receita, usarIngrediente) ?? (semEnergia ? 'Sem energia' : null);
        const dificuldade = dificuldadeReceita(character, receita, usarIngrediente);
        const ingredientes = (receita.ingredientes ?? []).map((i) => `${i.quantidade}× ${nomeItem(i.id)}`).join(', ');
        return `
          <button class="escolha" data-refinar="${indice}" ${bloqueio ? 'disabled' : ''} title="${escapeHtml(descricaoItem(receita.id))}">
            <span>${escapeHtml(nomeItem(receita.id))} <small>(${receita.ordem}ª Ordem)</small></span>
            <small>${escapeHtml(bloqueio ?? `${receita.custoPedras} pedras${ingredientes ? `, ${ingredientes}` : ''} · Inteligência vs. ${dificuldade}`)}</small>
          </button>`;
      })
      .join('');

    const vendaveis = character.inventario.itens
      .filter((item) => (getConsumivel(item.id)?.valor ?? 0) > 0 && !tecnicaDoManual(item.id))
      .map(
        (item) => `
        <button class="escolha" data-vender="${escapeHtml(item.id)}">
          <span>${escapeHtml(item.nome)} ×${item.quantidade}</span>
          <small>Vender 1 por ${precoVenda(character, item.id)} pedras</small>
        </button>`,
      )
      .join('');

    const artefatos = character.inventario.equipamentos
      .map(
        (item, indice) => `
        <button class="escolha" data-vender-artefato="${indice}">
          <span>${escapeHtml(item.nome)} <small>(${item.grau}º grau)</small></span>
          <small>Vender por ${precoArtefato(character, indice)} pedras</small>
        </button>`,
      )
      .join('');

    const verbo = oficio === 'alquimia' ? 'Refinar pílulas' : 'Gravar talismãs';
    const explicacao =
      oficio === 'alquimia'
        ? `Quanto mais você passa da dificuldade, mais anéis no núcleo: a pureza vai de Bronze (1 anel) a Lendário (5 anéis), multiplicando o efeito e reduzindo a toxina. Pílulas até a 3ª Ordem podem sair em dobro. Sua fornalha: ${ordemFornalha(character)}ª Ordem (fornalhas melhores e ervas de 500/1000 anos no Mercado).`
        : 'Quanto mais você passa da dificuldade, maior a qualidade (Bronze → Prata → Ouro) — e mais talismãs saem (até 3). Talismãs são usados sozinhos na próxima luta.';

    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Ofícios</h2>
        <div class="abas">${abas}</div>
        <p><strong>${escapeHtml(tituloProfissao(profissaoAba, estado) ?? '')}</strong> · ${estado.xp}/${xpParaProximoNivel(estado.nivel)} xp · Nível ${estado.nivel}</p>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}

        ${
          aba === 'forja'
            ? renderForja(character, historia)
            : `<h3>${verbo} (${ENERGIA_REFINO} de energia cada)</h3>
        <label class="opcao">
          <input type="checkbox" id="usar-ingrediente" ${usarIngrediente ? 'checked' : ''} ${quantidadeIngrediente === 0 ? 'disabled' : ''} />
          Usar ${escapeHtml(nomeItem(ingrediente))} (+2 no teste) — você tem ${quantidadeIngrediente}
        </label>
        <p class="dica">${explicacao}</p>
        <div class="lista-atividades">${receitas}</div>`
        }

        <h3>Vender produção e materiais</h3>
        <p class="dica">Seu nível no ofício valoriza pílulas e talismãs (+15% por nível).</p>
        <div class="lista-atividades">${vendaveis || '<p class="vazio-texto">Nada para vender.</p>'}</div>

        <h3>Vender artefatos (da bolsa)</h3>
        <div class="lista-atividades">${artefatos || '<p class="vazio-texto">Nenhum artefato na bolsa.</p>'}</div>
      </div>`;
  };

  overlay.addEventListener('change', (evento) => {
    const alvo = evento.target as HTMLInputElement;
    if (alvo.id === 'usar-ingrediente') {
      usarIngrediente = alvo.checked;
      render();
    }
  });

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      return;
    }

    const botaoOficio = alvo.closest<HTMLElement>('[data-oficio]');
    const botaoRefinar = alvo.closest<HTMLButtonElement>('[data-refinar]');
    const botaoVender = alvo.closest<HTMLButtonElement>('[data-vender]');
    const botaoArtefato = alvo.closest<HTMLButtonElement>('[data-vender-artefato]');

    if (botaoOficio?.dataset.oficio) {
      aba = botaoOficio.dataset.oficio as AbaOficio;
      usarIngrediente = false;
      mensagens = [];
      render();
      return;
    }

    const botaoForjar = alvo.closest<HTMLButtonElement>('[data-forjar]');
    if (botaoForjar && !botaoForjar.disabled) {
      const receita = RECEITAS_FORJA[Number(botaoForjar.dataset.forjar)];
      if (!receita || motivoBloqueioForja(character, receita) || !gastarEnergia(historia, ENERGIA_FORJA)) return;
      mensagens = forjar(character, receita);
      aoAlterar();
      render();
      avisar(mensagens);
      mensagens = [];
      return;
    }

    if (botaoRefinar && !botaoRefinar.disabled) {
      const receita = RECEITAS[Number(botaoRefinar.dataset.refinar)];
      if (!receita || motivoBloqueioReceita(character, receita, usarIngrediente) || !gastarEnergia(historia, ENERGIA_REFINO)) return;
      mensagens = refinar(character, receita, usarIngrediente);
      if (quantidadeItem(character.inventario, INGREDIENTE_BONUS[receita.oficio]) === 0) usarIngrediente = false;
    } else if (botaoVender?.dataset.vender) {
      mensagens = venderItem(character, botaoVender.dataset.vender, 1);
    } else if (botaoArtefato) {
      mensagens = venderArtefato(character, Number(botaoArtefato.dataset.venderArtefato));
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
