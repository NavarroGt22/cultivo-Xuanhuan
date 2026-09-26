import { Attributes } from './attributes';
import { Character, getEffectiveAttributes } from './character';
import { attributeCheck } from './dice';
import { shiftAlignment } from './alignment';

export interface StoryChoice {
  texto: string;
  /** Nó seguinte, usado quando não há teste de atributo. */
  proximoNo: string;
  testeAtributo?: keyof Attributes;
  dificuldade?: number;
  /** Nó seguinte em caso de sucesso no teste (sobrescreve proximoNo). */
  aoSucesso?: string;
  /** Nó seguinte em caso de falha no teste (sobrescreve proximoNo). */
  aoFalhar?: string;
  deltaAlinhamento?: number;
}

export interface FalaPersonagem {
  nome: string;
  /** Nome de arquivo de retrato em /assets, opcional. */
  retrato?: string;
}

export interface StoryNode {
  id: string;
  texto: string;
  /** Nome de arquivo de imagem de CENA em /assets, opcional. */
  imagem?: string;
  /** Quem está "falando"/protagonizando este trecho — exibe nome + retrato em destaque. */
  personagem?: FalaPersonagem;
  escolhas: StoryChoice[];
  final?: boolean;
}

/**
 * Conteúdo de EXEMPLO — troque pelo conteúdo real do seu GDD
 * (reinos de cultivo, seitas supremas, mundos perdidos etc.)
 */
export const STORY: Record<string, StoryNode> = {
  inicio: {
    id: 'inicio',
    texto:
      'Você desperta na fronteira entre o Leste e a Planície Central, sem memória de como chegou ali. Ao longe, a torre de uma Seita Suprema recorta o horizonte.',
    imagem: 'fronteira.png',
    escolhas: [
      { texto: 'Seguir em direção à torre.', proximoNo: 'torre' },
      {
        texto: 'Escalar um penhasco próximo pra ver melhor a região (teste de Destreza).',
        proximoNo: 'penhasco_falha',
        testeAtributo: 'destreza',
        dificuldade: 12,
        aoSucesso: 'penhasco_sucesso',
        aoFalhar: 'penhasco_falha',
      },
    ],
  },
  torre: {
    id: 'torre',
    texto: '"Pare aí. Quem é você e o que veio fazer no território da nossa seita?"',
    personagem: { nome: 'Discípulo Wen Rui', retrato: 'discipulo_wen_rui.png' },
    escolhas: [
      {
        texto: 'Dizer a verdade — que não lembra de nada.',
        proximoNo: 'final_recrutado',
        deltaAlinhamento: 10,
      },
      {
        texto: 'Mentir, dizendo que é um discípulo perdido de outra seita.',
        proximoNo: 'final_expulso',
        deltaAlinhamento: -15,
      },
    ],
  },
  penhasco_sucesso: {
    id: 'penhasco_sucesso',
    texto:
      'Você escala com facilidade e avista, ao longe, um selo antigo brilhando fracamente — talvez um Mundo Perdido esquecido.',
    escolhas: [
      { texto: 'Seguir em direção à torre, agora com essa informação.', proximoNo: 'torre' },
    ],
  },
  penhasco_falha: {
    id: 'penhasco_falha',
    texto: 'Você escorrega e cai, machucando o orgulho (e o joelho). Melhor seguir a pé mesmo.',
    escolhas: [{ texto: 'Seguir em direção à torre.', proximoNo: 'torre' }],
  },
  final_recrutado: {
    id: 'final_recrutado',
    texto:
      'Impressionado com sua honestidade, o discípulo te leva à seita. Você se torna um discípulo externo — o começo de uma longa jornada.',
    escolhas: [],
    final: true,
  },
  final_expulso: {
    id: 'final_expulso',
    texto:
      'A mentira é descoberta rapidamente. Você é expulso do território da seita sob ameaça — sozinho, sem aliados, mas livre.',
    escolhas: [],
    final: true,
  },
};

export interface StoryResult {
  novoNoId: string;
  mensagemTeste?: string;
}

export function resolverEscolha(character: Character, escolha: StoryChoice): StoryResult {
  if (escolha.deltaAlinhamento) {
    character.alinhamento = shiftAlignment(character.alinhamento, escolha.deltaAlinhamento);
  }

  if (escolha.testeAtributo && escolha.dificuldade !== undefined) {
    const atributos = getEffectiveAttributes(character);
    const valorAtributo = atributos[escolha.testeAtributo];
    const resultado = attributeCheck(valorAtributo, escolha.dificuldade);
    const destino = resultado.success ? escolha.aoSucesso : escolha.aoFalhar;

    return {
      novoNoId: destino ?? escolha.proximoNo,
      mensagemTeste: `Teste de ${escolha.testeAtributo}: rolou ${resultado.roll} + ${valorAtributo} = ${resultado.total} (dificuldade ${escolha.dificuldade}) — ${resultado.success ? 'Sucesso!' : 'Falha.'}`,
    };
  }

  return { novoNoId: escolha.proximoNo };
}
