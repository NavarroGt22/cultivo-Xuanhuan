import { ATTRIBUTE_INFO, ATTRIBUTE_KEYS, Attributes } from '../../game/attributes';
import { Character, expectativaDeVidaAnos, getCharacterStats, getEffectiveAttributes, idadeAnos } from '../../game/character';
import { alignmentLabel } from '../../game/alignment';
import { realmLabel } from '../../game/cultivation';
import { DerivedStats } from '../../game/stats';
import { getCargo } from '../../game/occupations';
import { REGIOES } from '../../game/world';
import { influenciaFamilia, influenciaPessoal } from '../../game/influence';
import { ehDiscipulo } from '../../game/sect';
import { imagemOpcional } from './assets';
import { escapeHtml, formatarNumero } from './dom';

export function renderAtributosGrid(atributos: Attributes, classe = 'grade-atributos'): string {
  const celulas = ATTRIBUTE_KEYS.map((chave) => {
    const info = ATTRIBUTE_INFO[chave];
    return `
      <div class="atributo atributo-${chave}" title="${info.nome}: ${info.influencia}">
        <span class="sigla">${info.sigla}</span>
        <span class="valor">${atributos[chave]}</span>
      </div>`;
  }).join('');

  return `<div class="${classe}">${celulas}</div>`;
}

export function renderStatsGrid(stats: DerivedStats, mostrarCultivo = true): string {
  const linhas: [string, string, string][] = [
    ['Vida', formatarNumero(stats.vida, 0), 'Constituição × reino'],
    ['Chakra', formatarNumero(stats.chakra, 0), 'Espírito × reino'],
    ['Ataque', formatarNumero(stats.ataque, 0), 'Força × reino'],
    ['Técnica', formatarNumero(stats.tecnica, 0), 'Espírito e Inteligência × reino — ignora metade da defesa'],
    ['Defesa', formatarNumero(stats.defesa, 0), 'Constituição × reino'],
    ['Esquiva', `${formatarNumero(stats.esquiva)}%`, 'Destreza'],
    ['Crítico', `${formatarNumero(stats.critico)}%`, 'Sorte'],
    ['Compreensão', formatarNumero(stats.compreensao, 0), 'Inteligência'],
  ];
  if (mostrarCultivo) {
    linhas.push(['Vel. de Cultivo', `x${formatarNumero(stats.velocidadeCultivo, 2)}`, 'Raiz, Espírito, corpo especial e toxina']);
  }

  const celulas = linhas
    .map(
      ([nome, valor, origem]) => `
      <div class="stat" title="Vem de: ${origem}">
        <span class="stat-nome">${nome}</span>
        <span class="stat-valor">${valor}</span>
      </div>`,
    )
    .join('');

  return `<div class="grade-stats">${celulas}</div>`;
}

function barra(classe: string, percentual: number, texto: string, dica: string): string {
  const largura = Math.max(0, Math.min(100, percentual));
  return `
    <div class="barra ${classe}" title="${dica}">
      <div class="barra-preenchimento" style="width: ${largura}%"></div>
      <span class="barra-texto">${texto}</span>
    </div>`;
}

export function renderHud(character: Character): string {
  const atributos = getEffectiveAttributes(character);
  const stats = getCharacterStats(character);
  const valorAlinhamento = character.alinhamento.valor;
  const posicaoMarcador = (valorAlinhamento + 100) / 2;
  const raizRevelada = Boolean(character.flags.raizRevelada);
  const elementoPrincipal = raizRevelada ? (character.raizEspiritual.elementos[0] ?? 'vazio') : 'desconhecido';
  const inicial = character.nome.trim().charAt(0).toUpperCase() || '?';
  const expectativa = expectativaDeVidaAnos(character);
  const progresso = Math.floor(character.cultivo.progresso);
  const familia = influenciaFamilia(character);
  const pessoal = influenciaPessoal(character);

  return `
    <header class="hud">
      <div class="retrato elemento-${elementoPrincipal}" title="${escapeHtml(character.traco.nome)}">${
        (character.retrato && imagemOpcional(`retratos/${character.retrato}`, 'retrato-img', character.nome)) || escapeHtml(inicial)
      }</div>
      <div class="hud-centro">
        <div class="hud-nome">${escapeHtml(character.nome)} <small>${idadeAnos(character)} anos${Number.isFinite(expectativa) ? ` / ~${formatarNumero(expectativa, 0)}` : ''}</small></div>
        <div class="hud-reino">${realmLabel(character.cultivo)} · ${escapeHtml(character.afiliacao.nome)} (${escapeHtml(character.afiliacao.posto)})</div>
        <div class="hud-reino">${escapeHtml(character.local.cidade)}, ${escapeHtml(REGIOES[character.local.regiao].nome)} · ${
          character.ocupacao
            ? escapeHtml(getCargo(character.ocupacao).nome)
            : ehDiscipulo(character)
              ? `Deveres de discípulo · Contribuição ${character.contribuicao}`
              : 'Sem ocupação'
        }</div>
        <div class="hud-reino" title="${escapeHtml(`${familia.alcance} / ${pessoal.alcance}`)}">
          Influência — Família: <strong>${escapeHtml(familia.nome)}</strong> · Pessoal: <strong>${escapeHtml(pessoal.nome)}</strong>
        </div>
        <div class="hud-barras">
          ${barra('barra-vida', (character.vidaAtual / stats.vida) * 100, `Vida ${character.vidaAtual}/${stats.vida}`, 'Recupera 30% por estação')}
          ${barra('barra-cultivo', progresso, `Cultivo ${progresso}%`, 'Progresso até o próximo estágio')}
        </div>
        <div class="alinhamento" title="Alinhamento: -100 (Não-Ortodoxo) a 100 (Ortodoxo)">
          <div class="alinhamento-barra">
            <div class="alinhamento-marcador" style="left: ${posicaoMarcador}%"></div>
          </div>
          <div class="alinhamento-legenda">
            <span>Demoníaco</span>
            <span class="alinhamento-atual">${alignmentLabel(character.alinhamento)} (${valorAlinhamento})</span>
            <span>Ortodoxo</span>
          </div>
        </div>
      </div>
      <div class="hud-direita">
        <div class="hud-pedras" title="Pedras espirituais"><span class="pedra-icone"></span>${character.inventario.pedrasEspirituais}</div>
        ${renderAtributosGrid(atributos, 'grade-atributos hud-atributos')}
      </div>
    </header>`;
}
