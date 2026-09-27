import { Character } from './character';
import { EQUIPMENT_CATALOG, Equipment } from './equipment';
import { addItem, addPedrasEspirituais } from './inventory';
import { nomeItem } from './items';
import { REINOS } from './cultivation';
import { REGIOES } from './world';
import { descontoMercador } from './merchantGroups';

/**
 * Mercado (Sistema de Vida — Moradias, Montarias e Transportes; GDD 4 — fornalhas).
 * Tudo que se compra com pedras espirituais e fica com você: casa, montaria, fornalha, armas e suprimentos.
 */

export type Raridade = 'Bronze' | 'Prata' | 'Ouro' | 'Ouro Negro' | 'Lendário';

export interface Moradia {
  id: string;
  nome: string;
  classe: string;
  raridade: Raridade;
  preco: number;
  /** Pedras por estação. */
  manutencao: number;
  /** Reputação ganha ao se mudar. */
  prestigio: number;
  /** Bônus somado ao cultivo passivo (densidade espiritual). */
  densidade: number;
  /** Fração de ataques de vingadores e ladrões que as formações da casa evitam. */
  seguranca: number;
  rankMinimo: number;
  descricao: string;
}

export const MORADIAS: Moradia[] = [
  { id: 'quarto-estalagem', nome: 'Quarto Alugado em Estalagem', classe: 'Básica', raridade: 'Bronze', preco: 20, manutencao: 1, prestigio: 0, densidade: 0.02, seguranca: 0, rankMinimo: 1, descricao: 'Uma cama, uma janela e o barulho da taverna embaixo.' },
  { id: 'cabana-pescador', nome: 'Cabana de Pescador', classe: 'Básica', raridade: 'Bronze', preco: 45, manutencao: 1, prestigio: 1, densidade: 0.04, seguranca: 0.05, rankMinimo: 1, descricao: 'À beira d\'água, onde o qi do rio passa devagar.' },
  { id: 'residencia-distrito', nome: 'Residência de Distrito', classe: 'Classe Média', raridade: 'Prata', preco: 150, manutencao: 3, prestigio: 3, densidade: 0.06, seguranca: 0.1, rankMinimo: 1, descricao: 'Pátio próprio para treinar e vizinhos respeitáveis.' },
  { id: 'sobrado-comerciante', nome: 'Sobrado de Comerciante', classe: 'Classe Média', raridade: 'Prata', preco: 320, manutencao: 5, prestigio: 5, densidade: 0.08, seguranca: 0.15, rankMinimo: 2, descricao: 'Dois andares, um cofre e uma formação de alarme.' },
  { id: 'mansao-anciao', nome: 'Mansão de Ancião', classe: 'Classe Alta', raridade: 'Ouro', preco: 1200, manutencao: 12, prestigio: 12, densidade: 0.14, seguranca: 0.25, rankMinimo: 3, descricao: 'Jardins de ervas, sala de meditação e criados discretos.' },
  { id: 'vila-montanha', nome: 'Vila de Retiro na Montanha', classe: 'Classe Alta', raridade: 'Ouro', preco: 2500, manutencao: 20, prestigio: 18, densidade: 0.22, seguranca: 0.3, rankMinimo: 4, descricao: 'Sobre uma pequena veia espiritual, longe de olhos curiosos.' },
  { id: 'propriedade-lago', nome: 'Propriedade à Beira do Lago Espiritual', classe: 'Classe Alta', raridade: 'Ouro Negro', preco: 6000, manutencao: 40, prestigio: 30, densidade: 0.32, seguranca: 0.35, rankMinimo: 5, descricao: 'O lago brilha à noite; peixes espirituais saltam sob a lua.' },
  { id: 'palacio-patriarca', nome: 'Palácio de Patriarca', classe: 'Luxo', raridade: 'Ouro Negro', preco: 15000, manutencao: 90, prestigio: 50, densidade: 0.42, seguranca: 0.5, rankMinimo: 6, descricao: 'Muralhas com formações de defesa e salões para receber seitas inteiras.' },
  { id: 'dominio-espacial', nome: 'Domínio Espacial Pessoal', classe: 'Luxo', raridade: 'Lendário', preco: 40000, manutencao: 180, prestigio: 80, densidade: 0.55, seguranca: 0.7, rankMinimo: 7, descricao: 'Um bolso dimensional só seu. Ninguém entra sem ser convidado.' },
  { id: 'torre-celestial', nome: 'Torre Celestial', classe: 'Luxo', raridade: 'Lendário', preco: 90000, manutencao: 350, prestigio: 120, densidade: 0.7, seguranca: 0.6, rankMinimo: 8, descricao: 'Toca as nuvens. A energia do céu desce direto para o seu quarto.' },
];

