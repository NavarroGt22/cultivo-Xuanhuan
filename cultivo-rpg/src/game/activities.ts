import type { StoryChoice } from './story';
import { Character, getCharacterStats, idadeAnos } from './character';
import { ganhoCultivo } from './cultivation';
import { getConsumivel } from './items';
import { atributoDoCargo, getCargo } from './occupations';
import { REGIOES, RegiaoId } from './world';
import { chance, escolher } from './rng';
import { ESTILOS, ESTILO_IDS, EstiloId, NIVEIS_MAESTRIA, tituloMaestria, xpParaProximaMaestria } from './martialStyles';
import { influenciaFamilia } from './influence';
import { ehDiscipulo } from './sect';
import { descontoViagem, getMontaria } from './market';

/** Atividades do docs/Sistema-de-vida.md. Cada uma custa 1 de energia da estação. */
export interface Atividade {
  id: string;
  grupo: string;
  /** O que acontece ao repetir mais de LIMITE_REPETICOES vezes na mesma estação (padrão: não rende nada). */
  excesso?: 'desvio' | 'lesao';
  /** Motivo de indisponibilidade (além dos requisitos da própria escolha), ou null. */
  bloqueio?: (character: Character) => string | null;
  montar: (character: Character) => StoryChoice;
}

export const LIMITE_REPETICOES = 3;
export const ENERGIA_ATIVIDADE = 1;

/** Ordem das pastas no painel. */
export const ORDEM_GRUPOS = [
  'Estilos Marciais',
  'Corpo e Cultivo',
  'Seita',
  'Trabalho',
  'Educação e Lazer',
  'Social',
  'Finanças',
  'Crime',
  'Bestas e Espiritualidade',
  'Viagem',
];

function escolhaDeExcesso(atividade: Atividade, original: StoryChoice): StoryChoice {
  if (atividade.excesso === 'desvio') {
    return {
      texto: original.texto,
      teste: { atributo: 'espirito', dificuldade: 16 },
      resultado: { texto: 'Você força o cultivo além do limite... e por pouco o qi não sai do controle. Não rendeu nada.' },
      falha: {
        texto: 'Cultivo demais numa só estação: o qi sai do controle. Desvio de qi!',
        efeitos: { progresso: -20, danoPercentual: 30, toxina: 5 },
      },
      falhaCritica: {
        texto: 'Um desvio de qi grave rasga seus meridianos.',
        efeitos: { progresso: -35, danoPercentual: 55, atributos: { espirito: -1 } },
      },
    };
  }
  if (atividade.excesso === 'lesao') {
    return {
      texto: original.texto,
      resultado: { texto: 'O corpo não aguenta tanto esforço seguido. Você se lesiona.', efeitos: { danoPercentual: 25 } },
    };
  }
  return { texto: original.texto, resultado: { texto: 'Você repete a mesma coisa pela quarta vez. Já não rende nada nesta estação.' } };
}

/** Estilo que cada seita ensina, escolhido de forma estável a partir do nome. */
export function estiloDaSeita(nomeSeita: string): EstiloId {
  let hash = 0;
  for (const letra of nomeSeita) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return ESTILO_IDS[hash % ESTILO_IDS.length];
}

function rank(character: Character): number {
  return character.cultivo.rank;
}

function ganho(character: Character, multiplicador: number): number {
  return ganhoCultivo(getCharacterStats(character).velocidadeCultivo, 3, multiplicador);
}

function pedras(character: Character, base: number): number {
  return Math.max(1, Math.round(base * REGIOES[character.local.regiao].fatorPoder * (1 + (rank(character) - 1) * 1.5)));
}

function dif(character: Character, base: number): number {
  return base + (rank(character) - 1) * 3;
}

const MAX_INVESTIMENTOS = 5;

const semOcupacao = (c: Character): string | null => (c.ocupacao ? null : 'Requer uma ocupação');
const semRaiz = (c: Character): string | null => (c.flags.raizRevelada ? null : 'Só depois da Cerimônia do Despertar');

