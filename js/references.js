const categoryOrder = ['aeroportuaire', 'hospitalier', 'portuaire', 'transports', 'public', 'hotellerie', 'commerces', 'bureaux', 'parking', 'datacenter'];

const gridEl = document.getElementById('referencesPageGrid');
const filtersEl = document.getElementById('referencesPageFilters');
let refs = [];
let partners = [];
let sites = [];
let partnerById = new Map();
let siteById = new Map();
let filterState = { category: 'all', partner: 'all', site: 'all' };

const w = (v) => Math.min(10, Math.max(1, Math.round(Number(v) || 5)));
const categoryRank = (c) => { const i = categoryOrder.indexOf(c); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };

function splitTransport(reference) {
  const txt = `${reference?.title || ''} ${reference?.address || ''}`.toLowerCase();
  if (/a[eé]roport|airport/.test(txt)) return 'aeroportuaire';
  if (/\bport\b|dock|harbor/.test(txt)) return 'portuaire';
  return 'transports';
}

function normalizeReferences(payload) {
  const out = [];
  Object.keys(payload || {}).forEach((rawCategory) => {
    (Array.isArray(payload[rawCategory]) ? payload[rawCategory] : []).forEach((reference) => {
      const category = String(reference?.category || rawCategory || '').trim() === 'transports'
        ? splitTransport(reference)
        : String(reference?.category || rawCategory || '').trim();
      if (!category) return;
      out.push({
        ...reference,
        category,
        weight: w(reference?.weight)
      });
    });
  });
  return out;
}

function sortReferences(list) {
  return list.sort((a, b) => {
    const ww = w(b.weight) - w(a.weight);
    if (ww !== 0) return ww;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });
}

