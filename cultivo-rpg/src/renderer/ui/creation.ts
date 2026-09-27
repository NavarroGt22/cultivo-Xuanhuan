import {
  ATTRIBUTE_INFO,
  ATTRIBUTE_KEYS,
  Attributes,
  MAX_ATRIBUTO_DISTRIBUIDO,
  MIN_ATRIBUTO_DISTRIBUIDO,
  PONTOS_DE_CRIACAO,
  createBaseAttributes,
  formatarBonus,
  pontosGastos,
} from '../../game/attributes';
import { TRAITS, getTrait } from '../../game/traits';
import { rollSpiritualRoot } from '../../game/spiritualRoot';
import { Character, Genero, calcularAtributosBase, createCharacter } from '../../game/character';
import { getDerivedStats } from '../../game/stats';
import { createCultivation } from '../../game/cultivation';
import { CORPOS_ESPECIAIS, ORIGEM_INFO, rollOrigin } from '../../game/origin';
import { rolarTierHeranca } from '../../game/inheritance';
import { gerarNomePessoa } from '../../game/world';
import { escolher } from '../../game/rng';
import { criarOverlay, escapeHtml, redesenharMantendoPosicao } from './dom';
import { imagemOpcional, retratosDoProtagonista } from './assets';
import { renderAtributosGrid, renderStatsGrid } from './hud';

interface CreationState {
  nome: string;
  genero: Genero;
  retrato: string;
  tracoId: string;
  distribuicao: Attributes;
}

function distribuicaoAleatoria(): Attributes {
  const distribuicao = createBaseAttributes();
  let restantes = PONTOS_DE_CRIACAO;
  while (restantes > 0) {
    const chave = escolher(ATTRIBUTE_KEYS);
    if (distribuicao[chave] < MAX_ATRIBUTO_DISTRIBUIDO) {
      distribuicao[chave] += 1;
      restantes -= 1;
    }
  }
  return distribuicao;
}

/** Chances de nascimento para cada valor de Sorte, estimadas por sorteio (guardadas para não refazer). */
const chancesPorSorte = new Map<number, { raizBoa: number; raizRara: number; claOuSeita: number }>();

function chancesDoDestino(sorte: number): { raizBoa: number; raizRara: number; claOuSeita: number } {
  const guardada = chancesPorSorte.get(sorte);
  if (guardada) return guardada;
  const amostras = 4000;
  let raizBoa = 0;
  let raizRara = 0;
  let claOuSeita = 0;
  for (let i = 0; i < amostras; i++) {
    const grau = rollSpiritualRoot(sorte).grau;
    if (grau >= 4) raizBoa++;
    if (grau >= 6) raizRara++;
    if (ORIGEM_INFO[rollOrigin(sorte).tipo].prestigio >= 1) claOuSeita++;
  }
  const chances = { raizBoa: (raizBoa / amostras) * 100, raizRara: (raizRara / amostras) * 100, claOuSeita: (claOuSeita / amostras) * 100 };
  chancesPorSorte.set(sorte, chances);
  return chances;
}

