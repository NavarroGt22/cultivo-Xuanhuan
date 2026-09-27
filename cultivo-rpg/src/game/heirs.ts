import {
  ATTRIBUTE_KEYS,
  MAX_ATRIBUTO_DISTRIBUIDO,
  PONTOS_DE_CRIACAO,
  createBaseAttributes,
} from './attributes';
import { Character, createCharacter, getCharacterStats } from './character';
import { addItem } from './inventory';
import { ESTILO_IDS, estiloPrincipal } from './martialStyles';
import type { Relacao } from './relationships';
import { rollSpiritualRoot } from './spiritualRoot';
import { idManual } from './techniques';
import { TRAITS } from './traits';
import { StoryNode, StoryState } from './story';
import { escolher, chance } from './rng';
import { tipoOrigemDaFaccao } from './faction';
import { getMontaria, getMoradia } from './market';
import { crescerNoivado } from './betrothal';
import { arquivarVida } from './journal';

/**
 * Herdeiro: ao morrer, a história continua por um filho.
 * Fecha o ciclo do GDD 2 e 13: riqueza, biblioteca e nome passam adiante — e o prestígio murcha
 * se a nova geração não produzir outro nome forte.
 */
export const CHAVE_FAMA_FAMILIAR = 'famaFamiliar';
/** Fração da fama do pai que vira fama da família para o herdeiro. */
const HERANCA_DE_FAMA = 0.6;
/** O prestígio herdado murcha 2% por estação. */
export const DECAIMENTO_FAMA_FAMILIAR = 0.98;

export function herdeirosDisponiveis(character: Character): Relacao[] {
  return character.relacoes.filter((r) => r.tipo === 'Filho(a)');
}

