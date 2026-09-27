import { Character, getEffectiveAttributes } from './character';
import { attributeCheck } from './dice';
import { aplicarEfeitos } from './effects';
import { ItemQuantidade, addItem, addPedrasEspirituais, quantidadeItem, removerItem } from './inventory';
import { getConsumivel, idComQualidade, nomeItem } from './items';
import { REGIOES } from './world';
import { QUALIDADES, indiceQualidadePorMargem } from './quality';
import { registrarFeito } from './lifeTraits';

/** Custo de energia de uma tentativa de refino ou gravação. */
export const ENERGIA_REFINO = 1;

export type Oficio = 'alquimia' | 'inscricao';

export interface Receita {
  id: string;
  oficio: Oficio;
  ordem: number;
  nivelMinimo: number;
  custoPedras: number;
  dificuldade: number;
  /** Ervas por idade e núcleos exigidos (GDD 4: ervas de séculos para Ordens altas). */
  ingredientes?: ItemQuantidade[];
}

/** GDD 4: a dificuldade dispara a cada Ordem; cada nível no ofício tira 2. */
function pilula(id: string, ordem: number, custoPedras: number, ingredientes: ItemQuantidade[]): Receita {
  return { id, oficio: 'alquimia', ordem, nivelMinimo: ordem, custoPedras, dificuldade: 8 + ordem * 5, ingredientes };
}

const erva = (quantidade: number): ItemQuantidade => ({ id: 'erva-espiritual', quantidade });
const erva500 = (quantidade: number): ItemQuantidade => ({ id: 'erva-500-anos', quantidade });
const erva1000 = (quantidade: number): ItemQuantidade => ({ id: 'erva-1000-anos', quantidade });
const nucleo = (quantidade: number): ItemQuantidade => ({ id: 'nucleo-besta', quantidade });

export const RECEITAS: Receita[] = [
  { id: 'pilula-cura', oficio: 'alquimia', ordem: 1, nivelMinimo: 1, custoPedras: 2, dificuldade: 11 },
  { id: 'pilula-chakra', oficio: 'alquimia', ordem: 1, nivelMinimo: 1, custoPedras: 3, dificuldade: 13 },
  { id: 'pilula-purificacao', oficio: 'alquimia', ordem: 1, nivelMinimo: 1, custoPedras: 4, dificuldade: 15 },
  { id: 'pilula-dourada', oficio: 'alquimia', ordem: 2, nivelMinimo: 2, custoPedras: 12, dificuldade: 20 },
  pilula('pilula-fundacao', 2, 8, [erva(1)]),
  pilula('pilula-mil-passaros', 3, 20, [erva(2), nucleo(1)]),
  pilula('pilula-cura-maior', 3, 18, [erva(2)]),
  pilula('pilula-rompe-barreira', 4, 35, [erva500(1), erva(2)]),
  pilula('pilula-explosao-origem', 5, 60, [erva500(2), nucleo(2)]),
  pilula('pilula-purificacao-celestial', 5, 50, [erva500(1), erva(3)]),
  pilula('pilula-osso-jade', 6, 100, [erva500(2), nucleo(3)]),
  pilula('pilula-alma-clara', 6, 100, [erva500(3)]),
  pilula('pilula-renascer-orgaos', 7, 160, [erva1000(1), erva500(2)]),
  pilula('pilula-medula-celestial', 7, 140, [erva1000(1), nucleo(3)]),
  pilula('pilula-juventude', 7, 200, [erva1000(2)]),
  pilula('pilula-transformar-raiz', 8, 300, [erva1000(2), nucleo(5)]),
  pilula('pilula-osso-celestial-imperador', 9, 500, [erva1000(3), erva500(3)]),
  pilula('pilula-divina', 10, 1000, [erva1000(5), nucleo(10)]),
  { id: 'talisma-combate', oficio: 'inscricao', ordem: 1, nivelMinimo: 1, custoPedras: 2, dificuldade: 12 },
  { id: 'talisma-escudo', oficio: 'inscricao', ordem: 1, nivelMinimo: 1, custoPedras: 3, dificuldade: 14 },
];

/** GDD 4: a fornalha precisa ser de Ordem igual ou maior que a pílula. Quem nunca comprou uma usa a básica (2ª Ordem). */
export function ordemFornalha(character: Character): number {
  return character.fornalha ?? 2;
}

/** Ingrediente que dá +2 no teste: ervas na alquimia, núcleos de besta (tinta) na inscrição. */
export const INGREDIENTE_BONUS: Record<Oficio, string> = {
  alquimia: 'erva-espiritual',
  inscricao: 'nucleo-besta',
};

/** GDD 7: qualidade de inscrição. Mais qualidade = mais talismãs por gravação. */
const QUALIDADE_INSCRICAO = ['Bronze', 'Prata', 'Ouro'];

export function nivelOficio(character: Character, oficio: Oficio): number {
  return character.profissoes[oficio].nivel;
}

/** Cada nível no ofício reduz a dificuldade em 2; o ingrediente opcional dá +2. */
export function dificuldadeReceita(character: Character, receita: Receita, usarIngrediente: boolean): number {
  return receita.dificuldade - nivelOficio(character, receita.oficio) * 2 - (usarIngrediente ? 2 : 0);
}

