import { Character, getCharacterStats } from '../../game/character';
import { StoryState, ENERGIA_POR_ESTACAO } from '../../game/story';
import { estadoCampanha } from '../../game/campaign';
import { REGIOES } from '../../game/world';
import { precisaTribulacao } from '../../game/cultivation';
import { DICA_SEM_METODO, metodoDeCultivo } from '../../game/cultivationMethod';
import { escapeHtml } from './dom';

export function icone(nome: string): string {
  const desenhos: Record<string, string> = {
    jornada: '<path d="m3 20 6-16 4 10 3-6 5 12H3Z"/>',
    atividades: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
    missoes: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 15h4"/>',
    mundo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',
    rankings: '<path d="M8 21V11h8v10M2 21V16h6M16 21V7h6v14M2 21h20M6 3l1 2 2 .3-1.5 1.5.3 2.2L6 8 4.2 9l.3-2.2L3 5.3 2 5l1-2Z"/>',
    relacoes: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5v2"/>',
    ocupacao: '<path d="M3 10h18L12 3 3 10ZM5 10v10m7-10v10m7-10v10M2 21h20"/>',
    alquimia: '<path d="M9 3h6m-5 0v7l-6 9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l-6-9V3M7 15h10"/>',
    mercado: '<path d="M3 8h18l-2-5H5L3 8Zm1 0v13h16V8M9 21v-7h6v7M3 8c0 4 4 4 5 0 1 4 7 4 8 0 1 4 5 4 5 0"/>',
    inventario: '<path d="M5 8h14l2 13H3L5 8Zm3 0V5a4 4 0 0 1 8 0v3M9 13h6"/>',
    diario: '<path d="M4 3h7l1 2 1-2h7v17h-7l-1 1-1-1H4V3Zm8 2v16M7 8h2m6 0h2M7 12h2m6 0h2"/>',
    guia: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 0-1 1-1 2M12 17h.01"/>',
    opcoes: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    salvar: '<path d="M4 3h13l3 3v15H4V3Zm4 0v6h8V3M8 21v-8h8v8"/>',
    saves: '<rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><path d="M3 18v3h18v-3M7 5.5h.1M7 12.5h.1"/>',
    campos: '<path d="M3 21h18M12 21V9M12 14C5 14 4 9 4 5c5 0 8 3 8 9ZM12 11c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
    bestiario: '<circle cx="12" cy="15" r="4"/><circle cx="5.5" cy="10" r="2"/><circle cx="18.5" cy="10" r="2"/><circle cx="9" cy="5.5" r="2"/><circle cx="15" cy="5.5" r="2"/>',
    menu: '<path d="M10 3H4v18h6m-1-9h12m-4-4 4 4-4 4"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${desenhos[nome] ?? desenhos.jornada}</svg>`;
}

export function renderPainelJornada(c: Character, h: StoryState): string {
  const objetivos = estadoCampanha(c, h.mundo);
  const objetivo = objetivos.find(o => o.status === 'em-andamento' || o.status === 'concluido');
  const completos = objetivos.filter(o => o.status === 'resgatado').length;
  const vidaBaixa = c.vidaAtual < getCharacterStats(c).vida * .35;
  const conselho = h.desfecho?.final ? 'Sua vida chegou ao fim. Escolha um herdeiro, se houver, para continuar a linhagem.'
    : vidaBaixa ? 'Sua vida está baixa. Abra o inventário para verificar suas pílulas antes de um novo confronto.'
    : c.flags.raizRevelada && !metodoDeCultivo(c) ? DICA_SEM_METODO
    : precisaTribulacao(c.cultivo) ? 'Você alcançou o ápice deste reino. Prepare-se para uma Tribulação Celestial.'
    : h.energia === 0 ? 'Sua energia acabou. Continue a história para avançar o tempo e recuperar energia.'
    : 'Aproveite sua energia para cultivar, explorar ou desenvolver um ofício antes de avançar a história.';
  return `<aside class="painel-jornada-lateral" aria-label="Resumo da jornada">
    <section class="card-jornada"><p class="eyebrow">Seu próximo passo</p>
      <div class="card-heading"><h2>O caminho adiante</h2>${icone('missoes')}</div>
      <div class="progresso-campanha"><span style="width:${completos / objetivos.length * 100}%"></span></div>
      <p class="dica">${completos} de ${objetivos.length} objetivos resgatados</p>
      ${objetivo ? `<h3>${escapeHtml(objetivo.objetivo.titulo)}</h3><p>${escapeHtml(objetivo.objetivo.descricao)}</p>
      <div class="recompensa"><small>RECOMPENSA</small>${escapeHtml(objetivo.objetivo.textoRecompensa)}</div>
      <button class="largo ${objetivo.status === 'concluido' ? 'primario' : ''}" data-abrir="missoes">${objetivo.status === 'concluido' ? 'Resgatar recompensa' : 'Ver missões'} <span aria-hidden="true">→</span></button>` : '<p>Todos os objetivos desta campanha foram cumpridos.</p>'}
    </section>
    <section class="card-jornada"><p class="eyebrow">Ritmo da jornada</p><div class="card-heading"><h2>Energia disponível</h2><strong>${h.energia}<small>/${ENERGIA_POR_ESTACAO}</small></strong></div>
      <div class="energia-segmentos" aria-label="${h.energia} de ${ENERGIA_POR_ESTACAO} pontos">${Array.from({length: ENERGIA_POR_ESTACAO}, (_, i) => `<span class="${i < h.energia ? 'cheio' : ''}"></span>`).join('')}</div>
      <p>${conselho}</p><button class="link-botao" data-abrir="atividades">Explorar atividades →</button>
    </section>
    <section class="card-jornada card-regiao"><p class="eyebrow">Você está em</p><h2>${escapeHtml(c.local.cidade)}</h2><span class="regiao-selo">${escapeHtml(REGIOES[c.local.regiao].nome)}</span><p>${escapeHtml(REGIOES[c.local.regiao].descricao)}</p><button class="link-botao" data-abrir="mundo">Conhecer o mundo →</button></section>
  </aside>`;
}
