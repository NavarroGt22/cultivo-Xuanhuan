import type { Character } from './character';
import type { StoryState } from './story';
import { rosterDaSeita } from './worldState';
import { ehDiscipulo } from './sect';
import { aplicarProgresso } from './cultivation';
import { shiftAlignment } from './alignment';
import { registrarJornada } from './journal';

/**
 * Mestre pessoal (Shifu). Um discípulo serve a um único mestre: só pode buscar outro
 * depois de se formar (alcançar o reino do mestre) ou rompendo com ele — o que traz desonra.
 */
export interface MestrePessoal {
  id: string;
  nome: string;
  seita: string;
  vinculo: number;
  ultimaLicao: number;
  /** 'seita' = ancião da sua seita; 'errante' = o velho de roupas gastas. Ausente = 'seita' (saves antigos). */
  origem?: 'seita' | 'errante';
  /** Reino do mestre errante (o ancião de seita é consultado no elenco). */
  rank?: number;
}

/** Capítulos (≈ 5 anos) em que nenhum mestre aceita quem renegou o anterior. */
export const CAPITULOS_DESONRA = 20;
const ID_ERRANTE = 'mestre-errante';

function ehErrante(m: MestrePessoal): boolean {
  return m.origem === 'errante';
}

function anciaoDoMestre(c: Character, h: StoryState, m: MestrePessoal) {
  return rosterDaSeita(h.mundo, c)?.membros.find((n) => n.id === m.id);
}

/** O discípulo já alcançou o reino do mestre: não há mais o que aprender. */
export function mestreSuperado(c: Character, h: StoryState): boolean {
  const m = c.mestrePessoal;
  if (!m) return false;
  if (ehErrante(m)) return c.cultivo.rank >= (m.rank ?? 0);
  const anciao = anciaoDoMestre(c, h, m);
  return Boolean(anciao && anciao.rank <= c.cultivo.rank);
}

/** O mestre ainda está ao seu alcance (o errante sempre está; o ancião, enquanto você for da seita dele). */
export function vinculoAtivo(c: Character, h: StoryState): boolean {
  const m = c.mestrePessoal;
  if (!m) return false;
  if (ehErrante(m)) return true;
  return ehDiscipulo(c) && m.seita === c.afiliacao.nome && Boolean(anciaoDoMestre(c, h, m));
}

export function emDesonra(c: Character, h: StoryState): boolean {
  return h.turno < Number(c.flags.renegouMestreAte ?? -1);
}

export function bloqueioMestre(c: Character, h: StoryState): string | null {
  if (h.desfecho?.final) return 'Esta vida já terminou.';
  if (c.mestrePessoal) {
    return `Você já é discípulo de ${c.mestrePessoal.nome}. Um discípulo não serve a dois mestres: só depois de se formar (alcançar o reino dele) ou de romper com ele.`;
  }
  if (emDesonra(c, h)) return 'Você renegou seu antigo mestre. Nenhum ancião aceita um discípulo desleal tão cedo.';
  if (!ehDiscipulo(c)) return 'Ingresse em uma seita para ter um mestre pessoal.';
  if (c.idadeMeses < 144) return 'Disponível a partir dos 12 anos.';
  if (c.contribuicao < 50) return 'Requer 50 pontos de contribuição (consumidos ao ser aceito).';
  return null;
}

export function tornarDiscipulo(c: Character, h: StoryState, id: string): string {
  const bloqueio = bloqueioMestre(c, h); if (bloqueio) return bloqueio;
  const membro = rosterDaSeita(h.mundo, c)?.membros.find(m => m.id === id && m.posto === 'Ancião' && m.rank > c.cultivo.rank);
  if (!membro) return 'Este ancião não pode orientar seu cultivo.';
  c.contribuicao -= 50;
  c.mestrePessoal = { id: membro.id, nome: membro.nome, seita: c.afiliacao.nome, vinculo: 20, ultimaLicao: -1, origem: 'seita' };
  const texto = `${membro.nome} aceita você como discípulo pessoal.`;
  registrarJornada(c, h, 'marco', 'Um novo Shifu', texto); return texto;
}

