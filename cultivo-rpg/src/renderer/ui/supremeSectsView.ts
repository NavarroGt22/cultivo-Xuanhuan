import type { Character } from '../../game/character';
import { REGIOES } from '../../game/world';
import { SUPREMAS, SupremaInfo, fatorPrecoSupremas, nivelReputacao, reputacaoSuprema, supremaAnfitria } from '../../game/supremeSects';
import { escapeHtml } from './dom';

function linhaSuprema(character: Character, s: SupremaInfo, anfitria: boolean): string {
  const valor = reputacaoSuprema(character, s.nome);
  const nivel = nivelReputacao(valor);
  const largura = Math.round((valor + 100) / 2);
  const membro = character.afiliacao.nome === s.nome ? ' · sua seita' : '';
  return `
    <div class="objetivo">
      <div><strong>${escapeHtml(s.nome)}</strong><small>${s.ortodoxa ? 'ortodoxa' : 'demoníaca'}${anfitria ? ' · organiza a torre e o torneio' : ''}${membro}</small></div>
      <div class="barra" title="−100 a 100">
        <div class="barra-preenchimento" style="width: ${largura}%"></div>
        <span class="barra-texto">${escapeHtml(nivel)} (${valor > 0 ? '+' : ''}${valor})</span>
      </div>
    </div>`;
}

export function resumoSupremas(character: Character): string {
  const locais = SUPREMAS.filter((s) => s.regiao === character.local.regiao);
  return locais.map((s) => nivelReputacao(reputacaoSuprema(character, s.nome))).join(' · ') || 'nenhuma na região';
}

export function renderSupremas(character: Character): string {
  const regiao = character.local.regiao;
  const anfitria = supremaAnfitria(regiao);
  const locais = SUPREMAS.filter((s) => s.regiao === regiao).map((s) => linhaSuprema(character, s, s.nome === anfitria?.nome)).join('');
  const fator = fatorPrecoSupremas(character);
  const precos = fator > 1 ? `os mercadores da região cobram ${Math.round((fator - 1) * 100)}% a mais de você` : fator < 1 ? `os mercadores da região dão ${Math.round((1 - fator) * 100)}% de desconto` : 'preços normais no Mercado';
  const conhecidas = SUPREMAS.filter((s) => s.regiao !== regiao && reputacaoSuprema(character, s.nome) !== 0)
    .map((s) => `<li>${escapeHtml(s.nome)} (${escapeHtml(REGIOES[s.regiao].nome)}): ${escapeHtml(nivelReputacao(reputacaoSuprema(character, s.nome)))} (${reputacaoSuprema(character, s.nome)})</li>`)
    .join('');
  return `
    <p class="dica">Acima de clãs, seitas e imperadores, as Seitas Supremas protegem a região — e lembram de tudo.
      A reputação com cada uma vai de Hostil a Aliada. Atos justos agradam as ortodoxas e irritam as demoníacas (e vice-versa);
      pedidos das seitas, recrutamentos e aliciamentos também contam. Seu herdeiro herda metade.</p>
    <p class="dica"><strong>Efeitos:</strong> Aliada recruta você mesmo sem raiz excepcional; Hostil nunca recruta, manda discípulos atrás de você e,
      se for a Suprema que organiza a Torre e o Torneio Regional, proíbe sua entrada. Agora: ${escapeHtml(precos)}.
      ${character.faccao ? 'Sua facção paga tributo anual às Supremas da região (meia pedra por membro).' : ''}</p>
    ${locais || '<p class="vazio-texto">Nenhuma Seita Suprema nesta região.</p>'}
    ${conhecidas ? `<h3>Outras regiões</h3><ul class="ficha">${conhecidas}</ul>` : ''}`;
}
