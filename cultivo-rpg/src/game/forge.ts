import { Attributes } from './attributes';
import { Character, getEffectiveAttributes } from './character';
import { attributeCheck } from './dice';
import { aplicarEfeitos } from './effects';
import { Equipment, EquipmentType } from './equipment';
import { ItemQuantidade, addPedrasEspirituais, quantidadeItem, removerItem } from './inventory';
import { nomeItem } from './items';
import { QUALIDADES } from './quality';

/**
 * GDD 5 — Mestre Refinador. Forja armas, armaduras e acessórios com materiais das Rotas Comerciais
 * e núcleos de besta. A qualidade segue a escala universal do Sistema de Vida:
 * Bronze ×1 · Prata ×1,2 · Ouro ×1,5 · Ouro Negro ×2 · Lendário ×3 (multiplica os bônus da peça).
 */
export const ENERGIA_FORJA = 1;

export { QUALIDADES };

export interface ReceitaForja {
  id: string;
  nome: string;
  tipo: EquipmentType;
  grau: number;
  nivelMinimo: number;
  bonus: Partial<Attributes>;
  materiais: ItemQuantidade[];
  custoPedras: number;
  dificuldade: number;
  descricao: string;
}

export const RECEITAS_FORJA: ReceitaForja[] = [
  {
    id: 'espada-aco-espiritual', nome: 'Espada de Aço Espiritual', tipo: 'arma', grau: 2, nivelMinimo: 1,
    bonus: { forca: 2, destreza: 1 }, materiais: [{ id: 'minerio-estelar', quantidade: 1 }], custoPedras: 12, dificuldade: 18,
    descricao: 'Lâmina equilibrada para o Caminho da Espada.',
  },
  {
    id: 'lanca-ferro-negro', nome: 'Lança de Ferro Negro', tipo: 'arma', grau: 2, nivelMinimo: 1,
    bonus: { forca: 2, constituicao: 1 }, materiais: [{ id: 'minerio-estelar', quantidade: 1 }], custoPedras: 12, dificuldade: 18,
    descricao: 'Pesada e firme, feita para a Lança do Dragão Firme.',
  },
  {
    id: 'manoplas-presa', nome: 'Manoplas de Presa de Besta', tipo: 'arma', grau: 2, nivelMinimo: 1,
    bonus: { forca: 1, constituicao: 2 }, materiais: [{ id: 'nucleo-besta', quantidade: 2 }], custoPedras: 8, dificuldade: 18,
    descricao: 'Para o Punho Marcial: presas de besta cravadas no couro.',
  },
  {
    id: 'adagas-presa', nome: 'Adagas de Presa de Besta', tipo: 'arma', grau: 2, nivelMinimo: 1,
    bonus: { destreza: 2, sorte: 1 }, materiais: [{ id: 'nucleo-besta', quantidade: 2 }], custoPedras: 8, dificuldade: 18,
    descricao: 'Leves e cruéis, para a Sombra Veloz.',
  },
  {
    id: 'leque-bambu', nome: 'Leque de Bambu Espiritual', tipo: 'arma', grau: 2, nivelMinimo: 1,
    bonus: { inteligencia: 2, destreza: 1 }, materiais: [{ id: 'bambu-espiritual', quantidade: 2 }], custoPedras: 8, dificuldade: 18,
    descricao: 'Varetas de bambu espiritual que conduzem o qi como seda.',
  },
  {
    id: 'armadura-escamas-forjada', nome: 'Armadura de Escamas Forjadas', tipo: 'armadura', grau: 2, nivelMinimo: 1,
    bonus: { constituicao: 2, destreza: 1 }, materiais: [{ id: 'nucleo-besta', quantidade: 1 }, { id: 'minerio-estelar', quantidade: 1 }], custoPedras: 15, dificuldade: 19,
    descricao: 'Escamas de besta presas em malha de minério estelar.',
  },
  {
    id: 'manto-areia-dourada', nome: 'Manto Tingido de Areia Dourada', tipo: 'armadura', grau: 3, nivelMinimo: 2,
    bonus: { destreza: 2, espirito: 2 }, materiais: [{ id: 'pigmento-dourado', quantidade: 2 }, { id: 'bambu-espiritual', quantidade: 1 }], custoPedras: 25, dificuldade: 22,
    descricao: 'Tecido espiritual tingido com o pigmento raro do Oeste.',
  },
  {
    id: 'anel-nucleo', nome: 'Anel de Núcleo Espiritual', tipo: 'acessorio', grau: 3, nivelMinimo: 2,
    bonus: { espirito: 2, sorte: 1 }, materiais: [{ id: 'nucleo-besta', quantidade: 2 }, { id: 'erva-jade-sul', quantidade: 1 }], custoPedras: 25, dificuldade: 22,
    descricao: 'Um núcleo de besta lapidado e selado com erva de jade.',
  },
  {
    id: 'amuleto-elixir', nome: 'Amuleto de Elixir Cristalizado', tipo: 'acessorio', grau: 3, nivelMinimo: 2,
    bonus: { constituicao: 1, inteligencia: 2 }, materiais: [{ id: 'elixir-refinado', quantidade: 1 }, { id: 'minerio-estelar', quantidade: 1 }], custoPedras: 25, dificuldade: 22,
    descricao: 'Elixir da Planície Central cristalizado dentro de metal estelar.',
  },
  {
    id: 'espada-estelar', nome: 'Espada Estelar', tipo: 'arma', grau: 4, nivelMinimo: 3,
    bonus: { forca: 4, espirito: 2 }, materiais: [{ id: 'minerio-estelar', quantidade: 3 }, { id: 'nucleo-besta', quantidade: 2 }], custoPedras: 70, dificuldade: 27,
    descricao: 'Forjada no calor de uma estrela caída. Obra de Mestre Refinador.',
  },
  {
    id: 'armadura-ceu', nome: 'Armadura do Céu Azul', tipo: 'armadura', grau: 4, nivelMinimo: 3,
    bonus: { constituicao: 4, espirito: 2 }, materiais: [{ id: 'minerio-estelar', quantidade: 2 }, { id: 'pigmento-dourado', quantidade: 2 }, { id: 'nucleo-besta', quantidade: 2 }], custoPedras: 80, dificuldade: 28,
    descricao: 'Placas leves como nuvem e duras como montanha.',
  },
];

