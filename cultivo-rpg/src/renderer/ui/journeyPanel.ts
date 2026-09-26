import type { StoryState } from '../../game/story';
import { REINOS } from '../../game/cultivation';
import { REGIOES } from '../../game/world';
import { LIMITE_DIARIO } from '../../game/journal';
import { criarOverlay, escapeHtml } from './dom';

const normalizar = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function painel(titulo: string, descricao: string): HTMLDivElement {
  const overlay = criarOverlay();
  overlay.innerHTML = `<section class="painel painel-jornada">
    <button class="fechar" aria-label="Fechar">×</button><p class="eyebrow">Pavilhão do conhecimento</p>
    <h2>${titulo}</h2><p class="descricao">${descricao}</p>
    <label class="busca-label">Pesquisar<input type="search" class="busca-jornada" placeholder="Digite uma palavra…" /></label>
    <div class="abas" role="group" aria-label="Filtros"></div><div class="conteudo-jornada"></div></section>`;
  overlay.addEventListener('click', e => {
    if (e.target === overlay || (e.target as HTMLElement).closest('.fechar')) overlay.remove();
  });
  return overlay;
}

export function abrirDiario(h: StoryState): void {
  const overlay = painel('Crônicas da jornada', `Suas escolhas, atividades e conquistas. Os ${LIMITE_DIARIO} registros mais recentes ficam guardados no save desta vida.`);
  let filtro = 'todos';
  const categorias = [['todos', 'Tudo'], ['historia', 'História'], ['marco', 'Marcos'], ['atividade', 'Atividades']];
  const busca = overlay.querySelector<HTMLInputElement>('input')!;
  const render = (): void => {
    overlay.querySelector('.abas')!.innerHTML = categorias.map(([id, label]) => `<button class="aba ${filtro === id ? 'ativa' : ''}" data-filtro="${id}" aria-pressed="${filtro === id}">${label}</button>`).join('');
    const registros = [...(h.diario ?? [])].reverse().filter(r =>
      (filtro === 'todos' || r.categoria === filtro) && normalizar(`${r.titulo} ${r.texto}`).includes(normalizar(busca.value)));
    overlay.querySelector('.conteudo-jornada')!.innerHTML = registros.length
      ? `<ol class="linha-tempo">${registros.map(r => `<li class="registro registro-${r.categoria}">
        <small>${Math.floor(r.idadeMeses / 12)} anos · Capítulo ${r.turno + 1} · ${categorias.find(([id]) => id === r.categoria)?.[1]}</small>
        <h3>${escapeHtml(r.titulo)}</h3><p>${escapeHtml(r.texto)}</p></li>`).join('')}</ol>`
      : '<div class="estado-vazio"><h3>Nenhum registro encontrado</h3><p>Tente outra palavra ou continue sua jornada.</p></div>';
  };
  busca.addEventListener('input', render);
  overlay.querySelector('.abas')!.addEventListener('click', e => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-filtro]')?.dataset.filtro;
    if (id) { filtro = id; render(); }
  });
  render();
}

export function abrirGuia(): void {
  const textos = [
    { categoria: 'Fundamentos', titulo: 'Como o tempo avança', texto: 'Resolva o evento e selecione Continuar. O tempo indicado pelo evento passa, seus recursos são atualizados e a energia é renovada. Você pode realizar atividades entre as escolhas.' },
    { categoria: 'Fundamentos', titulo: 'Energia e atividades', texto: 'Você recebe 5 pontos de energia por estação. Atividades, missões, desafios e ofícios podem gastar energia. Consulte o custo em cada painel. Repetir a mesma atividade mais de 3 vezes na estação pode deixar de render e causar consequências.' },
    { categoria: 'Fundamentos', titulo: 'Cultivo e tribulações', texto: 'Acumule progresso para subir de estágio. No ápice de um reino, uma Tribulação Celestial separa você do próximo. Prepare sua vida e seus recursos: falhar pode ferir ou matar o personagem.' },
    { categoria: 'Fundamentos', titulo: 'Pílulas e toxina', texto: 'Pílulas ajudam a cultivar e recuperar a vida, mas algumas acumulam toxina. A toxina reduz a velocidade de cultivo e diminui com o passar das estações. A pureza da pílula influencia seus efeitos.' },
    { categoria: 'Fundamentos', titulo: 'Afinidade elemental', texto: 'Fogo supera Metal; Metal supera Madeira; Madeira supera Terra; Terra supera Água; Água supera Fogo. A vantagem elemental aumenta o dano em 25%; a desvantagem reduz em 20%.' },
    { categoria: 'Fundamentos', titulo: 'Objetivos e recompensas', texto: 'A campanha avança em sequência. Abra Missões para consultar objetivos e resgatar recompensas concluídas. O painel da jornada mostra seu próximo objetivo.' },
    { categoria: 'Fundamentos', titulo: 'Uma linhagem, muitas vidas', texto: 'Ao fim de uma vida, filhos elegíveis podem continuar a linhagem. Herdeiros recebem parte do patrimônio e do legado. O diário acompanha a vida atual; o nome da linhagem permanece no resumo de fim de vida.' },
    ...REINOS.map(r => ({ categoria: 'Reinos', titulo: `${r.rank.toString().padStart(2, '0')} · ${r.nome}`, texto: `${r.titulo} · ${r.estagios} estágios · Recurso: ${r.recurso}. Expectativa de vida base: ${Number.isFinite(r.expectativaAnos) ? r.expectativaAnos.toLocaleString('pt-BR') + ' anos' : 'ilimitada'}.` })),
    ...Object.values(REGIOES).map(r => ({ categoria: 'Regiões', titulo: r.nome, texto: `${r.descricao} Hierarquia de força: ${r.posicao}º lugar. Seitas: ${r.seitasSupremas.map(s => s.nome).join(', ')}. Fauna: ${r.fauna.join(', ')}.` })),
  ];
  const overlay = painel('Guia do cultivador', 'Consulte as regras do jogo, os 13 reinos e as cinco regiões. Não consome energia.');
  const busca = overlay.querySelector<HTMLInputElement>('input')!;
  let filtro = 'Fundamentos';
  const render = (): void => {
    overlay.querySelector('.abas')!.innerHTML = ['Fundamentos', 'Reinos', 'Regiões'].map(c => `<button class="aba ${filtro === c ? 'ativa' : ''}" data-filtro="${c}" aria-pressed="${filtro === c}">${c}</button>`).join('');
    const itens = textos.filter(t => (busca.value || t.categoria === filtro) && normalizar(`${t.titulo} ${t.texto}`).includes(normalizar(busca.value)));
    overlay.querySelector('.conteudo-jornada')!.innerHTML = itens.map(t => `<article class="guia-item"><small>${t.categoria}</small><h3>${escapeHtml(t.titulo)}</h3><p>${escapeHtml(t.texto)}</p></article>`).join('') || '<p class="estado-vazio">Nenhum resultado. Tente outra palavra.</p>';
  };
  busca.addEventListener('input', render);
  overlay.querySelector('.abas')!.addEventListener('click', e => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-filtro]')?.dataset.filtro;
    if (id) { filtro = id; busca.value = ''; render(); }
  });
  render();
}