export function motivoBloqueioReceita(character: Character, receita: Receita, usarIngrediente: boolean): string | null {
  if (nivelOficio(character, receita.oficio) < receita.nivelMinimo) return `Requer nível ${receita.nivelMinimo} no ofício`;
  if (receita.oficio === 'alquimia' && ordemFornalha(character) < receita.ordem) return `Requer fornalha de ${receita.ordem}ª Ordem (Mercado)`;
  if (character.inventario.pedrasEspirituais < receita.custoPedras) return `Requer ${receita.custoPedras} pedras`;
  const falta = receita.ingredientes?.find((i) => quantidadeItem(character.inventario, i.id) < i.quantidade);
  if (falta) return `Falta ${falta.quantidade}× ${nomeItem(falta.id)}`;
  if (usarIngrediente && quantidadeItem(character.inventario, INGREDIENTE_BONUS[receita.oficio]) === 0) {
    return `Sem ${nomeItem(INGREDIENTE_BONUS[receita.oficio])}`;
  }
  return null;
}

/** A margem sobre a dificuldade vira anéis (pílulas, GDD 4) ou qualidade (talismãs, GDD 7): 1 a 3 unidades. */
export function refinar(character: Character, receita: Receita, usarIngrediente: boolean): string[] {
  if (motivoBloqueioReceita(character, receita, usarIngrediente)) return [];

  addPedrasEspirituais(character.inventario, -receita.custoPedras);
  if (usarIngrediente) removerItem(character.inventario, INGREDIENTE_BONUS[receita.oficio], 1);
  for (const i of receita.ingredientes ?? []) removerItem(character.inventario, i.id, i.quantidade);

  const inteligencia = getEffectiveAttributes(character).inteligencia;
  const dificuldade = dificuldadeReceita(character, receita, usarIngrediente);
  const teste = attributeCheck(inteligencia, dificuldade);
  const nomeTeste = receita.oficio === 'alquimia' ? 'Controle de chama' : 'Traço do pincel';
  const resumo = `${nomeTeste}: ${teste.roll} + ${inteligencia} = ${teste.total} (dificuldade ${dificuldade}).`;

  if (!teste.success) {
    const mensagens = [resumo, receita.oficio === 'alquimia' ? 'A mistura vira carvão.' : 'Um traço torto, e o papel vira cinza.'];
    if (teste.criticalFailure) {
      mensagens.push(receita.oficio === 'alquimia' ? 'A fornalha explode!' : 'A energia volta pelo pincel!', ...aplicarEfeitos(character, { danoPercentual: 25 }));
    }
    mensagens.push(...aplicarEfeitos(character, { xpProfissao: { [receita.oficio]: 5 * receita.ordem } }));
    return mensagens;
  }

  const margem = teste.total - dificuldade;

  if (receita.oficio === 'alquimia') {
    const pureza = indiceQualidadePorMargem(margem);
    const quantidade = receita.ordem <= 3 && margem >= 8 ? 2 : 1;
    const id = idComQualidade(receita.id, pureza);
    addItem(character.inventario, id, quantidade);
    registrarFeito(character, 'pilulas', quantidade);
    const mensagens = [
      resumo,
      `Sucesso! Núcleo de ${pureza + 1} anel(éis) — pureza ${QUALIDADES[pureza].nome}: ${quantidade}× ${nomeItem(id)}.`,
    ];
    if (receita.ordem >= 9) {
      mensagens.push(
        receita.ordem === 10
          ? 'O céu escurece e nove raios caem sobre a fornalha: uma Pílula Divina nasceu. Esta era vai lembrar do seu nome.'
          : 'Uma pílula de 9ª Ordem! A notícia corre de clã em clã.',
        ...aplicarEfeitos(character, { reputacao: receita.ordem === 10 ? 100 : 30 }),
      );
    }
    mensagens.push(...aplicarEfeitos(character, { xpProfissao: { alquimia: 20 * receita.ordem + 15 * pureza } }));
    return mensagens;
  }

  const quantidade = 1 + (margem >= 5 ? 1 : 0) + (margem >= 10 ? 1 : 0);
  addItem(character.inventario, receita.id, quantidade);
  return [
    resumo,
    `Sucesso! Qualidade ${QUALIDADE_INSCRICAO[quantidade - 1]}: ${quantidade}× ${nomeItem(receita.id)}.`,
    ...aplicarEfeitos(character, { xpProfissao: { [receita.oficio]: 20 * receita.ordem + 10 * quantidade } }),
  ];
}

/** A fama no ofício valoriza o que você produz: +15% por nível. */
export function precoVenda(character: Character, itemId: string): number {
  const base = getConsumivel(itemId)?.valor ?? 0;
  const oficio: Oficio | null = itemId.startsWith('pilula-') ? 'alquimia' : itemId.startsWith('talisma-') ? 'inscricao' : null;
  const bonus = oficio ? 1 + nivelOficio(character, oficio) * 0.15 : 1;
  return Math.max(1, Math.round(base * bonus * REGIOES[character.local.regiao].fatorPoder));
}

export function venderItem(character: Character, itemId: string, quantidade = 1): string[] {
  const preco = precoVenda(character, itemId);
  if (!removerItem(character.inventario, itemId, quantidade)) return [];
  addPedrasEspirituais(character.inventario, preco * quantidade);
  return [`Vendeu ${quantidade}× ${nomeItem(itemId)} por ${preco * quantidade} pedras.`];
}

export function precoArtefato(character: Character, indiceBolsa: number): number {
  const item = character.inventario.equipamentos[indiceBolsa];
  if (!item) return 0;
  const qualidade = QUALIDADES.find((q) => q.nome === item.qualidade)?.multiplicador ?? 1;
  return Math.round(item.grau * 10 * qualidade * REGIOES[character.local.regiao].fatorPoder);
}

export function venderArtefato(character: Character, indiceBolsa: number): string[] {
  const item = character.inventario.equipamentos[indiceBolsa];
  if (!item) return [];
  const preco = precoArtefato(character, indiceBolsa);
  character.inventario.equipamentos.splice(indiceBolsa, 1);
  addPedrasEspirituais(character.inventario, preco);
  return [`Vendeu ${item.nome} por ${preco} pedras.`];
}