const ATIVIDADES_FIXAS: Atividade[] = [
  // Corpo e Cultivo
  {
    id: 'meditar',
    grupo: 'Corpo e Cultivo',
    excesso: 'desvio',
    bloqueio: semRaiz,
    montar: (c) => ({
      texto: 'Meditação corporal (circular o qi)',
      resultado: { texto: 'Horas em silêncio, guiando a energia pelos meridianos.', efeitos: { progresso: ganho(c, 0.7) } },
    }),
  },
  {
    id: 'retiro',
    grupo: 'Corpo e Cultivo',
    excesso: 'desvio',
    bloqueio: semRaiz,
    montar: (c) => ({
      texto: 'Retiro de cultivo numa caverna isolada (5 pedras)',
      requisito: { pedras: 5 },
      resultado: { texto: 'Longe de tudo, a energia do mundo flui mais pura.', efeitos: { pedras: -5, progresso: ganho(c, 1.6) } },
    }),
  },
  {
    id: 'cultivo-intensivo',
    grupo: 'Corpo e Cultivo',
    excesso: 'desvio',
    bloqueio: semRaiz,
    montar: (c) => ({
      texto: 'Cultivo intensivo — risco de desvio de qi',
      teste: { atributo: 'espirito', dificuldade: dif(c, 13) },
      resultado: { texto: 'Você força os meridianos ao limite, e eles aguentam.', efeitos: { progresso: ganho(c, 2.5) } },
      falha: { texto: 'O qi sai do controle e rasga seus meridianos. Desvio de qi.', efeitos: { progresso: -15, danoPercentual: 40 } },
      falhaCritica: {
        texto: 'Um desvio de qi grave. Você sobrevive, mas algo em seu espírito se quebra.',
        efeitos: { progresso: -30, danoPercentual: 70, atributos: { espirito: -1 } },
      },
    }),
  },
  {
    id: 'treinar-patio',
    grupo: 'Corpo e Cultivo',
    excesso: 'lesao',
    montar: (c) => ({
      texto: 'Treinar no pátio de artes marciais',
      teste: { atributo: 'constituicao', dificuldade: dif(c, 13) },
      resultado: { texto: 'Mil repetições depois, o corpo responde melhor.', efeitos: { atributos: { [escolher(['forca', 'destreza', 'constituicao'])]: 1 } } },
      falha: { texto: 'Uma distensão te tira do pátio por semanas.', efeitos: { danoPercentual: 15 } },
    }),
  },
  {
    id: 'curandeiro',
    grupo: 'Corpo e Cultivo',
    montar: () => ({
      texto: 'Consultar um curandeiro (3 pedras)',
      requisito: { pedras: 3 },
      resultado: { texto: 'Agulhas, ervas e uma massagem de meridianos dolorosa.', efeitos: { pedras: -3, curaPercentual: 100, toxina: -10 } },
    }),
  },

  // Cultivo e Trabalho
  {
    id: 'trabalhar-dobrado',
    grupo: 'Trabalho',
    excesso: 'lesao',
    bloqueio: semOcupacao,
    montar: () => ({
      texto: 'Trabalhar dobrado',
      resultado: { texto: 'Noites sem dormir. Seus superiores notam.', efeitos: { desempenho: 15, danoPercentual: 10 } },
    }),
  },
  {
    id: 'pedir-promocao',
    grupo: 'Trabalho',
    bloqueio: semOcupacao,
    montar: (c) => ({
      texto: 'Pedir promoção',
      teste: { atributo: c.ocupacao ? atributoDoCargo(c.ocupacao) : 'inteligencia', dificuldade: 12 + (c.ocupacao?.cargo ?? 0) * 2 },
      resultado: { texto: 'Seu superior concorda que você merece mais.', efeitos: { desempenho: 30 } },
      falha: { texto: '"Quem você pensa que é?"', efeitos: { desempenho: -10 } },
    }),
  },
  {
    id: 'recursos-anciao',
    grupo: 'Trabalho',
    bloqueio: (c) => (c.afiliacao.tipo === 'nenhuma' || c.afiliacao.tipo === 'familia' ? 'Requer clã ou seita' : null),
    montar: (c) => ({
      texto: 'Pedir mais recursos a um ancião',
      teste: { atributo: 'inteligencia', dificuldade: dif(c, 14) },
      resultado: {
        texto: 'O ancião se convence de que você vale o investimento.',
        efeitos: { pedras: pedras(c, 3 + influenciaFamilia(c).nivel * 2), itens: [{ id: 'pilula-chakra', quantidade: 1 }] },
      },
      falha: { texto: 'O ancião te acha insolente.', efeitos: { reputacao: -2 } },
    }),
  },

  {
    id: 'tarefas-seita',
    grupo: 'Seita',
    bloqueio: (c) => (ehDiscipulo(c) ? null : 'Só para discípulos de seita'),
    montar: () => ({
      texto: 'Cumprir tarefas extras no Salão de Missões da seita',
      resultado: { texto: 'Patrulhas, colheitas de ervas, escolta de mercadores. A seita anota cada ponto.', efeitos: { contribuicao: 15 } },
    }),
  },
  {
    id: 'sala-cultivo-seita',
    grupo: 'Seita',
    excesso: 'desvio',
    bloqueio: (c) => (!ehDiscipulo(c) ? 'Só para discípulos de seita' : semRaiz(c)),
    montar: (c) => ({
      texto: 'Meditar na Sala de Cultivo da seita, sobre uma veia espiritual (20 de contribuição)',
      requisito: { contribuicao: 20 },
      resultado: { texto: 'A energia ali é tão densa que quase se pode tocá-la.', efeitos: { contribuicao: -20, progresso: ganho(c, 2.2) } },
    }),
  },

  // Educação e Lazer
  {
    id: 'ler-manual',
    grupo: 'Educação e Lazer',
    montar: (c) => ({
      texto: 'Ler manuais na biblioteca',
      teste: { atributo: 'inteligencia', dificuldade: dif(c, 14) },
      resultado: { texto: 'Um conceito difícil finalmente se encaixa.', efeitos: { atributos: { inteligencia: 1 } } },
      falha: { texto: 'Você cochila em cima do pergaminho.' },
    }),
  },
  {
    id: 'go-espiritual',
    grupo: 'Educação e Lazer',
    montar: () => ({
      texto: 'Jogar Go espiritual apostando (2 pedras)',
      requisito: { pedras: 2 },
      teste: { atributo: 'inteligencia', dificuldade: 13 },
      resultado: { texto: 'Xeque no canto do tabuleiro. O oponente paga resmungando.', efeitos: { pedras: 4, reputacao: 1 } },
      falha: { texto: 'Você perde feio.', efeitos: { pedras: -2 } },
    }),
  },
  {
    id: 'pescar',
    grupo: 'Educação e Lazer',
    montar: () => {
      const erva = chance(0.3);
      return {
        texto: 'Pescar e descansar à beira do rio',
        resultado: {
          texto: erva ? 'Na margem, uma erva espiritual cresce entre as pedras.' : 'Um dia calmo. O corpo agradece.',
          efeitos: { curaPercentual: 40, ...(erva ? { itens: [{ id: 'erva-espiritual', quantidade: 1 }] } : { pedras: 1 }) },
        },
      };
    },
  },

  // Social
  {
    id: 'fazer-amigos',
    grupo: 'Social',
    bloqueio: (c) => (idadeAnos(c) < 12 ? 'Requer 12 anos' : c.relacoes.length >= 15 ? 'Você já conhece gente demais' : null),
    montar: () => ({
      texto: 'Conhecer pessoas novas (aparece em Relações)',
      resultado: { texto: 'Uma conversa numa casa de chá, um treino no pátio... e um rosto novo na sua vida.', efeitos: { conhecerAlguem: true } },
    }),
  },
  {
    id: 'casa-de-cha',
    grupo: 'Social',
    montar: () => ({
      texto: 'Ouvir rumores numa casa de chá (1 pedra)',
      requisito: { pedras: 1 },
      resultado: {
        texto: 'Entre um gole e outro, alguém fala de uma ruína antiga recém-descoberta nas redondezas.',
        efeitos: { pedras: -1, reputacao: 1, flags: { rumorRuina: true } },
      },
    }),
  },
  {
    id: 'visitar-familia',
    grupo: 'Social',
    bloqueio: (c) => (c.origem.tipo === 'orfao' ? 'Você não tem família' : null),
    montar: (c) => ({
      texto: 'Visitar a família',
      resultado: {
        texto: 'Uma refeição em casa cura mais do que qualquer pílula.',
        efeitos: { curaPercentual: 60, alinhamento: 3, pedras: c.origem.ramo === 'principal' ? pedras(c, 4) : 1 },
      },
    }),
  },
  {
    id: 'ajudar-vila',
    grupo: 'Social',
    montar: () => ({
      texto: 'Ajudar a vila (reconstruir, patrulhar, curar)',
      resultado: { texto: 'Os moradores não esquecem quem estendeu a mão.', efeitos: { alinhamento: 6, reputacao: 2 } },
    }),
  },

  // Finanças
  {
    id: 'investir-ervas',
    grupo: 'Finanças',
    bloqueio: (c) => (Number(c.flags.investimentos ?? 0) >= MAX_INVESTIMENTOS ? `Máximo de ${MAX_INVESTIMENTOS} campos` : null),
    montar: (c) => {
      const custo = pedras(c, 20) * (1 + Number(c.flags.investimentos ?? 0));
      return {
        texto: `Investir num campo de ervas espirituais (${custo} pedras) — +2 pedras por estação`,
        requisito: { pedras: custo },
        resultado: {
          texto: 'Você compra uma parte de um campo de ervas. Vai render por anos.',
          efeitos: { pedras: -custo, flags: { investimentos: Number(c.flags.investimentos ?? 0) + 1 } },
        },
      };
    },
  },
  {
    id: 'vender-tesouros',
    grupo: 'Finanças',
    bloqueio: (c) => (itensVendaveis(c).length === 0 ? 'Nada para vender' : null),
    montar: (c) => {
      const itens = itensVendaveis(c);
      const total = itens.reduce((soma, item) => soma + (getConsumivel(item.id)?.valor ?? 0) * item.quantidade, 0);
      return {
        texto: `Vender núcleos, ervas e talismãs (${total} pedras)`,
        resultado: {
          texto: 'O comerciante confere cada peça antes de pagar.',
          efeitos: { pedras: total, removerItens: itens.map((item) => ({ id: item.id, quantidade: item.quantidade })) },
        },
      };
    },
  },

  // Crime
  {
    id: 'furtar-loja',
    grupo: 'Crime',
    montar: (c) => ({
      texto: 'Furtar uma loja',
      teste: { atributo: 'destreza', dificuldade: dif(c, 13) },
      resultado: { texto: 'Ninguém viu nada.', efeitos: { pedras: pedras(c, 5), alinhamento: -6 } },
      falha: { texto: 'O dono te pega pelo colarinho e chama a guarda.', efeitos: { alinhamento: -6, reputacao: -5, danoPercentual: 20 } },
    }),
  },

  // Bestas e Espiritualidade
  {
    id: 'treinar-besta',
    grupo: 'Bestas e Espiritualidade',
    excesso: 'lesao',
    bloqueio: (c) => (c.companheira ? null : 'Requer uma besta companheira'),
    montar: (c) => ({
      texto: `Treinar ${c.companheira?.nome ?? 'sua besta'} sozinha (a besta evolui separada de você)`,
      teste: { atributo: 'espirito', dificuldade: dif(c, 12) - c.profissoes.domador.nivel * 2 },
      resultado: {
        texto: 'Caçadas, desafios e horas de meditação ao lado dela. Ela volta mais forte.',
        efeitos: { treinoCompanheira: { progresso: 40, vinculo: 5 }, xpProfissao: { domador: 25 } },
      },
      falha: { texto: 'A besta está de mau humor hoje.', efeitos: { treinoCompanheira: { progresso: 5, vinculo: -2 } } },
    }),
  },
  {
    id: 'treinar-junto',
    grupo: 'Bestas e Espiritualidade',
    excesso: 'desvio',
    bloqueio: (c) => (!c.companheira ? 'Requer uma besta companheira' : semRaiz(c)),
    montar: (c) => ({
      texto: `Cultivar junto com ${c.companheira?.nome ?? 'sua besta'} (os dois evoluem)`,
      resultado: {
        texto: 'Vocês circulam energia em sintonia: o qi dela reforça o seu, e o seu, o dela.',
        efeitos: { progresso: ganho(c, 0.6), treinoCompanheira: { progresso: 20, vinculo: 3 }, xpProfissao: { domador: 15 } },
      },
    }),
  },
  {
    id: 'domar-besta-selvagem',
    grupo: 'Bestas e Espiritualidade',
    bloqueio: (c) => (c.profissoes.domador.nivel === 0 ? 'Requer ser Domador de Bestas' : c.companheira ? 'Você já tem uma companheira' : null),
    montar: (c) => {
      const especie = escolher(REGIOES[c.local.regiao].fauna);
      return {
        texto: `Procurar e domar uma besta selvagem (${especie})`,
        teste: { atributo: 'espirito', dificuldade: dif(c, 14) - c.profissoes.domador.nivel * 2 },
        resultado: {
          texto: `Depois de dias rastreando, a ${especie} aceita seu contrato de alma.`,
          efeitos: {
            novaCompanheira: { especie, rank: c.cultivo.rank, estagio: Math.max(1, c.cultivo.estagio - 1), atributoMedio: 7 + c.cultivo.rank },
            xpProfissao: { domador: 40 },
          },
        },
        falha: { texto: 'A besta foge para o fundo da mata.', efeitos: { danoPercentual: 15 } },
      };
    },
  },
  {
    id: 'ler-destino',
    grupo: 'Bestas e Espiritualidade',
    bloqueio: (c) => (idadeAnos(c) < 12 ? 'Requer 12 anos' : null),
    montar: (c) =>
      c.profissoes.adivinhacao.nivel > 0
        ? {
            texto: 'Ler o próprio destino nas estrelas (Divinação)',
            resultado: { texto: 'Você joga os ossos e observa as estrelas até o amanhecer.', efeitos: { lerDestino: 'proprio', xpProfissao: { adivinhacao: 30 } } },
          }
        : {
            texto: 'Consultar um adivinho de praça (4 pedras)',
            requisito: { pedras: 4 },
            resultado: { texto: 'O adivinho fecha os olhos e fala devagar.', efeitos: { pedras: -4, lerDestino: 'pago' } },
          },
  },
  {
    id: 'templo',
    grupo: 'Bestas e Espiritualidade',
    montar: () => ({
      texto: 'Frequentar o templo e meditar sobre o próprio caminho',
      resultado: { texto: 'A mente se aquieta. A toxina parece pesar menos.', efeitos: { toxina: -8, alinhamento: 2, curaPercentual: 20 } },
    }),
  },
];