function porcentagem(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function pontosRestantes(distribuicao: Attributes): number {
  return PONTOS_DE_CRIACAO - pontosGastos(distribuicao);
}

function abrirDistribuicao(estado: CreationState, aoConfirmar: () => void): void {
  const overlay = criarOverlay();
  const rascunho: Attributes = { ...estado.distribuicao };
  const traco = getTrait(estado.tracoId);

  const render = (): void => redesenharMantendoPosicao(overlay, desenhar, '.painel');

  const desenhar = (): void => {
    const restantes = pontosRestantes(rascunho);
    const finais = calcularAtributosBase(rascunho, traco);

    const linhas = ATTRIBUTE_KEYS.map((chave) => {
      const info = ATTRIBUTE_INFO[chave];
      const valor = rascunho[chave];
      const bonus = finais[chave] - valor;
      const bonusTexto = bonus !== 0 ? `<span class="bonus">${bonus > 0 ? '+' : ''}${bonus} → ${finais[chave]}</span>` : '';
      return `
        <div class="linha-atributo">
          <div class="atributo-rotulo atributo-${chave}">
            <span class="sigla">${info.sigla}</span>
            <span class="nome">${info.nome}</span>
          </div>
          <button class="menos" data-menos="${chave}" ${valor <= MIN_ATRIBUTO_DISTRIBUIDO ? 'disabled' : ''}>−</button>
          <span class="valor">${valor}</span>
          <button class="mais" data-mais="${chave}" ${valor >= MAX_ATRIBUTO_DISTRIBUIDO || restantes <= 0 ? 'disabled' : ''}>+</button>
          ${bonusTexto}
          <p class="influencia">${info.influencia}</p>
        </div>`;
    }).join('');

    overlay.innerHTML = `
      <div class="painel painel-distribuicao">
        <h2>Distribuição de Atributos</h2>
        <p class="regras">
          Cada atributo vai de ${MIN_ATRIBUTO_DISTRIBUIDO} a ${MAX_ATRIBUTO_DISTRIBUIDO}.
          Baixar um atributo abaixo de 5 devolve pontos.<br />
          <strong>Não podem sobrar pontos!</strong>
        </p>
        ${linhas}
        <p class="pontos-restantes ${restantes === 0 ? 'ok' : ''}">Pontos restantes: <strong>${restantes}</strong></p>
        <p class="dica">Bônus do traço (${escapeHtml(traco.nome)}) é somado depois e pode passar do limite.</p>
        <div class="acoes">
          <button data-acao="restaurar">Restaurar</button>
          <button data-acao="aleatorio">Aleatório</button>
          <button data-acao="cancelar">Cancelar</button>
          <button data-acao="confirmar" class="primario" ${restantes !== 0 ? 'disabled' : ''}>Confirmar</button>
        </div>
      </div>`;
  };

  overlay.addEventListener('click', (evento) => {
    const alvo = (evento.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!alvo || alvo.disabled) return;

    const mais = alvo.dataset.mais as keyof Attributes | undefined;
    const menos = alvo.dataset.menos as keyof Attributes | undefined;

    if (mais) {
      rascunho[mais] += 1;
    } else if (menos) {
      rascunho[menos] -= 1;
    } else {
      switch (alvo.dataset.acao) {
        case 'restaurar':
          Object.assign(rascunho, createBaseAttributes());
          break;
        case 'aleatorio':
          Object.assign(rascunho, distribuicaoAleatoria());
          break;
        case 'cancelar':
          overlay.remove();
          return;
        case 'confirmar':
          estado.distribuicao = { ...rascunho };
          overlay.remove();
          aoConfirmar();
          return;
      }
    }

    render();
  });

  render();
}

export function renderCriacao(app: HTMLElement, aoComecar: (character: Character) => void, aoVoltar: () => void): void {
  const estado: CreationState = {
    nome: gerarNomePessoa(),
    genero: 'masculino',
    retrato: retratosDoProtagonista()[0] ?? '',
    tracoId: TRAITS[0].id,
    distribuicao: createBaseAttributes(),
  };

  const podeComecar = (): boolean => estado.nome.trim().length > 0 && pontosRestantes(estado.distribuicao) === 0;

  const render = (): void => redesenharMantendoPosicao(app, desenhar);

  const desenhar = (): void => {
    const traco = getTrait(estado.tracoId);
    const retratos = retratosDoProtagonista();
    const atributosFinais = calcularAtributosBase(estado.distribuicao, traco);
    const stats = getDerivedStats(atributosFinais, null, createCultivation());
    const restantes = pontosRestantes(estado.distribuicao);
    const destino = chancesDoDestino(atributosFinais.sorte);

    const efeitosTraco = [
      formatarBonus(traco.bonusAtributos),
      traco.alinhamentoInicial ? `Alinhamento inicial ${traco.alinhamentoInicial > 0 ? '+' : ''}${traco.alinhamentoInicial}` : '',
      traco.pedrasEspirituaisBonus
        ? `${traco.pedrasEspirituaisBonus > 0 ? '+' : ''}${traco.pedrasEspirituaisBonus} pedras espirituais`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');

    app.innerHTML = `
      <div class="criacao">
        <div class="painel painel-criacao">
          <h1>Criação de Cultivador</h1>
          <button id="btn-aleatorizar" class="largo" title="Sorteia nome, gênero, retrato, traço e atributos">🎲 Aleatorizar tudo</button>

          <label for="campo-nome">Nome</label>
          <div class="linha">
            <input id="campo-nome" maxlength="24" value="${escapeHtml(estado.nome)}" />
            <button id="btn-nome-aleatorio" class="icone" title="Nome aleatório">⟳</button>
          </div>

          <label for="campo-genero">Gênero</label>
          <select id="campo-genero">
            <option value="masculino" ${estado.genero === 'masculino' ? 'selected' : ''}>Masculino</option>
            <option value="feminino" ${estado.genero === 'feminino' ? 'selected' : ''}>Feminino</option>
          </select>

          ${
            retratos.length
              ? `<label for="campo-retrato">Retrato</label>
                 <div class="linha">
                   <select id="campo-retrato">
                     ${retratos.map((r) => `<option value="${escapeHtml(r)}" ${r === estado.retrato ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
                   </select>
                   ${imagemOpcional(`retratos/${estado.retrato}`, 'retrato-previa')}
                 </div>`
              : '<p class="dica">Retrato: coloque imagens <code>protagonista*.png</code> em <code>assets/retratos/</code> para escolher aqui.</p>'
          }

          <label for="campo-traco">Traço</label>
          <div class="linha">
            <select id="campo-traco">
              ${TRAITS.map((t) => `<option value="${t.id}" ${t.id === traco.id ? 'selected' : ''}>${escapeHtml(t.nome)}</option>`).join('')}
            </select>
            <button id="btn-traco-aleatorio" class="icone" title="Traço aleatório">⟳</button>
          </div>
          <p class="descricao">${escapeHtml(traco.descricao)} ${efeitosTraco ? `<em>${efeitosTraco}</em>` : ''}</p>

          <label>Distribuição de Atributos</label>
          <button id="btn-distribuir" class="largo">
            Distribuir atributos ${restantes > 0 ? `(${restantes} pontos restantes)` : '✓'}
          </button>

          <div class="resumo">
            <h3>Atributos finais</h3>
            ${renderAtributosGrid(atributosFinais)}
            <h3>Atributos de combate</h3>
            ${renderStatsGrid(stats, false)}
          </div>

          <div class="destino">
            <h3>O Destino decide o resto</h3>
            <p>
              Onde você nasce — região, família, clã ou seita, ramo principal ou colateral —, sua
              <strong>raiz espiritual</strong> e um possível <strong>corpo especial</strong> serão sorteados no nascimento.
              Sorte alta (agora <strong>${atributosFinais.sorte}</strong>) melhora as chances.
            </p>
            <p class="dica">
              Com Sorte ${atributosFinais.sorte}: raiz de grau 4 ou mais ~${porcentagem(destino.raizBoa)} · grau 6 ou mais ~${porcentagem(destino.raizRara)} ·
              nascer em clã ou seita ~${porcentagem(destino.claOuSeita)}. Quem nasce em família comum ou órfão não tem quem ensine a cultivar:
              vai precisar de uma seita, um mestre ou um manual de Método de Cultivo.
            </p>
            <p>
              Estilos marciais, técnicas, Alquimia e Inscrição são aprendidos ao longo da vida — o primeiro estilo vem da sua
              infância. Cada estilo tem maestria própria, de Iniciante a Grão-Mestre.
            </p>
          </div>

          <div class="acoes">
            <button id="btn-voltar">Voltar</button>
            <button id="btn-comecar" class="primario" ${podeComecar() ? '' : 'disabled'}>Começar!</button>
          </div>
          <p class="aviso" ${podeComecar() ? 'hidden' : ''}>Dê um nome e distribua todos os pontos de atributo para começar.</p>
        </div>
      </div>`;

    const campoNome = document.getElementById('campo-nome') as HTMLInputElement;
    const botaoComecar = document.getElementById('btn-comecar') as HTMLButtonElement;

    campoNome.addEventListener('input', () => {
      estado.nome = campoNome.value;
      botaoComecar.disabled = !podeComecar();
    });

    document.getElementById('btn-nome-aleatorio')?.addEventListener('click', () => {
      estado.nome = gerarNomePessoa();
      render();
    });

    document.getElementById('btn-traco-aleatorio')?.addEventListener('click', () => {
      estado.tracoId = escolher(TRAITS.filter((t) => t.id !== estado.tracoId)).id;
      render();
    });

    document.getElementById('btn-aleatorizar')?.addEventListener('click', () => {
      estado.nome = gerarNomePessoa();
      estado.genero = escolher<Genero>(['masculino', 'feminino']);
      if (retratos.length) estado.retrato = escolher(retratos);
      estado.tracoId = escolher(TRAITS).id;
      estado.distribuicao = distribuicaoAleatoria();
      render();
    });

    document.getElementById('campo-retrato')?.addEventListener('change', (evento) => {
      estado.retrato = (evento.target as HTMLSelectElement).value;
      render();
    });

    document.getElementById('campo-genero')?.addEventListener('change', (evento) => {
      estado.genero = (evento.target as HTMLSelectElement).value as Genero;
    });

    document.getElementById('campo-traco')?.addEventListener('change', (evento) => {
      estado.tracoId = (evento.target as HTMLSelectElement).value;
      render();
    });

    document.getElementById('btn-distribuir')?.addEventListener('click', () => abrirDistribuicao(estado, render));
    document.getElementById('btn-voltar')?.addEventListener('click', aoVoltar);

    botaoComecar.addEventListener('click', () => {
      if (!podeComecar()) return;
      const sorte = atributosFinais.sorte;
      const origem = rollOrigin(sorte);
      // GDD 12: Rolagem de Herança no nascimento.
      const tierNascimento = rolarTierHeranca(sorte);
      if (tierNascimento === 'Lendário' && !origem.corpoEspecial) origem.corpoEspecial = escolher(CORPOS_ESPECIAIS);
      if (tierNascimento === 'Ouro Negro' || tierNascimento === 'Lendário') origem.herancaSelada = true;
      aoComecar(
        createCharacter({
          nome: estado.nome.trim(),
          genero: estado.genero,
          traco,
          origem,
          raizEspiritual: rollSpiritualRoot(sorte),
          atributosDistribuidos: estado.distribuicao,
          retrato: estado.retrato || undefined,
        }),
      );
    });
  };

  render();
}