/** O velho de roupas gastas: um especialista escondido, três reinos acima de você quando te aceita. */
export function aceitarMestreErrante(c: Character, nome: string): string[] {
  if (c.mestrePessoal) return [];
  c.mestrePessoal = {
    id: ID_ERRANTE,
    nome,
    seita: 'Sem seita — um andarilho',
    vinculo: 30,
    ultimaLicao: -1,
    origem: 'errante',
    rank: Math.min(13, c.cultivo.rank + 3),
  };
  return [`${nome} agora é seu mestre (Shifu). Enquanto ele viver em você, nenhum outro mestre o aceitará como discípulo.`];
}

export function bloqueioLicao(c: Character, h: StoryState): string | null {
  if (h.desfecho?.final) return 'Esta vida já terminou.';
  const m = c.mestrePessoal;
  if (!m) return 'Você ainda não tem um mestre pessoal.';
  if (!ehErrante(m) && (!ehDiscipulo(c) || m.seita !== c.afiliacao.nome)) return 'Seu mestre pertence a outra seita. O vínculo está inativo.';
  if (mestreSuperado(c, h)) return 'Você alcançou o reino do seu mestre: não há mais o que ele possa ensinar. Despeça-se como discípulo formado.';
  if (!ehErrante(m) && !anciaoDoMestre(c, h, m)) return 'Seu mestre deixou a seita.';
  if (m.ultimaLicao === h.turno) return 'Você já recebeu orientação neste capítulo.';
  if (h.energia < 1) return 'Requer 1 de energia.';
  return null;
}

export function receberLicao(c: Character, h: StoryState): string {
  const bloqueio = bloqueioLicao(c, h); if (bloqueio) return bloqueio;
  const m = c.mestrePessoal!;
  h.energia -= 1; m.ultimaLicao = h.turno;
  m.vinculo = Math.min(100, m.vinculo + 5);
  const ganho = (ehErrante(m) ? 6 : 5) + Math.floor(m.vinculo / 20);
  const mensagens = aplicarProgresso(c.cultivo, ganho);
  c.cultivo.toxina = Math.max(0, c.cultivo.toxina - 2);
  const texto = `${m.nome} orienta sua circulação de qi: +${ganho} de progresso, −2 de toxina. Vínculo ${m.vinculo}/100. ${mensagens.join(' ')}`;
  registrarJornada(c, h, 'atividade', 'Ensinamentos do Shifu', texto); return texto;
}

/** Texto do botão de saída: formar-se com honra ou romper com o mestre. */
export function tipoDeSaida(c: Character, h: StoryState): 'formar' | 'romper' | 'desligar' {
  if (mestreSuperado(c, h)) return 'formar';
  return vinculoAtivo(c, h) ? 'romper' : 'desligar';
}

export function deixarMestre(c: Character, h: StoryState): string {
  if (h.desfecho?.final) return 'Esta vida já terminou.';
  const m = c.mestrePessoal;
  if (!m) return 'Nenhum vínculo a encerrar.';
  const saida = tipoDeSaida(c, h);
  let texto: string;
  if (saida === 'formar') {
    c.flags.mestreFormado = m.nome;
    c.reputacao += 5;
    texto = `Você se ajoelha uma última vez diante de ${m.nome}. "Não tenho mais nada para te ensinar." Você se forma como discípulo com honra (reputação +5) e pode buscar um novo mestre.`;
  } else if (saida === 'romper') {
    c.alinhamento = shiftAlignment(c.alinhamento, -10);
    c.reputacao -= 15;
    c.flags.renegouMestreAte = h.turno + CAPITULOS_DESONRA;
    texto = `Você renega ${m.nome} antes de aprender tudo. A notícia corre: reputação −15, alinhamento −10, e nenhum mestre aceitará você pelos próximos anos.`;
  } else {
    texto = `O vínculo com ${m.nome} já não existia na prática. Você encerra o discipulado sem desonra.`;
  }
  delete c.mestrePessoal;
  registrarJornada(c, h, 'marco', saida === 'formar' ? 'Discípulo formado' : saida === 'romper' ? 'Um mestre renegado' : 'Um caminho próprio', texto);
  return texto;
}
