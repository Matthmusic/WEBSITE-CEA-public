const qp = new URLSearchParams(location.search);
const projectKey = qp.get('project') || '';

function imageList(reference) {
  if (Array.isArray(reference?.images) && reference.images.length) return reference.images.filter(Boolean);
  if (reference?.imageUrl) return [reference.imageUrl];
  return [];
}

function slugify(v) {
  return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

class SimpleGallery {
  constructor() {
    this.modal = document.getElementById('gallery-modal');
    if (!this.modal) return;
    this.modalImg = document.getElementById('gallery-image');
    this.counter = document.getElementById('gallery-counter');
    this.closeBtn = this.modal.querySelector('.gallery-close');
    this.prevBtn = this.modal.querySelector('.gallery-prev');
    this.nextBtn = this.modal.querySelector('.gallery-next');
    this.items = [];
    this.index = 0;
    this.bind();
  }
  bind() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-gallery][data-gallery-click="image"]');
      if (!card) return;
      if (!e.target.closest('.proj-hero-bg, .ref-image, .ref-img, .project-gallery-thumb, .project-bento-item')) return;
      try { this.items = JSON.parse(card.getAttribute('data-gallery') || '[]'); } catch { this.items = []; }
      if (!this.items.length) return;
      const idx = Number(card.dataset.galleryIndex ?? 0);
      this.open(Math.min(idx, this.items.length - 1));
    });
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
    this.prevBtn.addEventListener('click', () => this.open((this.index - 1 + this.items.length) % this.items.length));
    this.nextBtn.addEventListener('click', () => this.open((this.index + 1) % this.items.length));
    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('visible')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.open((this.index - 1 + this.items.length) % this.items.length);
      if (e.key === 'ArrowRight') this.open((this.index + 1) % this.items.length);
    });
  }
  open(i) {
    this.index = i;
    this.modalImg.src = this.items[i];
    this.modalImg.alt = `Photo ${i + 1} / ${this.items.length}`;
    this.counter.textContent = `${i + 1} / ${this.items.length}`;
    this.modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  close() {
    this.modal.classList.remove('visible');
    document.body.style.overflow = 'auto';
  }
}

(async function init() {
  new SimpleGallery();

  const [partners, sites, references] = await Promise.all([
    fetch('data/partners.json').then((r) => r.ok ? r.json() : []),
    fetch('data/sites.json').then((r) => r.ok ? r.json() : []),
    fetch('data/references.json').then((r) => r.ok ? r.json() : {})
  ]);

  const flat = Object.keys(references || {}).flatMap((category) =>
    (Array.isArray(references[category]) ? references[category] : []).map((ref) => ({ ...ref, category }))
  );

  const match = flat.find((r) => String(r.id || '') === projectKey)
    || flat.find((r) => `${r.category}-${slugify(r.title || 'projet')}` === projectKey);

  const projContent = document.getElementById('projContent');

  if (!match) {
    projContent.innerHTML = `
      <div class="proj-body">
        <h1 style="color:var(--text-primary);font-size:1.4rem;margin-bottom:0.5rem">Projet introuvable</h1>
        <p class="proj-sub">Aucun projet correspondant à cet identifiant.</p>
      </div>`;
    return;
  }

  const partner = (Array.isArray(partners) ? partners : []).find((p) => String(p.id) === String(match.partnerId || ''));
  const site = (Array.isArray(sites) ? sites : []).find((s) => String(s.id) === String(match.siteId || ''));
  const status = statusOf(match.endDate);
  const images = imageList(match);
  const hero = images[0] || '';
  const galleryJson = JSON.stringify(images).replace(/"/g, '&quot;');

  const partnerLogo = String(partner?.logo || '').trim();
  const partnerCertified = !!partner?.certified;
  const partnerSlug = String(partner?.slug || '').trim();
  const partnerUrl = partnerSlug ? `partner.html?partner=${encodeURIComponent(partnerSlug)}` : '';

  const budget = (match.showBudget && Number.isFinite(Number(match.budgetAmount)) && Number(match.budgetAmount) > 0)
    ? budgetShort(match.budgetAmount)
    : '';

  const badgeHtml = partnerCertified
    ? `<span class="ac-badge-tooltip-wrap proj-logo-badge" data-tooltip="Accord cadre"><span class="ref-card-certified-badge ac-iridescent-badge" aria-label="Partenaire certifié"><span class="ac-iridescent-badge__core">AC</span></span></span>`
    : '';

  const subParts = [site?.name, partner?.name].filter(Boolean);

  projContent.innerHTML = `
    <div class="proj-hero" data-gallery="${galleryJson}" data-gallery-click="image">
      <div class="proj-hero-bg">
        ${hero
          ? `<img src="${esc(hero)}" alt="${esc(match.title || 'Projet')}" class="proj-hero-img" loading="eager" fetchpriority="high">`
          : `<div class="proj-hero-empty"><i class="fas fa-image"></i></div>`}
      </div>
      <div class="proj-hero-overlay">
        ${partnerLogo ? `
        <div class="proj-logo-card">
          ${partnerUrl ? `<a href="${esc(partnerUrl)}" class="proj-logo-link">` : `<span class="proj-logo-link">`}
            <img src="${esc(partnerLogo)}" alt="${esc(partner?.name || 'Partenaire')}" loading="eager" fetchpriority="high">
          ${partnerUrl ? `</a>` : `</span>`}
          ${badgeHtml}
        </div>
        ` : ''}
        <h1 class="proj-title">${esc(match.title || 'Projet')}</h1>
      </div>
    </div>
    <div class="proj-body">
      ${subParts.length ? `<p class="proj-sub">${subParts.map(esc).join('<span class="proj-sub-dot"> · </span>')}</p>` : ''}
      <div class="proj-meta">
        <div class="proj-meta-dates">
          ${match.date ? `<span class="proj-date"><i class="fas fa-calendar-day"></i> Début&nbsp;: ${esc(formatDate(match.date))}</span>` : ''}
          ${match.endDate ? `<span class="proj-date"><i class="fas fa-calendar-check"></i> Fin&nbsp;: ${esc(formatDate(match.endDate))}</span>` : ''}
        </div>
        <div class="proj-meta-right">
          <span class="project-status-badge project-status-badge--${status.key}">${esc(status.label)}</span>
          ${budget ? `<span class="budget-chip"><i class="fas fa-money-bill-wave"></i> ${esc(budget)}</span>` : ''}
        </div>
      </div>
      ${match.description ? `<p class="proj-desc">${esc(match.description)}</p>` : ''}
    </div>
  `;

  const galleryEl = document.getElementById('projectGalleryGrid');
  if (!images.length) {
    galleryEl.innerHTML = '<p class="references-empty">Aucune photo disponible.</p>';
    return;
  }

  const orientations = await Promise.all(images.map((src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const r = img.naturalWidth / img.naturalHeight;
      resolve(r > 1.2 ? 'landscape' : r < 0.85 ? 'portrait' : 'square');
    };
    img.onerror = () => resolve('landscape');
    img.src = src;
  })));

  galleryEl.innerHTML = images.map((img, i) => `
    <div class="project-bento-item" data-orientation="${orientations[i]}" data-gallery="${galleryJson}" data-gallery-click="image" data-gallery-index="${i}">
      <img src="${esc(img)}" alt="${esc(match.title || `Photo ${i + 1}`)}">
    </div>
  `).join('');
})();
