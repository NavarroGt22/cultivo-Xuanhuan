import { Character } from '../../game/character';
import { ENERGIA_POR_ESTACAO, StoryState, gastarEnergia } from '../../game/story';
import { rosterDaSeita } from '../../game/worldState';
import { SOBRENOMES, NOMES } from '../../game/world';
import { escolher } from '../../game/rng';
import { criarOverlay, escapeHtml } from './dom';
import { avisar, confirmar, renderEnergia } from './resultView';
import {
  ENERGIA_BUSCAR_DISCIPULO,
  ENERGIA_INTERACAO,
  INTERACOES,
  Relacao,
  aceitarDiscipulo,
  bloqueioBuscarDiscipulo,
  descreverRelacao,
  discipulosDe,
  ehRelacaoDePoder,
  gerarCandidatoDiscipulo,
  limiteDiscipulos,
  limiteDoHarem,
  parceirosRomanticos,
} from '../../game/relationships';
import { grauRaizInfo } from '../../game/spiritualRoot';
import { LIMIAR_DIGNO, LIMIAR_INDIGNO, TEXTO_STATUS, descreverNoivado, forcaRelativa, tratamento } from '../../game/betrothal';
import { REINOS } from '../../game/cultivation';
import { bloqueioLicao, bloqueioMestre, deixarMestre, receberLicao, tipoDeSaida, tornarDiscipulo } from '../../game/mentor';
import { LEALDADE_TRAICAO, companheirosDeJornada, ehCompanheiroJornada, limiteCompanheiros } from '../../game/journeyCompanions';
import { LEALDADE_IRMAO, PAPEIS } from '../../game/companionRoles';

/** Pais são gerados uma vez e guardados nas flags. */
function garantirFamilia(character: Character): void {
  if (character.origem.tipo === 'orfao' || character.flags.pai) return;
  const sobrenome = character.origem.nomeCasa.split(' ').pop() ?? escolher(SOBRENOMES);
  character.flags.pai = `${sobrenome} ${escolher(NOMES)}`;
  character.flags.mae = `${escolher(SOBRENOMES)} ${escolher(NOMES)}`;
}

function linha(tipo: string, nome: string, detalhe = ''): string {
  return `<li><strong>${escapeHtml(tipo)}:</strong> ${escapeHtml(nome)}${detalhe ? ` <small>— ${escapeHtml(detalhe)}</small>` : ''}</li>`;
}

function renderPessoais(character: Character): string {
  const f = character.flags;
  const itens: string[] = [];
  if (character.origem.tipo === 'orfao') {
    itens.push(linha('Tutor', `Monges do templo de ${character.origem.cidade}`));
  } else {
    itens.push(linha('Pai', String(f.pai), character.origem.nomeCasa));
    itens.push(linha('Mãe', String(f.mae)));
  }
  if (character.mestrePessoal) {
    itens.push(linha('Mestre (Shifu)', character.mestrePessoal.nome, character.mestrePessoal.origem === 'errante' ? 'o velho de roupas gastas' : character.mestrePessoal.seita));
  } else if (typeof f.mestreFormado === 'string') {
    itens.push(linha('Antigo mestre', f.mestreFormado, 'você se formou como discípulo dele'));
  }
  if (f.rival) itens.push(linha('Rival de Cultivo', String(f.rival), `${Number(f.vitoriasRival ?? 0)} vitória(s) sobre ele`));
  if (typeof f.casamentoAlianca === 'string' && !['recusado', 'fugiu'].includes(f.casamentoAlianca)) {
    itens.push(linha('Cônjuge (aliança de clã)', f.casamentoAlianca));
  }
  return `<ul class="ficha">${itens.join('')}</ul>`;
}

