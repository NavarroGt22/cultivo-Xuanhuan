import type { DadosCombate, QuadroCombate } from '../../game/combat';
import { escapeHtml } from './dom';

/** Milissegundos por ação na velocidade 1×. */
const INTERVALO_BASE = 900;
const VELOCIDADES = [1, 2, 4];
const CHAVE_VELOCIDADE = 'velocidadeCombate';

function velocidadeSalva(): number {
  const valor = Number(localStorage.getItem(CHAVE_VELOCIDADE));
  return VELOCIDADES.includes(valor) ? valor : 1;
}

function barra(classe: string, atual: number, maximo: number, rotulo: string, extra = 0): string {
  const largura = Math.max(0, Math.min(100, (atual / Math.max(1, maximo)) * 100));
  const escudo = extra > 0 ? Math.min(100, (extra / Math.max(1, maximo)) * 100) : 0;
  return `
    <div class="barra ${classe}">
      <div class="barra-preenchimento" style="width: ${largura}%"></div>
      ${escudo ? `<div class="barra-escudo" style="width: ${escudo}%"></div>` : ''}
      <span class="barra-texto">${escapeHtml(rotulo)} ${Math.max(0, Math.round(atual))}/${maximo}${extra > 0 ? ` (+${Math.round(extra)} escudo)` : ''}</span>
    </div>`;
}

/** Classe visual da linha do registro, para destacar críticos, técnicas, esquivas etc. */
function tipoDaLinha(texto: string): string {
  if (/^— /.test(texto)) return 'linha-rodada';
  if (/FUSÃO/.test(texto)) return 'linha-fusao';
  if (/ATAQUE COMBINADO/.test(texto)) return 'linha-combinado';
  if (/CRÍTICO/.test(texto)) return 'linha-critico';
  if (/esquiva/.test(texto)) return 'linha-esquiva';
  if (/Talismã|escudo|Escudo|recupera|renasce/.test(texto)) return 'linha-suporte';
  if (/^Vitória/.test(texto)) return 'linha-vitoria';
  if (/^Derrota/.test(texto)) return 'linha-derrota';
  if (/^Você /.test(texto)) return 'linha-jogador';
  return 'linha-inimigo';
}

/**
 * Reproduz a luta ação por ação dentro de `container`. Chama `aoTerminar` no fim (ou ao pular).
 * O progresso fica em `dados.passo`, então redesenhar a tela retoma de onde parou.
 */
