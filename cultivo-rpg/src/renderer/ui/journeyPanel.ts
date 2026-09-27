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
  const seletor = document.createElement('label');
  seletor.className = 'linhagem-seletor';
  seletor.innerHTML = `Vida consultada<select aria-label="Vida consultada"><option value="atual">Vida atual</option>${(h.ancestrais ?? []).map((a, i) => `<option value="${i}">${i + 1}ª geração · ${escapeHtml(a.nome)}</option>`).join('')}</select>`;
  overlay.querySelector('.busca-label')!.before(seletor);
  const vida = seletor.querySelector('select')!;
  const render = (): void => {
    overlay.querySelector('.abas')!.innerHTML = categorias.map(([id, label]) => `<button class="aba ${filtro === id ? 'ativa' : ''}" data-filtro="${id}" aria-pressed="${filtro === id}">${label}</button>`).join('');
    const ancestral = vida.value === 'atual' ? null : h.ancestrais?.[Number(vida.value)];
    const registros = [...(ancestral?.registros ?? h.diario ?? [])].reverse().filter(r =>
      (filtro === 'todos' || r.categoria === filtro) && normalizar(`${r.titulo} ${r.texto}`).includes(normalizar(busca.value)));
    const resumo = ancestral ? `<article class="guia-item"><h3>${escapeHtml(ancestral.nome)}</h3><p>${Math.floor(ancestral.idadeMeses / 12)} anos · ${escapeHtml(ancestral.reino)} · Fama ${ancestral.reputacao}</p></article>` : '';
    overlay.querySelector('.conteudo-jornada')!.innerHTML = resumo + (registros.length
      ? `<ol class="linha-tempo">${registros.map(r => `<li class="registro registro-${r.categoria}">
        <small>${Math.floor(r.idadeMeses / 12)} anos · Capítulo ${r.turno + 1} · ${categorias.find(([id]) => id === r.categoria)?.[1]}</small>
        <h3>${escapeHtml(r.titulo)}</h3><p>${escapeHtml(r.texto)}</p></li>`).join('')}</ol>`
      : '<div class="estado-vazio"><h3>Nenhum registro encontrado</h3><p>Tente outra palavra ou continue sua jornada.</p></div>');
  };
  busca.addEventListener('input', render);
  vida.addEventListener('change', render);
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
    { categoria: 'Fundamentos', titulo: 'Uma linhagem, muitas vidas', texto: 'Ao fim de uma vida, filhos elegíveis podem continuar a linhagem. Herdeiros recebem parte do patrimônio, os campos e as plantações. No Diário, use Vida consultada para rever as crônicas dos ancestrais arquivadas a partir desta atualização.' },
    { categoria: 'Fundamentos', titulo: 'Campos espirituais', texto: 'A partir dos 12 anos, compre até três campos. Eles são automáticos: a colheita vai sozinha para a bolsa e o campo replanta a semente fixada (ou a melhor que seu reino permite, sem gastar mais da metade das suas pedras). Plantar não custa energia. Ervas de 500 e 1000 anos exigem os reinos 3 e 5 e são maturadas por formações espirituais aceleradas.' },
    { categoria: 'Fundamentos', titulo: 'Discípulos', texto: 'A partir do 3º reino, com reputação 20, você pode aceitar discípulos em Relações (1 no 3º reino, +1 por reino, até 5). Ensinar custa 1 de energia; eles também cultivam sozinhos, nunca passam do seu reino, e cada reino que rompem aumenta sua fama.' },
    { categoria: 'Fundamentos', titulo: 'Grupos mercadores', texto: 'Quatro grandes casas comerciais atravessam as regiões (Mercado → Grandes Grupos Mercadores). Cotas pagam dividendos a cada estação; contratos rendem pedras e reputação, e a reputação dá 5%, 10% ou 15% de desconto em todo o Mercado.' },
    { categoria: 'Fundamentos', titulo: 'Mestre pessoal', texto: 'Em Relações, discípulos de seita com pelo menos 12 anos podem oferecer 50 de contribuição a um ancião de reino superior. O velho de roupas gastas que aparece na estrada também pode aceitar você, sem precisar de seita. A orientação custa 1 de energia, ocorre uma vez por capítulo e melhora cultivo, toxina e vínculo. Um discípulo serve a um único mestre: ao alcançar o reino dele, você se forma com honra e pode buscar outro; romper antes disso é desonra (reputação −15, alinhamento −10 e anos sem que outro mestre o aceite).' },
    { categoria: 'Fundamentos', titulo: 'Bestas: linhagem e idade', texto: 'O reino de uma besta vem da espécie, não de quem a encontra. Filhotes nascem no reino da linhagem (Comum e Espiritual no 1º, Demoníaca no 2º, Divina no 3º, Ancestral no 4º), não rompem reinos e lutam com 40% da força. Jovens já rompem reinos; adultas alcançam o teto da espécie; anciãs podem passar dele. Consulte o Bestiário para ver todas as espécies.' },
    { categoria: 'Fundamentos', titulo: 'Método de cultivo', texto: 'Uma raiz espiritual sozinha não cultiva: é preciso alguém ou algo que ensine a circular o qi. Quem nasce em clã ou seita aprende desde criança. Quem nasce em família comum ou órfão não tem cultivo passivo e medita quase sem resultado até conseguir um método: entrar para uma seita ou clã, ser aceito por um mestre (o velho de roupas gastas aceita qualquer um), estudar um manual de Método de Cultivo (vendido em Atividades → Educação e Lazer) ou despertar memórias de uma vida passada. Sua ficha no Inventário mostra de onde vem o seu método.' },
    { categoria: 'Fundamentos', titulo: 'Autodidatas', texto: 'Atributos altos abrem portas sem mestre: com Inteligência 10 você pode aprender Alquimia sozinho; com Inteligência 12, Inscrição; com Espírito 10, a Divinação (prever o futuro). Procure em Atividades — Educação e Lazer e Bestas e Espiritualidade.' },
    { categoria: 'Fundamentos', titulo: 'Sorte e nascimento', texto: 'A Sorte da criação decide o nascimento: região, família (clã, seita, família comum ou órfão) e o grau da raiz espiritual. Com Sorte 5, uma raiz de grau 4 ou mais sai em ~5% das vidas; com Sorte 15, ~8%; com 20, ~10%. O efeito é maior na família: com Sorte 20 você sempre nasce em clã ou seita. A tela de criação mostra as chances para a sua Sorte.' },
    { categoria: 'Fundamentos', titulo: 'Alma Antiga e Herança Escondida', texto: 'Quem nasce com um desses traços pode, entre os 16 e os 100 anos — quase sempre logo depois de estar à beira da morte —, despertar quem foi em outra era (Alma Antiga) ou de quem descende (Herança Escondida): Deus da Alquimia e das Pílulas, Soberano do Céu e da Terra, Demônio Supremo, Santo da Espada, Senhor das Mil Bestas, Grão-Mestre dos Talismãs ou Oráculo do Destino. A raiz espiritual é rolada de novo, no mínimo grau 3 (uma raiz melhor nunca piora). Você pode abraçar o legado ou tentar conter as memórias e ficar só com a raiz nova.' },
    { categoria: 'Fundamentos', titulo: 'Traços da vida', texto: 'O que você faz molda quem você é. O jogo conta seus feitos: pessoas mortas, bestas abatidas, boas ações e crueldades (toda escolha que mexe no alinhamento), lutas vencidas e perdidas, quase-mortes e pílulas refinadas. Ao passar de um limite surge um traço — por exemplo, 100 mortes com o coração frio fazem um Psicopata; ajudar muita gente faz um Coração Bondoso ou até um Santo Vivo. Outros traços surgem ao acaso com os anos (até três por vida). Cada traço ajuda e atrapalha: atributos, cultivo, relações, emboscadas, vingadores. Veja os seus e os feitos na ficha do Inventário.' },
    { categoria: 'Fundamentos', titulo: 'Noivado arranjado', texto: 'Quem nasce em clãs e seitas de prestígio costuma ser prometido ainda no berço a alguém de outra família poderosa — geralmente um grande talento, que cultiva com o tempo. Veja a força de quem foi prometido em Relações. A partir dos 16 anos, se você tiver menos de 70% da força dessa pessoa, ela pode romper o noivado em público: aceite, marque um duelo para dali a três anos ou lute ali mesmo. Famílias orgulhosas ou demoníacas podem mandar um assassino. Com pelo menos 80% da força dela aos 18 anos, o casamento acontece e sela a aliança.' },
    { categoria: 'Fundamentos', titulo: 'Guerra de clãs', texto: 'Seitas e clãs rivais da mesma região podem declarar guerra à sua (é preciso pertencer a uma, ou ter fundado a sua). No painel Mundo → Guerra, lidere ataques, desafie o líder inimigo (com a força real dele) ou sabote depósitos. A cada estação a guerra pende para o lado mais forte. Placar +5: o inimigo vira vassalo e você leva os espólios; −5: você perde pedras e reputação (e membros e instalações, se lidera a facção). A trégua custa indenização se você estiver perdendo.' },
    { categoria: 'Fundamentos', titulo: 'Rankings', texto: 'Em Rankings escolha qualquer uma das cinco regiões para ver os cultivadores mais fortes, os maiores talentos, os melhores alquimistas e as seitas e clãs mais poderosos. Você só aparece no ranking da região onde está; sua facção aparece junto das outras.' },
    { categoria: 'Fundamentos', titulo: 'Heranças e alinhamento', texto: 'Uma herança acompanha o caminho de quem a encontra. Com alinhamento demoníaco (−40 ou menos) só aparecem legados demoníacos, como o do Rei Demoníaco ou da Imperatriz de Sangue. Com alinhamento positivo, nunca. Heranças se acumulam: uma não apaga a outra.' },
    { categoria: 'Fundamentos', titulo: 'Jornadas salvas', texto: 'Cada um dos três slots guarda uma vida independente. O slot 1 usa seu save original. Exporte um JSON para guardar uma cópia externa e importe para continuar em outro slot. Cada gravação conserva a versão anterior válida como backup, recuperado automaticamente se o arquivo principal estiver corrompido.' },
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
