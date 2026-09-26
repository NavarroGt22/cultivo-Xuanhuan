import { criarOverlay } from './dom';

interface Preferencias { fonte: 'normal' | 'grande'; movimento: boolean; contraste: boolean }
const CHAVE = 'xuanhuan-preferencias';

function ler(): Preferencias {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    return { fonte: p.fonte === 'grande' ? 'grande' : 'normal', movimento: typeof p.movimento === 'boolean' ? p.movimento : matchMedia('(prefers-reduced-motion: reduce)').matches, contraste: p.contraste === true };
  } catch { return { fonte: 'normal', movimento: false, contraste: false }; }
}

function aplicar(p: Preferencias): void {
  document.documentElement.dataset.fonte = p.fonte;
  document.documentElement.classList.toggle('reduzir-movimento', p.movimento);
  document.documentElement.classList.toggle('alto-contraste', p.contraste);
}

export function aplicarPreferencias(): void { aplicar(ler()); }

export function abrirPreferencias(): void {
  const p = ler();
  const overlay = criarOverlay();
  overlay.innerHTML = `<section class="painel painel-preferencias"><button class="fechar" aria-label="Fechar">×</button>
    <p class="eyebrow">Sua experiência</p><h2>Opções de leitura</h2><p class="descricao">As preferências são aplicadas imediatamente e lembradas neste dispositivo.</p>
    <label class="preferencia">Tamanho do texto<select id="pref-fonte"><option value="normal">Padrão</option><option value="grande">Ampliado</option></select></label>
    <label class="preferencia"><span>Reduzir animações<small>Desativa transições e efeitos de movimento.</small></span><input id="pref-movimento" type="checkbox" /></label>
    <label class="preferencia"><span>Alto contraste<small>Aumenta o contraste dos textos secundários e das bordas.</small></span><input id="pref-contraste" type="checkbox" /></label>
    <p class="dica" role="status" id="pref-status">Você pode fechar esta janela com Esc.</p></section>`;
  const fonte = overlay.querySelector<HTMLSelectElement>('#pref-fonte')!;
  const movimento = overlay.querySelector<HTMLInputElement>('#pref-movimento')!;
  const contraste = overlay.querySelector<HTMLInputElement>('#pref-contraste')!;
  fonte.value = p.fonte; movimento.checked = p.movimento; contraste.checked = p.contraste;
  overlay.addEventListener('change', () => {
    const atual: Preferencias = { fonte: fonte.value === 'grande' ? 'grande' : 'normal', movimento: movimento.checked, contraste: contraste.checked };
    aplicar(atual);
    try { localStorage.setItem(CHAVE, JSON.stringify(atual)); }
    catch { overlay.querySelector('#pref-status')!.textContent = 'Preferências aplicadas, mas não foi possível guardá-las neste dispositivo.'; }
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay || (e.target as HTMLElement).closest('.fechar')) overlay.remove();
  });
}