function cartaoPessoa(character: Character, historia: StoryState, r: Relacao): string {
  const semEnergia = historia.energia < ENERGIA_INTERACAO;
  const botoes = INTERACOES.map((interacao) => {
    const bloqueio = interacao.bloqueio(character, r) ?? (semEnergia ? 'Sem energia' : null);
    if (bloqueio === 'Não se aplica') return '';
    const rotulo = interacao.id === 'terminar' && r.tipo === 'Discípulo' ? 'Expulsar' : interacao.rotulo;
    return `<button class="botao-pequeno" data-interagir="${interacao.id}" data-pessoa="${r.id}" ${bloqueio ? `disabled title="${escapeHtml(bloqueio)}"` : ''}>${escapeHtml(rotulo)}</button>`;
  }).join('');
  return `
    <div class="objetivo">
      <div><strong>${escapeHtml(r.nome)}</strong><small>${escapeHtml(r.tipo)} · Relação ${Math.round(r.relacao)}${
        character.faccao?.familia?.includes(r.id) ? ` · membro ${character.faccao.tipo === 'cla' ? 'do' : 'da'} ${escapeHtml(character.faccao.nome)}` : ''
      }</small></div>
      <p><small>${escapeHtml(descreverRelacao(r))}</small></p>
      <div class="botoes-interacao">${botoes}</div>
    </div>`;
}

function renderCompanheiros(character: Character, historia: StoryState): string {
  const grupo = companheirosDeJornada(character);
  const papeis = Object.values(PAPEIS).map((p) => `<strong>${escapeHtml(p.nome)}</strong> ${escapeHtml(p.descricao.split(': ')[1] ?? p.descricao)}`).join(' · ');
  return `
    <h3>Companheiros de jornada (${grupo.length}/${limiteCompanheiros(character)})</h3>
    <p class="dica">Convide um amigo (relação 50+) ou aceite quem pedir para viajar com você. Cada um tem um papel — ${papeis} —
      e uma <strong>lealdade</strong> própria: ela cai aos poucos, sobe quando você divide os espólios ou atende aos pedidos dele, e reage aos seus atos
      (ortodoxos odeiam crueldade; demoníacos, bondade). Companheiros de caminhos opostos brigam. Com lealdade ${LEALDADE_IRMAO}+ viram Irmãos de Armas (bônus em dobro);
      abaixo de ${LEALDADE_TRAICAO}, podem trair e fugir com parte das suas pedras.</p>
    ${grupo.length ? `<div class="lista-objetivos">${grupo.map((r) => cartaoPessoa(character, historia, r)).join('')}</div>` : '<p class="vazio-texto">Você viaja sozinho.</p>'}`;
}

function renderPessoas(character: Character, historia: StoryState): string {
  const pessoas = character.relacoes.filter((r) => !ehRelacaoDePoder(r) && r.tipo !== 'Discípulo' && !ehCompanheiroJornada(r));
  if (pessoas.length === 0) {
    return '<h3>Pessoas</h3><p class="vazio-texto">Ninguém ainda. Use "Conhecer pessoas novas" em Atividades → Social.</p>';
  }
  const harem = parceirosRomanticos(character);
  const infoHarem = `<p class="dica">Harém: <strong>${harem.length}/${limiteDoHarem(character)}</strong> parceiro(s). O limite cresce com sua influência pessoal.
    Com mais de um, há ciúmes — um banquete ajuda a manter a harmonia. Cada Companheiro(a) de Dao dá +10% de cultivo (até +30%).</p>`;
  return `<h3>Pessoas (${ENERGIA_INTERACAO} de energia por interação)</h3>${infoHarem}<div class="lista-objetivos">${pessoas.map((r) => cartaoPessoa(character, historia, r)).join('')}</div>`;
}

function renderDiscipulos(character: Character, historia: StoryState): string {
  const discipulos = discipulosDe(character);
  const bloqueio = bloqueioBuscarDiscipulo(character) ?? (historia.energia < ENERGIA_BUSCAR_DISCIPULO ? 'Sem energia' : null);
  const limite = limiteDiscipulos(character);
  return `
    <h3>Seus discípulos (${discipulos.length}/${limite})</h3>
    <p class="dica">A partir do 3º reino você pode aceitar discípulos (1 a mais a cada reino, até 5). Ensine-os para que avancem; eles também cultivam sozinhos, nunca passam do seu reino, e cada reino que rompem aumenta sua fama como mestre.</p>
    <div class="acoes"><button data-buscar-discipulo ${bloqueio ? `disabled title="${escapeHtml(bloqueio)}"` : ''}>Procurar um discípulo (${ENERGIA_BUSCAR_DISCIPULO} de energia)</button></div>
    ${bloqueio && bloqueio !== 'Sem energia' ? `<p class="dica">${escapeHtml(bloqueio)}</p>` : ''}
    ${discipulos.length ? `<div class="lista-objetivos">${discipulos.map((r) => cartaoPessoa(character, historia, r)).join('')}</div>` : ''}`;
}

