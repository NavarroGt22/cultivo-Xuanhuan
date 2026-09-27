import type { Character } from '../../game/character';
import { ESPECIES, EspecieBesta, FATOR_FASE, Linhagem, rankMaximoDaFase, rankNascimento } from '../../game/bestiary';
import { especieDaCompanheira } from '../../game/companion';
import { REINOS } from '../../game/cultivation';
import { NOME_ELEMENTO } from '../../game/spiritualRoot';
import { REGIOES } from '../../game/world';
import { StoryChoice, StoryState, executarEscolha, gastarEnergia } from '../../game/story';
import { criarOverlay, escapeHtml } from './dom';
import { renderCompanheira, tratarCliqueCompanheira } from './companionView';
import { abrirResultado, avisar } from './resultView';
import { NOME_AMEACA, NOME_PAPEL, especieProfunda } from '../../game/bestiaryDeep';
import {
  COMO_AVANCAR,
  CUSTO_RUMOR,
  ENERGIA_RASTREAR,
  ENERGIA_RUMOR,
  NOME_NIVEL,
  NivelConhecimento,
  bloqueioRastrear,
  campoVisivel,
  codinome,
  conhecimentoRegistrado,
  dificuldadeRastrear,
  nivelConhecimento,
  ouvirRumor,
  pistaDoNivel,
  rotuloConfiabilidade,
} from '../../game/beastKnowledge';

const normalizar = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const ORDEM: Linhagem[] = ['Comum', 'Espiritual', 'Demoníaca', 'Divina', 'Ancestral'];
const NOME_ORIGEM: Record<string, string> = { coleta: 'coleta', muda: 'muda natural', extracao: 'extração', caca: 'caça', presente: 'presente' };

function reino(rank: number): string {
  return `${rank} · ${REINOS[rank - 1]?.nome ?? '?'}`;
}

const lista = (itens?: string[]): string => escapeHtml((itens ?? []).join(', '));
const regioesDe = (e: EspecieBesta): string => (e.regioes.length ? e.regioes.map((r) => REGIOES[r].nome).join(', ') : 'Todas as regiões');

/** Os campos da ficha, liberados conforme o nível de conhecimento (seção 3 do Bestiário Profundo). */
function renderFicha(e: EspecieBesta, nivel: NivelConhecimento): string {
  const p = especieProfunda(e);
  const f = p.ficha;
  if (!f) return '';
  const campo = (titulo: string, texto?: string): string => (texto ? `<p><strong>${titulo}:</strong> ${escapeHtml(texto)}</p>` : '');
  const trancado = (campoFicha: Parameters<typeof campoVisivel>[1], pergunta: string): string =>
    `<p class="dica">🔒 ${escapeHtml(pergunta)} <small>(nível ${campoFicha === 'ecologia' ? 2 : campoFicha === 'combate' ? 3 : campoFicha === 'vinculo' ? 4 : 5})</small></p>`;
  const partes: string[] = [];

  if (campoVisivel(nivel, 'ecologia')) {
    const ecologia = [
      p.habitats && `<strong>Habitats:</strong> ${lista(p.habitats)}`,
      p.dieta && `<strong>Dieta:</strong> ${lista(p.dieta)}`,
      p.atividade && `<strong>Atividade:</strong> ${escapeHtml(p.atividade)}`,
      p.estruturaSocial && `<strong>Social:</strong> ${escapeHtml(p.estruturaSocial)}`,
    ].filter(Boolean).join(' · ');
    partes.push(campo('Nicho e habitat', f.nicho), campo('Comportamento', f.comportamento), ecologia ? `<p>${ecologia}</p>` : '');
  } else partes.push(trancado('ecologia', 'Onde vive, o que come e como se comporta?'));

  if (campoVisivel(nivel, 'combate')) {
    const defesa = [p.resistencias && `<strong>Resiste a:</strong> ${lista(p.resistencias)}`, p.fraquezas && `<strong>Fraquezas:</strong> ${lista(p.fraquezas)}`].filter(Boolean).join(' · ');
    const habilidades = (p.habilidades ?? [])
      .map((h) => `<li><strong>${escapeHtml(h.nome)}</strong> (${escapeHtml(h.fases.join(', '))}) — <em>Sinal:</em> ${escapeHtml(h.sinal)} <em>Efeito:</em> ${escapeHtml(h.efeito)} <em>Resposta:</em> ${escapeHtml(h.resposta)}</li>`)
      .join('');
    partes.push(
      campo('Assinatura', f.assinatura),
      campo('Fraqueza e leitura', f.fraqueza),
      defesa ? `<p>${defesa}</p>` : '',
      habilidades ? `<p><strong>Habilidades:</strong></p><ul>${habilidades}</ul>` : '',
      '<p class="dica">Você conhece a fraqueza: em combate, esta besta luta com 10% menos força contra você.</p>',
    );
  } else partes.push(trancado('combate', 'Qual é a técnica dela, o sinal antes do ataque e a fraqueza?'));

  if (campoVisivel(nivel, 'vinculo')) {
    const temperamento = [p.temperamento && `<strong>Temperamento:</strong> ${lista(p.temperamento)}`, p.inteligencia && `<strong>Inteligência:</strong> ${escapeHtml(p.inteligencia)}`].filter(Boolean).join(' · ');
    const materiais = (p.materiaisDetalhados ?? [])
      .map((m) => `<li><strong>${escapeHtml(m.nome)}</strong> — ${escapeHtml(NOME_ORIGEM[m.origem])}, ${m.renovavel ? 'renovável' : 'não renovável'}; usos: ${lista(m.usos)}</li>`)
      .join('');
    partes.push(
      campo('Materiais', f.materiais),
      campo('Vínculo', f.vinculo),
      temperamento ? `<p>${temperamento}</p>` : '',
      materiais ? `<p><strong>Materiais em detalhe:</strong></p><ul>${materiais}</ul>` : '',
    );
  } else partes.push(trancado('vinculo', 'Que materiais oferece e como se cria um vínculo com ela?'));

  if (campoVisivel(nivel, 'lenda')) {
    partes.push(campo('Variante e gancho', f.variante), p.impactoMundial ? campo('No mundo', p.impactoMundial.join(' ')) : '');
  } else partes.push(trancado('lenda', 'Que variantes e lendas cercam esta espécie?'));

  return `<details class="ficha-besta"><summary>Ficha · Ameaça ${escapeHtml(NOME_AMEACA[f.ameaca])} · ${escapeHtml(f.papelEcologico.map((x) => NOME_PAPEL[x]).join(', '))}</summary>${partes.join('')}</details>`;
}