function distribuicaoAleatoria() {
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

function noLegado(herdeiro: Character, pai: Character, turno: number, legado: string[]): StoryNode {
  const linhagem = String(herdeiro.flags.linhagem ?? pai.nome);
  return {
    id: `legado-${turno}`,
    evento: 'legado',
    titulo: 'O Legado',
    texto: [
      `${pai.nome} se foi. Você é **${herdeiro.nome}**, filh${herdeiro.genero === 'feminino' ? 'a' : 'o'} de ${pai.nome}, e agora carrega o nome da família sozinh${herdeiro.genero === 'feminino' ? 'a' : 'o'}.`,
      `Linhagem: ${linhagem.split('|').join(' → ')}.`,
      `O que ficou para você: ${legado.join('; ')}.`,
      'O mundo lembra do seu pai — por enquanto. Se a nova geração não fizer o próprio nome, esse prestígio vai murchar.',
    ].join('\n\n'),
    escolhas: [{ texto: 'Honrar o nome da família.', resultado: { texto: 'Você enxuga as lágrimas e volta ao treino.' } }],
    meses: 3,
  };
}

/** Cria o herdeiro a partir de um filho; o mundo (NPCs, seitas, rankings) continua o mesmo. */
export function criarHerdeiro(pai: Character, historia: StoryState, filhoId: string): { character: Character; historia: StoryState } | null {
  const filho = pai.relacoes.find((r) => r.id === filhoId && r.tipo === 'Filho(a)');
  if (!filho) return null;

  const corpo = pai.origem.corpoEspecial && chance(0.3) ? pai.origem.corpoEspecial : null;
  const origem = {
    ...pai.origem,
    corpoEspecial: corpo,
    herancaSelada: false,
    reencarnacao: null,
    pedrasIniciais: Math.floor(pai.inventario.pedrasEspirituais * 0.5),
    // Filho do fundador: nasce no ramo principal da facção que o pai construiu.
    ...(pai.faccao
      ? { tipo: tipoOrigemDaFaccao(pai.faccao), nomeCasa: pai.faccao.nome, ramo: 'principal' as const, ortodoxa: pai.faccao.ortodoxa }
      : {}),
  };

  const raiz = rollSpiritualRoot(pai.atributosBase.sorte);
  raiz.grau = filho.raizGrau ?? raiz.grau;

  const herdeiro = createCharacter({
    nome: filho.nome,
    genero: chance(0.5) ? 'masculino' : 'feminino',
    traco: escolher(TRAITS),
    origem,
    raizEspiritual: raiz,
    atributosDistribuidos: distribuicaoAleatoria(),
  });

  const legado: string[] = [`${origem.pedrasIniciais} pedras espirituais`];

  // Começa aos 12 anos (ou na idade atual do filho), com a raiz já revelada.
  herdeiro.idadeMeses = Math.max(12, Math.floor(filho.idade)) * 12;
  herdeiro.flags.raizRevelada = true;
  // O noivado arranjado no berço cresceu junto com o herdeiro.
  if (herdeiro.noivado) crescerNoivado(herdeiro.noivado, herdeiro.idadeMeses);
  // Uma guerra da facção continua com o novo líder.
  if (pai.faccao && pai.guerra) herdeiro.guerra = { ...pai.guerra, lider: { ...pai.guerra.lider } };
  herdeiro.flags.pai = pai.nome;
  const conjuge = pai.relacoes.find((r) => r.tipo === 'Cônjuge' || r.tipo === 'Companheiro(a) de Dao');
  if (conjuge) herdeiro.flags.mae = conjuge.nome;
  herdeiro.flags.linhagem = `${String(pai.flags.linhagem ?? pai.nome)}|${herdeiro.nome}`;
  if (corpo) legado.push(`o sangue do ${corpo.nome}`);

  // Fama: o nome da família carrega o prestígio do pai (e murcha com o tempo).
  const famaAnterior = Number(pai.flags[CHAVE_FAMA_FAMILIAR] ?? 0);
  herdeiro.flags[CHAVE_FAMA_FAMILIAR] = Math.round((pai.reputacao + (pai.cultivo.rank - 1) * 25) * HERANCA_DE_FAMA + famaAnterior * 0.5);
  herdeiro.reputacao = Math.floor(pai.reputacao * 0.2);

  // Arte da família: o estilo principal do pai, no nível Iniciante.
  const estiloDoPai = estiloPrincipal(pai.estilos);
  if (estiloDoPai) {
    herdeiro.estilos[estiloDoPai] = { nivel: 1, xp: 0 };
    legado.push('a arte marcial da família');
  } else if (ESTILO_IDS.every((id) => herdeiro.estilos[id].nivel === 0)) {
    herdeiro.estilos.punho = { nivel: 1, xp: 0 };
  }

  // Biblioteca da família: manuais das técnicas do pai.
  for (const id of pai.tecnicas) addItem(herdeiro.inventario, idManual(id), 1);
  if (pai.tecnicas.length) legado.push(`${pai.tecnicas.length} manual(is) de técnica`);

  // Tesouros: equipamentos e itens.
  for (const item of [...pai.equipamentos, ...pai.inventario.equipamentos]) herdeiro.inventario.equipamentos.push({ ...item });
  for (const item of pai.inventario.itens) addItem(herdeiro.inventario, item.id, item.quantidade);
  if (pai.equipamentos.length + pai.inventario.equipamentos.length) legado.push('os artefatos do seu pai');

  // A besta companheira escolhe ficar com a família.
  if (pai.companheira) {
    herdeiro.companheira = { ...pai.companheira, vinculo: 35, deInfancia: false, modoEvolucao: 'independente' };
    legado.push(`${pai.companheira.nome}, a besta do seu pai`);
  }

  // Irmãos e o outro genitor viram relações do herdeiro.
  for (const irmao of herdeirosDisponiveis(pai).filter((r) => r.id !== filho.id)) {
    herdeiro.relacoes.push({ ...irmao, tipo: 'Irmão(ã)', relacao: 60 });
  }
  if (conjuge) herdeiro.relacoes.push({ ...conjuge, tipo: 'Mãe/Pai', relacao: 80 });

  // Rixas de sangue duram gerações; vassalos continuam servindo a família.
  for (const r of pai.relacoes.filter((x) => x.tipo === 'Inimigo Jurado' || x.tipo === 'Vassalo')) {
    herdeiro.relacoes.push({ ...r });
  }
  if (pai.relacoes.some((x) => x.tipo === 'Inimigo Jurado')) legado.push('as rixas de sangue do seu pai');

  // A facção fundada passa ao herdeiro, que vira o novo líder.
  if (pai.faccao) {
    // A família do pai continua como membros comuns; a do herdeiro entra quando ele formar a sua.
    herdeiro.faccao = { ...pai.faccao, instalacoes: { ...pai.faccao.instalacoes }, familia: [] };
    herdeiro.afiliacao = {
      tipo: pai.faccao.tipo,
      nome: pai.faccao.nome,
      ortodoxa: pai.faccao.ortodoxa,
      posto: pai.faccao.tipo === 'cla' ? 'Patriarca' : 'Mestre da Seita',
      estipendio: 0,
    };
    legado.push(`a liderança ${pai.faccao.tipo === 'cla' ? 'do' : 'da'} ${pai.faccao.nome} (${pai.faccao.membros} membros)`);
  }

  // As Seitas Supremas lembram da família: metade da reputação do pai passa ao herdeiro.
  const reputacaoHerdada = Object.entries(pai.reputacaoSupremas ?? {})
    .map(([nome, valor]) => [nome, Math.round(valor / 2)] as const)
    .filter(([, valor]) => valor !== 0);
  if (reputacaoHerdada.length) herdeiro.reputacaoSupremas = Object.fromEntries(reputacaoHerdada);

  // O que a família aprendeu sobre as bestas fica nos cadernos da casa.
  if (pai.conhecimentoBestas) herdeiro.conhecimentoBestas = JSON.parse(JSON.stringify(pai.conhecimentoBestas));

  herdeiro.moradia = pai.moradia ?? null;
  herdeiro.campos = (pai.campos ?? []).map(campo => ({ ...campo }));
  if (herdeiro.campos.length) legado.push(`${herdeiro.campos.length} campo(s) espiritual(is)`);
  herdeiro.montaria = pai.montaria ?? null;
  herdeiro.fornalha = pai.fornalha;
  const casa = getMoradia(pai.moradia);
  const montaria = getMontaria(pai.montaria);
  if (casa) legado.push(`a casa da família (${casa.nome})`);
  if (montaria) legado.push(montaria.nome);

  // Clã da família: o herdeiro continua ligado; seita e emprego do pai não passam adiante.
  herdeiro.local = { ...pai.local };
  herdeiro.vidaAtual = getCharacterStats(herdeiro).vida;

  const mundo = historia.mundo;
  mundo.torres = {};
  mundo.quadro = [];
  mundo.quadroTurno = -999;
  mundo.campanhaResgatada = [];
  mundo.titulosTorneio = 0;

  const turno = historia.turno + 1;
  const novaHistoria: StoryState = {
    ancestrais: [...(historia.ancestrais ?? []), arquivarVida(pai, historia)],
    turno,
    noAtual: noLegado(herdeiro, pai, turno, legado),
    desfecho: null,
    avisos: [],
    recentes: [],
    energia: historia.energia,
    contagemAtividades: {},
    mundo,
  };
  return { character: herdeiro, historia: novaHistoria };
}
