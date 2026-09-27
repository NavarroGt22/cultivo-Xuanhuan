import { ATTRIBUTE_KEYS } from './attributes';
import type { Character } from './character';
import { alterarVidaPercentual, getEffectiveAttributes } from './character';
import { DadosCombate, InimigoDef, encadearCombates, gerarInimigo } from './combat';
import { aplicarEfeitos } from './effects';
import { influenciaPessoal } from './influence';
import { REINOS } from './cultivation';
import { estagiosDoRank } from './npcs';
import type { Relacao } from './relationships';
import { DesfechoExibido, executarEscolha } from './story';
import { REGIOES, doFamilia } from './world';

/**
 * Como uma rixa de sangue termina (GDD 13):
 *  - extermínio: invadir a família/clã e derrubar guardas, ancião e patriarca;
 *  - intimidação: ficar tão forte que eles não ousam mais agir;
 *  - submissão: forte ou influente o bastante para obrigá-los a se curvar e pagar tributo.
 */
export const ENERGIA_EXTERMINIO = 3;

/** Dois reinos acima do Patriarca inimigo, ele não ousa mais mandar ninguém. */
export function inimigoIntimidado(character: Character, inimigo: Relacao): boolean {
  return character.cultivo.rank >= inimigo.rank + 2 || influenciaPessoal(character).nivel >= 6;
}

export function motivoBloqueioSubmissao(character: Character, inimigo: Relacao): string | null {
  if (character.cultivo.rank > inimigo.rank || influenciaPessoal(character).nivel >= 5) return null;
  return `Requer superar o Patriarca deles (${REINOS[inimigo.rank - 1]?.nome}) ou influência "Lenda do reino"`;
}

function nomeDaFamilia(inimigo: Relacao): string {
  return inimigo.nome.split(' (por')[0];
}

/**
 * A qualidade dos atributos acompanha a sua (como nos outros combates);
 * o que decide a luta é o REINO de cada defensor — por isso crescer resolve a rixa.
 */
function defensor(character: Character, nome: string, arquetipo: 'guerreiro' | 'mistico' | 'agil', rank: number, estagio: number, forca: number): InimigoDef {
  const atributos = getEffectiveAttributes(character);
  const mediaJogador = ATTRIBUTE_KEYS.reduce((soma, chave) => soma + atributos[chave], 0) / ATTRIBUTE_KEYS.length;
  const acompanhamento = (1 + character.tecnicas.length * 0.03) * (character.companheira ? 1.25 : 1);
  return gerarInimigo(nome, arquetipo, mediaJogador * acompanhamento * forca, rank, Math.min(estagiosDoRank(rank), estagio));
}

/** Três lutas seguidas, sem descanso completo entre elas: guardas, ancião e o Patriarca. */
export function exterminarFamilia(character: Character, inimigo: Relacao): DesfechoExibido {
  const familia = nomeDaFamilia(inimigo);
  const ondas: { titulo: string; def: InimigoDef }[] = [
    { titulo: 'Os portões', def: defensor(character, `Guardas ${doFamilia(familia)}`, 'guerreiro', Math.max(1, inimigo.rank - 2), 5, 0.9) },
    { titulo: 'O salão dos anciões', def: defensor(character, `Ancião ${doFamilia(familia)}`, 'mistico', Math.max(1, inimigo.rank - 1), 7, 0.95) },
    { titulo: 'A câmara de reclusão', def: defensor(character, `Patriarca ${doFamilia(familia)}`, 'guerreiro', inimigo.rank, inimigo.estagio, 1.0) },
  ];

  const rodadas: { titulo: string; dados: DadosCombate }[] = [];
  const mensagens: string[] = [];
  let vencidas = 0;

  for (const onda of ondas) {
    const resultado = executarEscolha(character, { texto: onda.titulo, combate: onda.def, resultado: { texto: '' }, falha: { texto: '' } });
    if (resultado.combate) rodadas.push({ titulo: onda.titulo, dados: resultado.combate });
    mensagens.push(...resultado.mensagens);
    if (!resultado.vitoria) break;
    vencidas++;
    alterarVidaPercentual(character, 15);
  }

  let texto: string;
  if (vencidas === ondas.length) {
    character.relacoes = character.relacoes.filter((r) => r.id !== inimigo.id);
    character.flags.familiasDestruidas = Number(character.flags.familiasDestruidas ?? 0) + 1;
    const fator = REGIOES[character.local.regiao].fatorPoder;
    texto = `${familia} não existe mais. O Patriarca caiu, o tesouro é seu, e a rixa de sangue termina aqui — com sangue.`;
    mensagens.push(
      ...aplicarEfeitos(character, {
        pedras: Math.round(40 * inimigo.rank * fator),
        reputacao: 20,
        alinhamento: -30,
        itens: [{ id: 'pilula-dourada', quantidade: 1 }],
        feitos: { mortes: 20, crueldades: 5 },
      }),
    );
    mensagens.push('Quem ouvir essa história vai pensar duas vezes antes de cruzar seu caminho.');
  } else {
    texto = vencidas === 0 ? 'Os guardas te repelem nos portões.' : `Você chegou até ${ondas[vencidas].titulo.toLowerCase()} antes de ser obrigado a fugir.`;
    mensagens.push(...aplicarEfeitos(character, { reputacao: -3, flags: { quaseMorte: true } }));
  }

  return {
    texto,
    mensagens,
    log: [],
    final: character.vidaAtual <= 0,
    vitoria: vencidas === ondas.length,
    sucesso: vencidas === ondas.length,
    combate: encadearCombates(rodadas),
  };
}

/** A família se curva: vira vassala e paga tributo por estação. */
export function imporSubmissao(character: Character, inimigo: Relacao): string[] {
  if (motivoBloqueioSubmissao(character, inimigo)) return [];
  const familia = nomeDaFamilia(inimigo);
  inimigo.tipo = 'Vassalo';
  inimigo.nome = familia;
  inimigo.relacao = 30;
  character.reputacao += 10;
  return [
    `O Patriarca ${doFamilia(familia)} vem pessoalmente se ajoelhar. A rixa acabou: eles agora são seus vassalos.`,
    `Tributo: ${tributoDoVassalo(inimigo)} pedras por estação. Reputação +10.`,
  ];
}

export function tributoDoVassalo(vassalo: Relacao): number {
  return vassalo.rank * 2;
}