function renderRumores(character: Character, e: EspecieBesta): string {
  const rumores = conhecimentoRegistrado(character, e.id)?.rumores ?? [];
  if (!rumores.length) return '';
  return `<p><strong>O que você ouviu:</strong></p><ul>${rumores
    .map((r) => `<li>${r.estado === 'desmentido' ? `<s>${escapeHtml(r.texto)}</s>` : escapeHtml(r.texto)} <small>[${escapeHtml(rotuloConfiabilidade(r))}]</small></li>`)
    .join('')}</ul>`;
}

function cartao(e: EspecieBesta, character: Character, historia?: StoryState): string {
  const mundo = historia?.mundo;
  const nivel = nivelConhecimento(character, mundo, e);
  const selo = `<small class="nav-badge">${NOME_NIVEL[nivel]} · nível ${nivel}</small>`;
  const bloqueio = historia ? bloqueioRastrear(character, mundo, e, historia.energia) : 'Indisponível';
  const rastrear =
    nivel >= 1 && nivel < 3
      ? `<button class="botao-pequeno" data-rastrear="${e.id}" ${bloqueio ? `disabled title="${escapeHtml(bloqueio)}"` : ''}>${escapeHtml(
          bloqueio && bloqueio !== 'Sem energia' ? bloqueio : `Seguir rastros (${ENERGIA_RASTREAR} de energia · Inteligência, dif. ${dificuldadeRastrear(character, mundo, e)})`,
        )}</button>`
      : '';

  if (nivel === 0) {
    return `<article class="guia-item silhueta-besta">
      <small>Silhueta · ${escapeHtml(regioesDe(e))}</small>
      <h3>??? — ${escapeHtml(codinome(e))} ${selo}</h3>
      <p class="dica">${escapeHtml(COMO_AVANCAR[0])}</p>
      ${renderRumores(character, e)}
    </article>`;
  }

  const companheira = character.companheira && especieDaCompanheira(character.companheira)?.id === e.id;
  const domada = Boolean(character.flags[`bestiario:${e.id}`]);
  const extra = companheira ? '<small class="nav-badge">Sua companheira</small>' : domada ? '<small class="nav-badge">Já domada</small>' : '';
  const registro = conhecimentoRegistrado(character, e.id);
  return `<article class="guia-item">
    <small>Linhagem ${e.linhagem}${e.elemento ? ` · ${NOME_ELEMENTO[e.elemento]}` : ''} · ${escapeHtml(regioesDe(e))}</small>
    <h3>${escapeHtml(e.nome)} ${selo} ${extra}</h3>
    <p>${escapeHtml(e.descricao)}</p>
    <p><strong>Adultos selvagens:</strong> ${escapeHtml(reino(e.reinos[0]))} até ${escapeHtml(reino(e.reinos[1]))}.</p>
    <p><strong>Filhote:</strong> nasce no ${escapeHtml(reino(rankNascimento(e)))} e não rompe reinos · <strong>Jovem</strong> a partir de ${Math.ceil(e.maturidade * 0.3)} ano(s), até ${escapeHtml(REINOS[rankMaximoDaFase(e, 'Jovem') - 1].nome)} · <strong>Adulta</strong> aos ${e.maturidade} anos · <strong>Anciã</strong> aos ${e.maturidade * 5}, podendo passar do teto da espécie.</p>
    ${registro && (registro.encontros || registro.derrotadas) ? `<p><small>Encontros: ${registro.encontros} · vencidas: ${registro.derrotadas}</small></p>` : ''}
    ${renderRumores(character, e)}
    ${renderFicha(e, nivel)}
    <p class="dica">Próximo passo: ${escapeHtml(COMO_AVANCAR[nivel])}</p>
    ${rastrear ? `<div class="botoes-interacao">${rastrear}</div>` : ''}
  </article>`;
}