function itensVendaveis(character: Character) {
  return character.inventario.itens.filter((item) => !getConsumivel(item.id)?.efeitosAoUsar && (getConsumivel(item.id)?.valor ?? 0) > 0);
}

/** Uma viagem por região diferente da atual. Perde-se o emprego local. */
function atividadesDeViagem(character: Character): Atividade[] {
  return (Object.keys(REGIOES) as RegiaoId[])
    .filter((id) => id !== character.local.regiao)
    .map((id) => {
      const regiao = REGIOES[id];
      const custoBase = 10 + Math.abs(regiao.posicao - REGIOES[character.local.regiao].posicao) * 5;
      const custo = Math.round(custoBase * (1 - descontoViagem(character)));
      return {
        id: `viajar-${id}`,
        grupo: 'Viagem',
        bloqueio: (c: Character) => (idadeAnos(c) < 14 ? 'Requer 14 anos' : null),
        montar: (c: Character) => ({
          texto: `Viajar para ${regiao.preposicao === 'na' ? 'a' : 'o'} ${regiao.nome} (${custo} pedras${getMontaria(c.montaria) ? `, de ${getMontaria(c.montaria)?.nome}` : ''})${c.ocupacao ? ` — deixa o emprego de ${getCargo(c.ocupacao).nome}` : ''}`,
          requisito: { pedras: custo },
          resultado: {
            texto: `Semanas de estrada depois, ${regiao.descricao.charAt(0).toUpperCase()}${regiao.descricao.slice(1)}`,
            efeitos: {
              pedras: -custo,
              mudarLocal: { regiao: id, cidade: escolher(regiao.cidades) },
              perderOcupacao: Boolean(c.ocupacao),
            },
          },
        }),
      };
    });
}