export function reproduzirCombate(container: HTMLElement, dados: DadosCombate, aoTerminar: () => void): void {
  let velocidade = velocidadeSalva();
  let temporizador: number | undefined;
  let terminado = false;
  const passoInicial = dados.passo ?? 0;

  const inicial: QuadroCombate = {
    texto: '',
    vidaJogador: dados.vidaInicialJogador,
    escudoJogador: 0,
    vidaInimigo: dados.vidaMaxInimigo,
    vidaAliado: dados.vidaMaxAliado ?? null,
    sincronia: 0,
  };

  container.innerHTML = `
    <div class="arena">
      <div class="arena-lado">
        <strong>Você</strong>
        <div data-barra="jogador"></div>
        ${dados.nomeAliado ? `<strong class="arena-aliado">${escapeHtml(dados.nomeAliado)}</strong><div data-barra="aliado"></div>` : ''}
        ${dados.tetoSincronia ? '<div data-barra="sincronia"></div>' : ''}
      </div>
      <div class="arena-vs">VS</div>
      <div class="arena-lado">
        <strong data-nome-inimigo>${escapeHtml(dados.nomeInimigo)}</strong>
        <div data-barra="inimigo"></div>
      </div>
    </div>
    <div class="log-ao-vivo" data-log></div>
    <div class="arena-controles">
      <button data-acao="velocidade">Velocidade: ${velocidade}×</button>
      <button data-acao="pular" class="primario">Pular luta ⏭</button>
    </div>`;

  const log = container.querySelector<HTMLElement>('[data-log]') as HTMLElement;
  const barraJogador = container.querySelector<HTMLElement>('[data-barra="jogador"]') as HTMLElement;
  const barraInimigo = container.querySelector<HTMLElement>('[data-barra="inimigo"]') as HTMLElement;
  const barraAliado = container.querySelector<HTMLElement>('[data-barra="aliado"]');
  const barraSincronia = container.querySelector<HTMLElement>('[data-barra="sincronia"]');

  let anterior = inicial;
  let vidaMaxInimigo = dados.vidaMaxInimigo;
  const nomeInimigo = container.querySelector<HTMLElement>('[data-nome-inimigo]');

  const desenhar = (quadro: QuadroCombate): void => {
    if (quadro.inimigo) {
      vidaMaxInimigo = quadro.inimigo.vidaMax;
      if (nomeInimigo) nomeInimigo.textContent = quadro.inimigo.nome;
    }
    barraJogador.innerHTML = barra('barra-vida', quadro.vidaJogador, dados.vidaMaxJogador, 'Vida', quadro.escudoJogador);
    barraInimigo.innerHTML = barra('barra-vida barra-inimigo', quadro.vidaInimigo, vidaMaxInimigo, 'Vida');
    if (barraAliado && dados.vidaMaxAliado) barraAliado.innerHTML = barra('barra-aliado', quadro.vidaAliado ?? 0, dados.vidaMaxAliado, 'Vida');
    if (barraSincronia && dados.tetoSincronia) barraSincronia.innerHTML = barra('barra-sincronia', quadro.sincronia, 100, 'Sincronia');

    if (quadro.vidaJogador < anterior.vidaJogador) barraJogador.classList.add('tremer');
    if (quadro.vidaInimigo < anterior.vidaInimigo) barraInimigo.classList.add('tremer');
    window.setTimeout(() => {
      barraJogador.classList.remove('tremer');
      barraInimigo.classList.remove('tremer');
    }, 250);
    anterior = quadro;
  };

  const escreverLinha = (quadro: QuadroCombate): void => {
    const linha = document.createElement('p');
    linha.className = tipoDaLinha(quadro.texto);
    linha.textContent = quadro.texto;
    log.appendChild(linha);
    log.scrollTop = log.scrollHeight;
  };

  const terminar = (): void => {
    if (terminado) return;
    terminado = true;
    window.clearTimeout(temporizador);
    dados.passo = dados.quadros.length;
    dados.assistido = true;
    aoTerminar();
  };

  // Retoma: redesenha tudo que já tinha sido mostrado.
  for (let n = 0; n < passoInicial && n < dados.quadros.length; n++) {
    escreverLinha(dados.quadros[n]);
    if (dados.quadros[n].inimigo) desenhar(dados.quadros[n]);
  }
  desenhar(passoInicial > 0 ? dados.quadros[Math.min(passoInicial, dados.quadros.length) - 1] : inicial);

  const avancar = (): void => {
    if (!container.isConnected) {
      window.clearTimeout(temporizador);
      return;
    }
    const passo = dados.passo ?? 0;
    if (passo >= dados.quadros.length) {
      temporizador = window.setTimeout(terminar, 900 / velocidade);
      return;
    }
    const quadro = dados.quadros[passo];
    escreverLinha(quadro);
    desenhar(quadro);
    dados.passo = passo + 1;
    const destaque = /FUSÃO|COMBINADO|CRÍTICO|Vitória|Derrota/.test(quadro.texto) ? 1.6 : 1;
    temporizador = window.setTimeout(avancar, (INTERVALO_BASE * destaque) / velocidade);
  };

  container.addEventListener('click', (evento) => {
    const alvo = (evento.target as HTMLElement).closest<HTMLElement>('[data-acao]');
    if (!alvo) return;
    if (alvo.dataset.acao === 'pular') {
      terminar();
    } else if (alvo.dataset.acao === 'velocidade') {
      velocidade = VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length];
      localStorage.setItem(CHAVE_VELOCIDADE, String(velocidade));
      alvo.textContent = `Velocidade: ${velocidade}×`;
    }
  });

  temporizador = window.setTimeout(avancar, 500 / velocidade);
}

/** A luta ainda não foi assistida até o fim. */
export function precisaReproduzir(dados: DadosCombate | undefined): dados is DadosCombate {
  return Boolean(dados && !dados.assistido && dados.quadros.length > 0);
}