function escolhaRastrear(character: Character, historia: StoryState, e: EspecieBesta): StoryChoice {
  const nivel = nivelConhecimento(character, historia.mundo, e);
  const proximo = (nivel + 1) as NivelConhecimento;
  const perigosa = ['Demoníaca', 'Divina', 'Ancestral'].includes(e.linhagem);
  return {
    texto: `Seguir os rastros da ${e.nome}`,
    teste: { atributo: 'inteligencia', dificuldade: dificuldadeRastrear(character, historia.mundo, e) },
    resultado: {
      texto: `Pegadas, restos de comida, qi residual no ar: você passa dias atrás da ${e.nome} sem que ela perceba. ${pistaDoNivel(e, proximo)}`,
      efeitos: { conhecimentoBesta: { especieId: e.id, nivel: proximo, pista: pistaDoNivel(e, proximo) } },
    },
    falha: {
      texto: perigosa ? `A ${e.nome} percebeu você primeiro. Você escapa por pouco, ferido.` : 'Os rastros se perdem no terreno. Outro dia, talvez.',
      efeitos: perigosa ? { danoPercentual: 20 } : undefined,
    },
  };
}

/** Bestiário: o que você sabe de cada espécie, do rumor à lenda. */
export function abrirBestiario(character: Character, aoAlterar: () => void = () => {}, historia?: StoryState): void {
  const overlay = criarOverlay();
  let filtro: Linhagem | 'todas' = 'todas';
  let termo = '';

  const render = (): void => {
    const mundo = historia?.mundo;
    const niveis = ESPECIES.map((e) => nivelConhecimento(character, mundo, e));
    const conhecidas = niveis.filter((n) => n >= 1).length;
    const dominadas = niveis.filter((n) => n >= 4).length;
    const lendarias = niveis.filter((n) => n >= 5).length;
    const semEnergia = !historia || historia.energia < ENERGIA_RUMOR;
    const semPedras = character.inventario.pedrasEspirituais < CUSTO_RUMOR;
    const lista = ESPECIES.filter((e) => filtro === 'todas' || (e.linhagem === filtro && nivelConhecimento(character, mundo, e) >= 1))
      .filter((e) => {
        const nivel = nivelConhecimento(character, mundo, e);
        const visivel = nivel === 0 ? `${codinome(e)} ${regioesDe(e)}` : `${e.nome} ${e.linhagem} ${regioesDe(e)} ${e.elemento ? NOME_ELEMENTO[e.elemento] : ''} ${e.descricao} ${NOME_NIVEL[nivel]}`;
        return normalizar(visivel).includes(normalizar(termo));
      })
      .sort((a, b) => ORDEM.indexOf(a.linhagem) - ORDEM.indexOf(b.linhagem) || a.reinos[0] - b.reinos[0]);

    overlay.querySelector('.bestiario-topo')!.innerHTML = `
      <p class="dica">Reconhecidas <strong>${conhecidas}/${ESPECIES.length}</strong> · dominadas <strong>${dominadas}</strong> · lendárias <strong>${lendarias}</strong>.
        Níveis: 0 Desconhecida (só a silhueta) → 1 Reconhecida → 2 Estudada (ecologia) → 3 Compreendida (combate e fraqueza) → 4 Dominada (materiais e vínculo) → 5 Lendária.
        Rumores podem ser verdadeiros, exagerados ou falsos: só se confirmam quando você compreende a espécie.</p>
      <div class="acoes"><button data-rumor ${semEnergia || semPedras ? 'disabled' : ''}>${
        semEnergia ? 'Ouvir rumores de caçadores — sem energia' : semPedras ? `Ouvir rumores — requer ${CUSTO_RUMOR} pedras` : `Ouvir rumores de caçadores (${ENERGIA_RUMOR} de energia, ${CUSTO_RUMOR} pedras de vinho)`
      }</button></div>`;
    overlay.querySelector('.companheira-bestiario')!.innerHTML = renderCompanheira(character);
    overlay.querySelector('.abas')!.innerHTML = (['todas', ...ORDEM] as const)
      .map((id) => {
        const rotulo = id === 'todas' ? 'Todas' : `${id} (${ESPECIES.filter((e) => e.linhagem === id && nivelConhecimento(character, mundo, e) >= 1).length})`;
        return `<button class="aba ${filtro === id ? 'ativa' : ''}" data-filtro="${id}" aria-pressed="${filtro === id}">${rotulo}</button>`;
      })
      .join('');
    overlay.querySelector('.conteudo-jornada')!.innerHTML =
      lista.map((e) => cartao(e, character, historia)).join('') || '<p class="estado-vazio">Nenhuma besta encontrada. Tente outra palavra.</p>';
  };

  overlay.innerHTML = `<section class="painel painel-jornada">
    <button class="fechar" aria-label="Fechar">×</button><p class="eyebrow">Pavilhão do conhecimento</p>
    <h2>Bestiário</h2>
    <p class="descricao">O bestiário mostra o que <em>você</em> sabe. A força de uma besta vem da linhagem e da idade, não de quem a encontra:
    um filhote divino já nasce acima de um aprendiz, mas só luta com ${Math.round(FATOR_FASE.Filhote * 100)}% da força até crescer
    (jovem ${Math.round(FATOR_FASE.Jovem * 100)}%, adulta ${Math.round(FATOR_FASE.Adulta * 100)}%, anciã ${Math.round(FATOR_FASE['Anciã'] * 100)}%).</p>
    <div class="bestiario-topo"></div>
    <div class="companheira-bestiario"></div>
    <label class="busca-label">Pesquisar<input type="search" class="busca-jornada" placeholder="Nome, região ou elemento…" /></label>
    <div class="abas" role="group" aria-label="Linhagem"></div><div class="conteudo-jornada"></div></section>`;

  overlay.querySelector<HTMLInputElement>('.busca-jornada')!.addEventListener('input', (evento) => {
    termo = (evento.target as HTMLInputElement).value;
    render();
  });

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (evento.target === overlay || alvo.closest('.fechar')) {
      overlay.remove();
      return;
    }
    const mensagensCompanheira = tratarCliqueCompanheira(alvo, character);
    if (mensagensCompanheira) {
      aoAlterar();
      render();
      avisar(mensagensCompanheira);
      return;
    }
    const aba = alvo.closest<HTMLElement>('[data-filtro]')?.dataset.filtro;
    if (aba) {
      filtro = aba as Linhagem | 'todas';
      render();
      return;
    }
    if (!historia) return;
    const botaoRumor = alvo.closest<HTMLButtonElement>('[data-rumor]');
    if (botaoRumor && !botaoRumor.disabled) {
      if (character.inventario.pedrasEspirituais < CUSTO_RUMOR || !gastarEnergia(historia, ENERGIA_RUMOR)) return;
      character.inventario.pedrasEspirituais -= CUSTO_RUMOR;
      const resultado = ouvirRumor(character, historia.mundo);
      aoAlterar();
      render();
      avisar(resultado ? resultado.mensagens : ['Os caçadores daqui não contam nada que você já não saiba.']);
      return;
    }
    const rastrear = alvo.closest<HTMLButtonElement>('[data-rastrear]');
    if (rastrear && !rastrear.disabled) {
      const especie = ESPECIES.find((e) => e.id === rastrear.dataset.rastrear);
      if (!especie || bloqueioRastrear(character, historia.mundo, especie, historia.energia) || !gastarEnergia(historia, ENERGIA_RASTREAR)) return;
      const resultado = executarEscolha(character, escolhaRastrear(character, historia, especie));
      aoAlterar();
      render();
      abrirResultado(resultado, [], 'Seguindo rastros');
    }
  });
  render();
}