/** Discípulos praticam a arte da própria seita: aprendem na primeira vez e ganham mais XP e contribuição. */
function atividadeArteDaSeita(character: Character): Atividade[] {
  if (!ehDiscipulo(character)) return [];
  const id = estiloDaSeita(character.afiliacao.nome);
  const estado = character.estilos[id];
  if (estado.nivel >= NIVEIS_MAESTRIA.length) return [];
  return [
    {
      id: 'arte-da-seita',
      grupo: 'Estilos Marciais',
      excesso: 'lesao',
      montar: () =>
        estado.nivel === 0
          ? {
              texto: `Praticar a arte da seita: ${ESTILOS[id].nome} (aprender)`,
              resultado: { texto: `Os instrutores da ${character.afiliacao.nome} te ensinam as formas básicas do ${ESTILOS[id].nome}.`, efeitos: { aprenderEstilo: id } },
            }
          : {
              texto: `Praticar a arte da seita: ${ESTILOS[id].nome} (${tituloMaestria(estado)} · ${estado.xp}/${xpParaProximaMaestria(estado.nivel)} xp)`,
              resultado: { texto: 'Treino coletivo no pátio da seita, sob o olhar de um instrutor.', efeitos: { xpEstilo: { [id]: 50 }, contribuicao: 3 } },
            },
    },
  ];
}