export interface Montaria {
  id: string;
  nome: string;
  classe: string;
  raridade: Raridade;
  preco: number;
  manutencao: number;
  prestigio: number;
  /** Desconto no custo de viagem entre regiões. */
  desconto: number;
  /** Voar evita emboscadas na estrada. */
  voadora: boolean;
  /** Bônus no preço de venda nas Rotas Comerciais (carga maior, frete barato). */
  comercio: number;
  rankMinimo: number;
  descricao: string;
}

export const MONTARIAS: Montaria[] = [
  { id: 'mula', nome: 'Mula de Carga', classe: 'Econômica', raridade: 'Bronze', preco: 25, manutencao: 1, prestigio: 0, desconto: 0.2, voadora: false, comercio: 0.05, rankMinimo: 1, descricao: 'Teimosa, mas leva o dobro do que você carrega.' },
  { id: 'cavalo', nome: 'Cavalo Comum', classe: 'Econômica', raridade: 'Bronze', preco: 60, manutencao: 2, prestigio: 1, desconto: 0.3, voadora: false, comercio: 0, rankMinimo: 1, descricao: 'Semanas de estrada viram dias.' },
  { id: 'barco-vela', nome: 'Barco a Vela', classe: 'Intermediária', raridade: 'Prata', preco: 140, manutencao: 3, prestigio: 2, desconto: 0.3, voadora: false, comercio: 0.12, rankMinimo: 1, descricao: 'Pelos rios entre as regiões, com o porão cheio de mercadoria.' },
  { id: 'cavalo-raca', nome: 'Cavalo de Boa Raça', classe: 'Intermediária', raridade: 'Prata', preco: 220, manutencao: 4, prestigio: 4, desconto: 0.4, voadora: false, comercio: 0, rankMinimo: 2, descricao: 'Crina brilhante e sangue de besta espiritual distante.' },
  { id: 'lobo-estepes', nome: 'Lobo das Estepes Domado', classe: 'Intermediária', raridade: 'Prata', preco: 380, manutencao: 6, prestigio: 6, desconto: 0.45, voadora: false, comercio: 0, rankMinimo: 2, descricao: 'Bandidos pensam duas vezes antes de parar um lobo desse tamanho.' },
  { id: 'espada-voadora-xuan', nome: 'Espada Voadora de Grau Xuan', classe: 'Luxo', raridade: 'Ouro', preco: 900, manutencao: 8, prestigio: 10, desconto: 0.6, voadora: true, comercio: 0, rankMinimo: 3, descricao: 'O sonho de todo discípulo: cruzar o céu de pé sobre a lâmina.' },
  { id: 'tigre-espiritual', nome: 'Tigre Espiritual Domado', classe: 'Luxo', raridade: 'Ouro', preco: 1500, manutencao: 12, prestigio: 14, desconto: 0.6, voadora: true, comercio: 0, rankMinimo: 3, descricao: 'Salta de nuvem em nuvem. Assusta até cultivadores.' },
  { id: 'barco-voador-seita', nome: 'Barco Voador de Seita', classe: 'Luxo', raridade: 'Ouro', preco: 2200, manutencao: 18, prestigio: 16, desconto: 0.7, voadora: true, comercio: 0.25, rankMinimo: 4, descricao: 'Um convés inteiro sobre as nuvens — e um porão enorme para comércio.' },
  { id: 'grifo-ancestral', nome: 'Grifo Ancestral', classe: 'Elite', raridade: 'Ouro Negro', preco: 6000, manutencao: 35, prestigio: 30, desconto: 0.8, voadora: true, comercio: 0.05, rankMinimo: 5, descricao: 'Mais rápido que o vento do Norte.' },
  { id: 'espada-voadora-ceu', nome: 'Espada Voadora de Grau Céu', classe: 'Elite', raridade: 'Ouro Negro', preco: 5500, manutencao: 30, prestigio: 28, desconto: 0.8, voadora: true, comercio: 0, rankMinimo: 5, descricao: 'Corta o céu como uma estrela cadente.' },
  { id: 'nuvem-lendaria', nome: 'Nuvem Voadora Lendária', classe: 'Elite', raridade: 'Lendário', preco: 15000, manutencao: 60, prestigio: 45, desconto: 0.9, voadora: true, comercio: 0.1, rankMinimo: 6, descricao: 'Uma nuvem que obedece. Dizem que o Imperador Estelar tinha uma igual.' },
  { id: 'iate-espiritual', nome: 'Iate Espiritual', classe: 'Especial', raridade: 'Lendário', preco: 25000, manutencao: 120, prestigio: 60, desconto: 0.85, voadora: true, comercio: 0.4, rankMinimo: 6, descricao: 'Embarcação voadora de luxo, com salões de chá e porões encantados.' },
  { id: 'barco-estelar', nome: 'Barco Estelar Recuperado', classe: 'Mítica', raridade: 'Lendário', preco: 50000, manutencao: 200, prestigio: 90, desconto: 1, voadora: true, comercio: 0.5, rankMinimo: 7, descricao: 'Tirado de um Mundo Perdido. Viaja entre regiões num piscar de olhos.' },
];