function renderNoivado(c: Character): string {
  const n = c.noivado;
  if (!n || n.status === 'casados') return '';
  const t = tratamento(n);
  const razao = forcaRelativa(c);
  const aviso =
    n.status === 'prometidos'
      ? razao < LIMIAR_INDIGNO
        ? `A família ${t.dela} acha você fraco demais. Se não crescer, ${t.ela} pode romper o noivado em público a partir dos 16 anos${n.demoniaca || n.orgulho >= 75 ? ' — ou mandar alguém resolver o problema de outro jeito' : ''}.`
        : razao < LIMIAR_DIGNO
          ? `Você está quase à altura. Ganhe um pouco mais de força para que o casamento aconteça aos 18.`
          : `Você está à altura. Aos 18 anos, o casamento deve acontecer.`
      : n.status === 'desafio'
        ? `Duelo marcado para quando você tiver ${Math.floor((n.duelo ?? 0) / 12)} anos (faltam ${Math.max(0, Math.ceil(((n.duelo ?? 0) - c.idadeMeses) / 12))} ano(s)). A força ${t.dela} é real: treine.`
        : n.status === 'rompido-por-ela'
          ? `Se um dia você ficar muito mais forte, talvez ${t.ela} volte arrependid${t.artigo}.`
          : '';
  return `<section class="guia-item"><p class="eyebrow">${escapeHtml(TEXTO_STATUS[n.status])}</p><h3>${t.titulo === 'noiva' ? 'Noiva' : 'Noivo'} arranjad${t.artigo}: ${escapeHtml(n.nome)}</h3>
    <p>${escapeHtml(descreverNoivado(c))}</p>${aviso ? `<p class="dica">${escapeHtml(aviso)}</p>` : ''}</section>`;
}

function renderMestre(c: Character, h: StoryState): string {
  const mestre = c.mestrePessoal;
  if (mestre) {
    const bloqueio = bloqueioLicao(c, h);
    const saida = tipoDeSaida(c, h);
    const rotuloSaida = saida === 'formar' ? 'Formar-se com honra' : saida === 'romper' ? 'Romper com o mestre (desonra)' : 'Encerrar vínculo';
    const reino = mestre.origem === 'errante' && mestre.rank ? ` · ${escapeHtml(REINOS[mestre.rank - 1]?.nome ?? '')}` : '';
    return `<section class="guia-item mestre-card"><p class="eyebrow">Discípulo pessoal${mestre.origem === 'errante' ? ' · mestre errante' : ''}</p><h3>${escapeHtml(mestre.nome)}</h3>
      <p>${escapeHtml(mestre.seita)}${reino} · Vínculo ${mestre.vinculo}/100</p><p>Uma orientação por capítulo: cultivo, redução de toxina e fortalecimento do vínculo. Enquanto for discípulo dele, nenhum outro mestre aceita você.</p>
      ${bloqueio ? `<p class="aviso">${escapeHtml(bloqueio)}</p>` : ''}
      ${saida === 'romper' ? '<p class="dica">Romper antes de alcançar o reino dele é desonra: reputação −15, alinhamento −10 e anos sem que outro mestre o aceite.</p>' : ''}
      <div class="acoes"><button data-mestre-licao ${bloqueio ? 'disabled' : ''}>Receber orientação · 1 energia</button><button data-mestre-sair data-saida="${saida}" ${h.desfecho?.final ? 'disabled' : ''}>${rotuloSaida}</button></div></section>`;
  }
  const bloqueio = bloqueioMestre(c, h);
  const ancioes = rosterDaSeita(h.mundo, c)?.membros.filter(m => m.posto === 'Ancião' && m.rank > c.cultivo.rank) ?? [];
  return `<section class="guia-item mestre-card"><h3>Mestre pessoal (Shifu)</h3><p>${escapeHtml(bloqueio ?? 'Escolha um ancião. A aceitação custa 50 de contribuição.')}</p>
    <div class="acoes">${ancioes.map(m => `<button data-mestre="${m.id}" ${bloqueio ? 'disabled' : ''}>Estudar com ${escapeHtml(m.nome)}</button>`).join('')}</div></section>`;
}