/** Uma prática por estilo aprendido; o XP escala com a Compreensão. */
function atividadesDeEstilo(character: Character): Atividade[] {
  const daSeita = ehDiscipulo(character) ? estiloDaSeita(character.afiliacao.nome) : null;
  return ESTILO_IDS.filter((id) => id !== daSeita && character.estilos[id].nivel > 0 && character.estilos[id].nivel < NIVEIS_MAESTRIA.length).map((id) => ({
    id: `praticar-${id}`,
    grupo: 'Estilos Marciais',
    excesso: 'lesao' as const,
    montar: (c: Character) => {
      const estado = c.estilos[id];
      return {
        texto: `Praticar ${ESTILOS[id].nome} (${tituloMaestria(estado)} · ${estado.xp}/${xpParaProximaMaestria(estado.nivel)} xp)`,
        resultado: { texto: 'Formas repetidas até o corpo lembrar sozinho.', efeitos: { xpEstilo: { [id]: 35 } } },
      };
    },
  }));
}

export interface AtividadeDisponivel {
  atividade: Atividade;
  escolha: StoryChoice;
  bloqueio: string | null;
  /** Vezes feita nesta estação. */
  vezes: number;
  /** A próxima vez já passa do limite. */
  emExcesso: boolean;
}

export function listarAtividades(character: Character, contagem: Record<string, number> = {}): AtividadeDisponivel[] {
  return [...atividadeArteDaSeita(character), ...atividadesDeEstilo(character), ...ATIVIDADES_FIXAS, ...atividadesDeViagem(character)].map(
    (atividade) => {
      const vezes = contagem[atividade.id] ?? 0;
      const emExcesso = vezes >= LIMITE_REPETICOES && !atividade.id.startsWith('viajar');
      const original = atividade.montar(character);
      return {
        atividade,
        escolha: emExcesso ? escolhaDeExcesso(atividade, original) : original,
        bloqueio: atividade.bloqueio?.(character) ?? null,
        vezes,
        emExcesso,
      };
    },
  );
}