export interface Fornalha {
  ordem: number;
  nome: string;
  preco: number;
}

export const FORNALHAS: Fornalha[] = [
  { ordem: 3, nome: 'Fornalha de Bronze Negro (3ª Ordem)', preco: 120 },
  { ordem: 4, nome: 'Caldeirão de Ferro Estelar (4ª Ordem)', preco: 300 },
  { ordem: 5, nome: 'Fornalha das Cinco Chamas (5ª Ordem)', preco: 700 },
  { ordem: 6, nome: 'Caldeirão de Jade Verde (6ª Ordem)', preco: 1500 },
  { ordem: 7, nome: 'Fornalha do Fogo Terreno (7ª Ordem)', preco: 3500 },
  { ordem: 8, nome: 'Caldeirão do Dragão Adormecido (8ª Ordem)', preco: 8000 },
  { ordem: 9, nome: 'Fornalha do Céu e da Terra (9ª Ordem)', preco: 18000 },
  { ordem: 10, nome: 'Caldeirão Divino do Caos (10ª Ordem)', preco: 45000 },
];

export interface Suprimento {
  id: string;
  preco: number;
  rankMinimo: number;
}

export const SUPRIMENTOS: Suprimento[] = [
  { id: 'pilula-cura', preco: 5, rankMinimo: 1 },
  { id: 'pilula-chakra', preco: 8, rankMinimo: 1 },
  { id: 'pilula-purificacao', preco: 9, rankMinimo: 1 },
  { id: 'pilula-fundacao', preco: 25, rankMinimo: 2 },
  { id: 'pilula-cura-maior', preco: 60, rankMinimo: 3 },
  { id: 'erva-espiritual', preco: 6, rankMinimo: 1 },
  { id: 'erva-500-anos', preco: 50, rankMinimo: 3 },
  { id: 'erva-1000-anos', preco: 300, rankMinimo: 6 },
  { id: 'nucleo-besta', preco: 12, rankMinimo: 1 },
  { id: 'talisma-escudo', preco: 12, rankMinimo: 1 },
  { id: 'talisma-combate', preco: 10, rankMinimo: 1 },
];

const REVENDA = 0.5;

export function fatorRegional(character: Character): number {
  return REGIOES[character.local.regiao].fatorPoder;
}

export function getMoradia(id: string | null | undefined): Moradia | undefined {
  return MORADIAS.find((m) => m.id === id);
}

export function getMontaria(id: string | null | undefined): Montaria | undefined {
  return MONTARIAS.find((m) => m.id === id);
}

function bloqueioCompra(character: Character, preco: number, rankMinimo: number, desconto = 0): string | null {
  if (character.cultivo.rank < rankMinimo) return `Requer ${REINOS[rankMinimo - 1].nome}`;
  if (character.inventario.pedrasEspirituais + desconto < preco) return `Requer ${preco} pedras`;
  return null;
}