/** Relações pessoais: família, parceiros, noivado, mestre, discípulos e pessoas próximas. */
export function abrirRelacoes(character: Character, historia: StoryState, aoAlterar: () => void): void {
  const overlay = criarOverlay();
  garantirFamilia(character);

  const render = (): void => {
    overlay.innerHTML = `
      <div class="painel painel-atividades">
        <button class="fechar" data-acao="fechar" title="Fechar">×</button>
        <h2>Relações</h2>
        ${renderEnergia(historia.energia, ENERGIA_POR_ESTACAO)}
        <p class="dica">Aqui ficam seus laços pessoais. A besta companheira está no Bestiário; rixas de sangue, vassalos e guerras, no Mundo; a hierarquia da seita, em Seita e Ocupação.</p>
        <h3>Família e vínculos</h3>
        ${renderPessoais(character)}
        ${renderNoivado(character)}
        ${renderMestre(character, historia)}
        ${renderDiscipulos(character, historia)}
        ${renderCompanheiros(character, historia)}
        ${renderPessoas(character, historia)}
      </div>`;
  };

  /** Atualiza o painel (sem mexer na rolagem) e mostra o que aconteceu num aviso. */
  const depoisDaAcao = (mensagens: string[]): void => {
    aoAlterar();
    render();
    avisar(mensagens);
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = evento.target as HTMLElement;
    if (alvo === overlay || alvo.closest('[data-acao="fechar"]')) {
      overlay.remove();
      aoAlterar();
      return;
    }

    const buscar = alvo.closest<HTMLButtonElement>('[data-buscar-discipulo]');
    if (buscar && !buscar.disabled) {
      if (bloqueioBuscarDiscipulo(character) || !gastarEnergia(historia, ENERGIA_BUSCAR_DISCIPULO)) return;
      const candidato = gerarCandidatoDiscipulo(character);
      aoAlterar();
      render();
      const raiz = `raiz de grau ${candidato.raizGrau} (${grauRaizInfo(candidato.raizGrau ?? 1).nome})`;
      void confirmar(`${candidato.nome}, ${candidato.idade} anos, ${raiz}, se ajoelha diante de você e pede para ser seu discípulo. Aceitar?`, 'Aceitar', 'Recusar').then((sim) => {
        depoisDaAcao([sim ? aceitarDiscipulo(character, candidato) : `Você manda ${candidato.nome} embora.`]);
      });
      return;
    }

    const mestre = alvo.closest<HTMLButtonElement>('[data-mestre], [data-mestre-licao], [data-mestre-sair]');
    if (mestre && !mestre.disabled) {
      if (mestre.dataset.mestre) {
        depoisDaAcao([tornarDiscipulo(character, historia, mestre.dataset.mestre)]);
      } else if (mestre.hasAttribute('data-mestre-licao')) {
        depoisDaAcao([receberLicao(character, historia)]);
      } else {
        const saida = mestre.dataset.saida;
        const pergunta =
          saida === 'romper'
            ? 'Romper com seu mestre antes de se formar? Isso é desonra: reputação −15, alinhamento −10 e anos sem que outro mestre aceite você.'
            : saida === 'formar'
              ? 'Despedir-se do seu mestre como discípulo formado?'
              : 'Encerrar o vínculo com seu mestre pessoal?';
        void confirmar(pergunta, saida === 'romper' ? 'Romper' : saida === 'formar' ? 'Despedir-me' : 'Encerrar').then((sim) => {
          if (sim) depoisDaAcao([deixarMestre(character, historia)]);
        });
      }
      return;
    }

    const interagir = alvo.closest<HTMLButtonElement>('[data-interagir]');
    if (interagir && !interagir.disabled) {
      const pessoa = character.relacoes.find((r) => r.id === interagir.dataset.pessoa);
      const interacao = INTERACOES.find((i) => i.id === interagir.dataset.interagir);
      if (!pessoa || !interacao || interacao.bloqueio(character, pessoa) || !gastarEnergia(historia, ENERGIA_INTERACAO)) return;
      depoisDaAcao(interacao.executar(character, pessoa));
    }
  });

  render();
}