function buildCustomDropdown(id, options, currentValue, onChange) {
  const el = document.createElement('div');
  el.className = 'cselect';
  el.dataset.value = currentValue;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cselect__trigger';
  const currentLabel = options.find((o) => o.value === currentValue)?.label || options[0]?.label || '';
  trigger.innerHTML = `<span class="cselect__label">${esc(currentLabel)}</span><svg class="cselect__arrow" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const list = document.createElement('ul');
  list.className = 'cselect__list';
  list.setAttribute('role', 'listbox');
  list.innerHTML = options.map((o) => `<li class="cselect__option${o.value === currentValue ? ' cselect__option--active' : ''}" data-value="${esc(o.value)}" role="option">${esc(o.label)}</li>`).join('');

  el.appendChild(trigger);
  el.appendChild(list);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = el.classList.contains('cselect--open');
    document.querySelectorAll('.cselect--open').forEach((d) => d.classList.remove('cselect--open'));
    if (!open) el.classList.add('cselect--open');
  });

  list.addEventListener('click', (e) => {
    const opt = e.target.closest('.cselect__option');
    if (!opt) return;
    const value = opt.dataset.value;
    el.dataset.value = value;
    trigger.querySelector('.cselect__label').textContent = opt.textContent;
    list.querySelectorAll('.cselect__option').forEach((o) => o.classList.toggle('cselect__option--active', o === opt));
    el.classList.remove('cselect--open');
    onChange(value);
  });

  return el;
}

function buildFilterControls() {
  const categoryOptions = Object.entries({ ...categoryLabels, all: 'Tous secteurs' })
    .filter(([k]) => k === 'all' || categoryLabels[k])
    .map(([k, v]) => ({ value: k, label: v }));
  categoryOptions.sort((a, b) => a.value === 'all' ? -1 : b.value === 'all' ? 1 : 0);

  // Score de chaque site = somme des poids des projets liés + poids du partenaire du site
  const siteScore = new Map();
  refs.forEach((r) => {
    if (!r.siteId) return;
    const key = String(r.siteId);
    siteScore.set(key, (siteScore.get(key) || 0) + w(r.weight));
  });
  sites.forEach((s) => {
    const key = String(s.id);
    const partnerWeight = w(partnerById.get(String(s.partnerId || ''))?.weight);
    siteScore.set(key, (siteScore.get(key) || 0) + (partnerWeight || 0));
  });

  const partnerOptions = [{ value: 'all', label: 'Tous partenaires' }]
    .concat([...partners].sort((a, b) => w(b.weight) - w(a.weight)).map((p) => ({ value: String(p.id), label: p.name })));
  const siteOptions = [{ value: 'all', label: 'Tous sites' }]
    .concat([...sites].sort((a, b) => (siteScore.get(String(b.id)) || 0) - (siteScore.get(String(a.id)) || 0)).map((s) => ({ value: String(s.id), label: s.name })));

  filtersEl.innerHTML = '';
  const catEl = buildCustomDropdown('cat', categoryOptions, filterState.category, (v) => { filterState.category = v; renderGrid(); });
  catEl.classList.add('cselect--sm');
  filtersEl.appendChild(catEl);
  const partnerEl = buildCustomDropdown('partner', partnerOptions, filterState.partner, (v) => { filterState.partner = v; renderGrid(); });
  partnerEl.classList.add('cselect--lg');
  filtersEl.appendChild(partnerEl);
  const siteEl = buildCustomDropdown('site', siteOptions, filterState.site, (v) => { filterState.site = v; renderGrid(); });
  siteEl.classList.add('cselect--lg');
  filtersEl.appendChild(siteEl);

  document.addEventListener('click', () => document.querySelectorAll('.cselect--open').forEach((d) => d.classList.remove('cselect--open')));
}

function renderGrid() {
  let visible = [...refs];
  if (filterState.category !== 'all') visible = visible.filter((r) => r.category === filterState.category);
  if (filterState.partner !== 'all') visible = visible.filter((r) => String(r.partnerId || '') === String(filterState.partner));
  if (filterState.site !== 'all') visible = visible.filter((r) => String(r.siteId || '') === String(filterState.site));
  visible = sortReferences(visible);

  if (!visible.length) {
    gridEl.innerHTML = '<p class="references-empty">Aucune référence disponible pour ce filtre.</p>';
    return;
  }

  gridEl.innerHTML = visible.map((reference) => {
    const partner = partnerById.get(String(reference.partnerId || ''));
    const site = siteById.get(String(reference.siteId || ''));
    return RefCard.buildHTML(reference, partner, site);
  }).join('');

  if (window.gsap) {
    gsap.from(gridEl.querySelectorAll('.ref-card'), {
      opacity: 0,
      y: 28,
      duration: 0.5,
      stagger: 0.055,
      ease: 'power2.out',
      clearProps: 'opacity,transform'
    });
  }

  gridEl.querySelectorAll('.ref-content[data-project-url]').forEach((panel) => {
    panel.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const url = panel.getAttribute('data-project-url');
      if (url) window.location.href = url;
    });
  });
}

class GalleryManager {
  constructor() {
    this.modal = document.getElementById('gallery-modal');
    if (!this.modal) return;
    this.modalImg = document.getElementById('gallery-image');
    this.counter = document.getElementById('gallery-counter');
    this.closeBtn = this.modal.querySelector('.gallery-close');
    this.prevBtn = this.modal.querySelector('.gallery-prev');
    this.nextBtn = this.modal.querySelector('.gallery-next');
    this.items = []; this.index = 0;
    this.bind();
  }
  bind() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.reference-detail-card[data-gallery]');
      if (!card || e.target.closest('a,button')) return;
      try { this.items = JSON.parse(card.getAttribute('data-gallery') || '[]'); } catch { this.items = []; }
      if (!this.items.length) return;
      this.open(0);
    });
    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.open((this.index - 1 + this.items.length) % this.items.length));
    this.nextBtn.addEventListener('click', () => this.open((this.index + 1) % this.items.length));
    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('visible')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prevBtn.click();
      if (e.key === 'ArrowRight') this.nextBtn.click();
    });
  }
  open(i) { this.index = i; this.modalImg.src = this.items[i]; this.counter.textContent = `${i + 1} / ${this.items.length}`; this.modal.classList.add('visible'); document.body.style.overflow = 'hidden'; }
  close() { this.modal.classList.remove('visible'); document.body.style.overflow = 'auto'; }
}

document.addEventListener('DOMContentLoaded', async () => {
  new GalleryManager();
  const [referencesPayload, partnersPayload, sitesPayload] = await Promise.all([
    fetch('data/references.json').then((r) => r.ok ? r.json() : {}),
    fetch('data/partners.json').then((r) => r.ok ? r.json() : []),
    fetch('data/sites.json').then((r) => r.ok ? r.json() : [])
  ]);
  refs = normalizeReferences(referencesPayload);
  partners = Array.isArray(partnersPayload) ? partnersPayload : [];
  sites = Array.isArray(sitesPayload) ? sitesPayload : [];
  partnerById = new Map(partners.map((p) => [String(p.id), p]));
  siteById = new Map(sites.map((s) => [String(s.id), s]));

  const urlCat = new URLSearchParams(window.location.search).get('category');
  if (urlCat && categoryLabels[urlCat]) filterState.category = urlCat;

  buildFilterControls();
  renderGrid();
});