/** O que você recebe ao trocar de casa ou montaria (metade do preço de compra). */
export function valorRevenda(preco: number): number {
  return Math.floor(preco * REVENDA);
}

export function motivoBloqueioMoradia(character: Character, moradia: Moradia): string | null {
  if (character.moradia === moradia.id) return 'Você já mora aqui';
  const atual = getMoradia(character.moradia);
  return bloqueioCompra(character, precoComDesconto(character, moradia.preco), moradia.rankMinimo, atual ? valorRevenda(atual.preco) : 0);
}

export function comprarMoradia(character: Character, moradia: Moradia): string[] {
  if (motivoBloqueioMoradia(character, moradia)) return [];
  const mensagens: string[] = [];
  const atual = getMoradia(character.moradia);
  if (atual) {
    addPedrasEspirituais(character.inventario, valorRevenda(atual.preco));
    mensagens.push(`Vendeu ${atual.nome} por ${valorRevenda(atual.preco)} pedras.`);
  }
  addPedrasEspirituais(character.inventario, -precoComDesconto(character, moradia.preco));
  character.moradia = moradia.id;
  character.reputacao += moradia.prestigio;
  mensagens.push(
    `Você se muda para ${moradia.nome} (${moradia.raridade}) por ${precoComDesconto(character, moradia.preco)} pedras.`,
    `Cultivo passivo +${Math.round(moradia.densidade * 100)}% · manutenção ${moradia.manutencao} pedras/estação${moradia.prestigio ? ` · reputação +${moradia.prestigio}` : ''}.`,
  );
  return mensagens;
}

export function motivoBloqueioMontaria(character: Character, montaria: Montaria): string | null {
  if (character.montaria === montaria.id) return 'Já é sua';
  const atual = getMontaria(character.montaria);
  return bloqueioCompra(character, precoComDesconto(character, montaria.preco), montaria.rankMinimo, atual ? valorRevenda(atual.preco) : 0);
}

export function comprarMontaria(character: Character, montaria: Montaria): string[] {
  if (motivoBloqueioMontaria(character, montaria)) return [];
  const mensagens: string[] = [];
  const atual = getMontaria(character.montaria);
  if (atual) {
    addPedrasEspirituais(character.inventario, valorRevenda(atual.preco));
    mensagens.push(`Vendeu ${atual.nome} por ${valorRevenda(atual.preco)} pedras.`);
  }
  addPedrasEspirituais(character.inventario, -precoComDesconto(character, montaria.preco));
  character.montaria = montaria.id;
  character.reputacao += montaria.prestigio;
  mensagens.push(
    `${montaria.nome} (${montaria.raridade}) agora é sua, por ${precoComDesconto(character, montaria.preco)} pedras.`,
    `Viagens ${Math.round(montaria.desconto * 100)}% mais baratas${montaria.voadora ? ', sem emboscadas na estrada' : ''}${montaria.comercio ? `, +${Math.round(montaria.comercio * 100)}% nas vendas das Rotas Comerciais` : ''}.`,
  );
  return mensagens;
}

export function motivoBloqueioFornalha(character: Character, fornalha: Fornalha): string | null {
  if ((character.fornalha ?? 2) >= fornalha.ordem) return 'Sua fornalha já é desta Ordem ou maior';
  if (character.profissoes.alquimia.nivel === 0) return 'Só alquimistas sabem usar';
  return bloqueioCompra(character, precoComDesconto(character, fornalha.preco), 1);
}

export function comprarFornalha(character: Character, fornalha: Fornalha): string[] {
  if (motivoBloqueioFornalha(character, fornalha)) return [];
  addPedrasEspirituais(character.inventario, -precoComDesconto(character, fornalha.preco));
  character.fornalha = fornalha.ordem;
  return [`Você compra a ${fornalha.nome} por ${precoComDesconto(character, fornalha.preco)} pedras. Agora pode refinar pílulas até a ${fornalha.ordem}ª Ordem.`];
}

/** Armas e armaduras à venda: até o 3º grau em qualquer loja; 4º e 5º no Pavilhão de Tesouros, para quem tem fama. */
export function equipamentosAVenda(): Equipment[] {
  return EQUIPMENT_CATALOG.filter((e) => e.grau >= 1 && e.grau <= 5 && e.id !== 'espada-sabio' && e.id !== 'fornalha-bronze');
}

