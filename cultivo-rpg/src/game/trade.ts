import { Character, getEffectiveAttributes } from './character';
import { attributeCheck } from './dice';
import { addItem, addPedrasEspirituais, quantidadeItem, removerItem } from './inventory';
import { REGIOES, RegiaoId } from './world';
import { bonusComercio } from './market';

/** GDD 14.4 — Rotas Comerciais: cada região exporta um produto de assinatura. */
export interface ProdutoRegional {
  id: string;
  nome: string;
  regiao: RegiaoId;
  precoBase: number;
}

export const PRODUTOS_REGIONAIS: ProdutoRegional[] = [
  { id: 'minerio-estelar', nome: 'Minério Estelar do Norte', regiao: 'norte', precoBase: 10 },
  { id: 'elixir-refinado', nome: 'Elixir Refinado da Planície Central', regiao: 'central', precoBase: 14 },
  { id: 'erva-jade-sul', nome: 'Erva de Jade do Sul', regiao: 'sul', precoBase: 8 },
  { id: 'bambu-espiritual', nome: 'Bambu Espiritual do Leste', regiao: 'leste', precoBase: 7 },
  { id: 'pigmento-dourado', nome: 'Pigmento de Areia Dourada do Oeste', regiao: 'oeste', precoBase: 9 },
];

/** Imposto sobre vendas em cada região — o contrabando foge dele, com risco. */
export const IMPOSTO: Record<RegiaoId, number> = { central: 0.2, norte: 0.15, sul: 0.1, leste: 0.1, oeste: 0.05 };

/** Quanto vale longe de casa. */
const MARGEM_EXPORTACAO = 2.3;
const DIFICULDADE_CONTRABANDO = 14;

export function produtoDaRegiao(regiao: RegiaoId): ProdutoRegional {
  return PRODUTOS_REGIONAIS.find((p) => p.regiao === regiao) as ProdutoRegional;
}

export function getProduto(id: string): ProdutoRegional | undefined {
  return PRODUTOS_REGIONAIS.find((p) => p.id === id);
}

export function precoCompra(produto: ProdutoRegional): number {
  return produto.precoBase;
}

export function precoVendaProduto(character: Character, produto: ProdutoRegional, contrabando: boolean): number {
  const local = character.local.regiao;
  if (produto.regiao === local) return Math.max(1, Math.round(produto.precoBase * 0.8));
  const bruto = produto.precoBase * MARGEM_EXPORTACAO * (1 + bonusComercio(character));
  return Math.max(1, Math.round(contrabando ? bruto : bruto * (1 - IMPOSTO[local])));
}

export function comprarProduto(character: Character, quantidade = 1): string[] {
  const produto = produtoDaRegiao(character.local.regiao);
  const total = precoCompra(produto) * quantidade;
  if (character.inventario.pedrasEspirituais < total) return [`Faltam pedras (precisa de ${total}).`];
  addPedrasEspirituais(character.inventario, -total);
  addItem(character.inventario, produto.id, quantidade);
  return [`Comprou ${quantidade}× ${produto.nome} por ${total} pedras.`];
}

/** Vende todo o estoque de um produto. Contrabando: teste de Destreza; falhar = carga confiscada. */
export function venderProduto(character: Character, produto: ProdutoRegional, contrabando: boolean): string[] {
  const quantidade = quantidadeItem(character.inventario, produto.id);
  if (quantidade === 0) return [];
  const destreza = getEffectiveAttributes(character).destreza;

  if (contrabando && produto.regiao !== character.local.regiao) {
    const teste = attributeCheck(destreza, DIFICULDADE_CONTRABANDO);
    if (!teste.success) {
      removerItem(character.inventario, produto.id, quantidade);
      character.reputacao -= 3;
      return [`Contrabando: rolou ${teste.roll} + ${destreza} = ${teste.total} (dificuldade ${DIFICULDADE_CONTRABANDO}). Os fiscais confiscaram toda a carga!`];
    }
  }

  const preco = precoVendaProduto(character, produto, contrabando);
  removerItem(character.inventario, produto.id, quantidade);
  addPedrasEspirituais(character.inventario, preco * quantidade);
  const imposto = produto.regiao === character.local.regiao || contrabando ? '' : ` (imposto de ${Math.round(IMPOSTO[character.local.regiao] * 100)}% já descontado)`;
  return [`Vendeu ${quantidade}× ${produto.nome} por ${preco * quantidade} pedras${imposto}${contrabando ? ' — sem pagar imposto' : ''}.`];
}

export function descreverRota(regiao: RegiaoId): string {
  const produto = produtoDaRegiao(regiao);
  return `${REGIOES[regiao].nome}: exporta ${produto.nome} · imposto ${Math.round(IMPOSTO[regiao] * 100)}%`;
}