export function nivelForja(character: Character): number {
  return character.profissoes.refinador.nivel;
}

/** Forjar usa braço e cabeça: média de Força e Inteligência, +2 por nível de forja. */
export function valorDeForja(character: Character): number {
  const a = getEffectiveAttributes(character);
  return Math.round((a.forca + a.inteligencia) / 2) + nivelForja(character) * 2;
}

export function motivoBloqueioForja(character: Character, receita: ReceitaForja): string | null {
  if (nivelForja(character) < receita.nivelMinimo) return `Requer Forja nível ${receita.nivelMinimo}`;
  if (character.inventario.pedrasEspirituais < receita.custoPedras) return `Requer ${receita.custoPedras} pedras`;
  const falta = receita.materiais.find((m) => quantidadeItem(character.inventario, m.id) < m.quantidade);
  if (falta) return `Falta ${falta.quantidade}× ${nomeItem(falta.id)}`;
  return null;
}

export function descreverMateriais(receita: ReceitaForja): string {
  return [...receita.materiais.map((m) => `${m.quantidade}× ${nomeItem(m.id)}`), `${receita.custoPedras} pedras`].join(', ');
}

/** Multiplica os bônus pela qualidade (arredondando, mínimo +1 em cada atributo da receita). */
function aplicarQualidade(bonus: Partial<Attributes>, multiplicador: number): Partial<Attributes> {
  const resultado: Partial<Attributes> = {};
  for (const [chave, valor] of Object.entries(bonus) as [keyof Attributes, number][]) {
    resultado[chave] = Math.max(1, Math.round(valor * multiplicador));
  }
  return resultado;
}

export function forjar(character: Character, receita: ReceitaForja): string[] {
  if (motivoBloqueioForja(character, receita)) return [];

  addPedrasEspirituais(character.inventario, -receita.custoPedras);
  for (const m of receita.materiais) removerItem(character.inventario, m.id, m.quantidade);

  const valor = valorDeForja(character);
  const teste = attributeCheck(valor, receita.dificuldade);
  const resumo = `Forja: ${teste.roll} + ${valor} = ${teste.total} (dificuldade ${receita.dificuldade}).`;

  if (!teste.success) {
    const mensagens = [resumo, 'O metal racha no último golpe do martelo. Materiais perdidos.'];
    mensagens.push(...aplicarEfeitos(character, { xpProfissao: { refinador: 5 * receita.grau } }));
    return mensagens;
  }

  const margem = teste.total - receita.dificuldade;
  const qualidade = [...QUALIDADES].reverse().find((q) => margem >= q.margem) ?? QUALIDADES[0];
  const peca: Equipment = {
    id: `forjado:${receita.id}:${Math.random().toString(36).slice(2, 8)}`,
    nome: `${receita.nome} (${qualidade.nome})`,
    tipo: receita.tipo,
    grau: receita.grau,
    descricao: `${receita.descricao} Forjada por ${character.nome}.`,
    bonusAtributos: aplicarQualidade(receita.bonus, qualidade.multiplicador),
    qualidade: qualidade.nome,
  };
  character.inventario.equipamentos.push(peca);

  const mensagens = [resumo, `Sucesso! Qualidade ${qualidade.nome}: ${peca.nome} foi para a bolsa.`];
  if (qualidade.nome === 'Lendário') {
    mensagens.push('Uma peça lendária! Cultivadores de toda a região vão querer ver.', ...aplicarEfeitos(character, { reputacao: 10 }));
  }
  mensagens.push(...aplicarEfeitos(character, { xpProfissao: { refinador: 20 * receita.grau + 10 * QUALIDADES.indexOf(qualidade) } }));
  return mensagens;
}