export function precoEquipamento(character: Character, equipamento: Equipment): number {
  return precoComDesconto(character, Math.round(equipamento.grau * equipamento.grau * 20 * fatorRegional(character)));
}

/** Reputação com os grandes grupos mercadores dá desconto em tudo o que se compra aqui. */
export function precoComDesconto(character: Character, preco: number): number {
  return Math.round(preco * (1 - descontoMercador(character)));
}

export function motivoBloqueioEquipamento(character: Character, equipamento: Equipment): string | null {
  if (equipamento.grau === 4 && character.reputacao < 60) return 'Pavilhão de Tesouros: requer reputação 60';
  if (equipamento.grau === 5 && character.reputacao < 150) return 'Pavilhão de Tesouros: requer reputação 150';
  return bloqueioCompra(character, precoEquipamento(character, equipamento), Math.max(1, equipamento.grau - 1));
}

export function comprarEquipamento(character: Character, equipamento: Equipment): string[] {
  if (motivoBloqueioEquipamento(character, equipamento)) return [];
  const preco = precoEquipamento(character, equipamento);
  addPedrasEspirituais(character.inventario, -preco);
  character.inventario.equipamentos.push({ ...equipamento, bonusAtributos: { ...equipamento.bonusAtributos } });
  return [`Comprou ${equipamento.nome} por ${preco} pedras. Está na bolsa (Inventário) para equipar.`];
}

export function precoSuprimento(character: Character, suprimento: Suprimento): number {
  return Math.max(1, precoComDesconto(character, Math.round(suprimento.preco * fatorRegional(character))));
}

export function motivoBloqueioSuprimento(character: Character, suprimento: Suprimento, quantidade: number): string | null {
  return bloqueioCompra(character, precoSuprimento(character, suprimento) * quantidade, suprimento.rankMinimo);
}

export function comprarSuprimento(character: Character, suprimento: Suprimento, quantidade: number): string[] {
  if (motivoBloqueioSuprimento(character, suprimento, quantidade)) return [];
  const total = precoSuprimento(character, suprimento) * quantidade;
  addPedrasEspirituais(character.inventario, -total);
  addItem(character.inventario, suprimento.id, quantidade);
  return [`Comprou ${quantidade}× ${nomeItem(suprimento.id)} por ${total} pedras.`];
}

/** Manutenção de casa e montaria. Sem pedras, o bem é penhorado. */
export function processarPatrimonio(character: Character, estacoes: number): string[] {
  const mensagens: string[] = [];
  for (const [bem, remover] of [
    [getMoradia(character.moradia), () => (character.moradia = null)],
    [getMontaria(character.montaria), () => (character.montaria = null)],
  ] as [Moradia | Montaria | undefined, () => void][]) {
    if (!bem || bem.manutencao === 0) continue;
    const custo = bem.manutencao * estacoes;
    if (character.inventario.pedrasEspirituais >= custo) {
      addPedrasEspirituais(character.inventario, -custo);
    } else {
      const devolvido = Math.floor(bem.preco * 0.3);
      remover();
      addPedrasEspirituais(character.inventario, devolvido);
      mensagens.push(`Sem pedras para a manutenção, ${bem.nome} foi penhorado(a). Você recebeu ${devolvido} pedras.`);
    }
  }
  return mensagens;
}

export function bonusCultivoMoradia(character: Character): number {
  return getMoradia(character.moradia)?.densidade ?? 0;
}

export function descontoViagem(character: Character): number {
  return getMontaria(character.montaria)?.desconto ?? 0;
}

export function bonusComercio(character: Character): number {
  return getMontaria(character.montaria)?.comercio ?? 0;
}

/** Multiplicador do peso de emboscadas na estrada: quem voa quase nunca é parado. */
export function fatorEmboscada(character: Character): number {
  return getMontaria(character.montaria)?.voadora ? 0.3 : 1;
}

/** Multiplicador do peso de ataques em casa (vingadores, ladrões). */
export function fatorSegurancaCasa(character: Character): number {
  return 1 - (getMoradia(character.moradia)?.seguranca ?? 0);
}
