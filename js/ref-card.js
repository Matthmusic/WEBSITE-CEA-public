const RefCard = (() => {
    const categoryIcons = {
        aeroportuaire: 'fa-plane-departure',
        portuaire: 'fa-anchor',
        transports: 'fa-bus',
        hospitalier: 'fa-hospital',
        datacenter: 'fa-server',
        public: 'fa-landmark',
        parking: 'fa-parking',
        hotellerie: 'fa-hotel',
        commerces: 'fa-store',
        bureaux: 'fa-briefcase'
    };

    const categoryLabels = {
        aeroportuaire: 'Aéroportuaire',
        portuaire: 'Portuaire',
        transports: 'Transports',
        hospitalier: 'Hospitalier',
        datacenter: 'Data Center',
        public: 'Établissement Public',
        parking: 'Parking',
        hotellerie: 'Hôtellerie',
        commerces: 'Commerces',
        bureaux: 'Bureaux'
    };

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = String(s ?? '');
        return d.innerHTML;
    }

    function getStatus(endDate) {
        const raw = String(endDate || '').trim();
        if (!raw) return { key: 'ongoing', label: 'En cours' };
        const end = new Date(raw);
        if (Number.isNaN(end.getTime())) return { key: 'ongoing', label: 'En cours' };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return end <= today ? { key: 'delivered', label: 'Livré' } : { key: 'ongoing', label: 'En cours' };
    }

    function formatDate(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return raw;
        return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    function budgetShort(amount) {
        const n = Number(amount);
        if (!Number.isFinite(n) || n <= 0) return '';
        if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} M€`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(n % 1e3 ? 1 : 0)} k€`;
        return `${new Intl.NumberFormat('fr-FR').format(n)} €`;
    }

    function getImages(ref, base) {
        const raw = Array.isArray(ref.images) && ref.images.length ? ref.images.filter(Boolean) : ref.imageUrl ? [ref.imageUrl] : [];
        if (!base) return raw;
        return raw.map((p) => /^https?:|^data:|^blob:|^\//.test(p) ? p : base + p);
    }

    function slugify(value) {
        return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'projet';
    }

    // opts.basePath   — '' (public) | '../' (admin)
    // opts.projectBase — 'project.html' (default) | null (no link)
    // opts.extraClass — additional class on the article (e.g. 'swiper-slide')
    function buildHTML(reference, partner, site, opts = {}) {
        const base = opts.basePath || '';
        const projectBase = opts.projectBase !== undefined ? opts.projectBase : 'project.html';
        const extraClass = opts.extraClass ? ' ' + opts.extraClass : '';

        const images = getImages(reference, base);
        const primaryImage = images[0] || '';
        const status = getStatus(reference.endDate);
        const startDate = formatDate(reference.date);
        const endDate = formatDate(reference.endDate);
        const budget = reference.showBudget ? budgetShort(reference.budgetAmount) : '';
        const category = reference.category || '';

        const rawLogo = String(partner?.logo || '').trim();
        const resolvedLogo = rawLogo && !/^https?:|^data:|^blob:|^\//.test(rawLogo) ? base + rawLogo : rawLogo;
        const partnerCertified = !!partner?.certified;
        const galleryData = images.length ? ` data-gallery="${JSON.stringify(images).replace(/"/g, '&quot;')}"` : '';
        const projectKey = encodeURIComponent(String(reference.id || `${category}-${slugify(reference.title || 'projet')}`));
        const projectUrl = projectBase ? `${projectBase}?project=${projectKey}` : '';
        const rawPartnerSlug = String(partner?.slug || '').trim();
        const partnerUrl = rawPartnerSlug ? `${base}partner.html?partner=${encodeURIComponent(rawPartnerSlug)}` : '';

        return `<article class="ref-card reference-detail-card${extraClass}"${galleryData}>
  <div class="ref-image">
    <div class="project-status-badge project-status-badge--${esc(status.key)}">${esc(status.label)}</div>
    <span class="reference-category-chip reference-category-chip--bridge">${esc(categoryLabels[category] || category)}</span>
    ${primaryImage ? `<img src="${esc(primaryImage)}" alt="${esc(reference.title || 'Projet')}" class="ref-img" loading="lazy" fetchpriority="low">` : ''}
    <div class="image-placeholder"><i class="fas ${categoryIcons[category] || 'fa-folder-open'}"></i></div>
    ${images.length > 1 ? `<div class="photo-count-badge"><i class="fas fa-images"></i> ${images.length}</div>` : ''}
  </div>
  <div class="ref-content"${projectUrl ? ` data-project-url="${esc(projectUrl)}"` : ''}>
    <div class="ref-card-meta">
      <div class="ref-card-partner">
        ${partnerUrl ? `<a class="ref-card-partner-link" href="${esc(partnerUrl)}">` : '<div class="ref-card-partner-link ref-card-partner-link--static">'}
          <div class="ref-card-partner-logo">
            ${resolvedLogo ? `<img src="${esc(resolvedLogo)}" alt="${esc(partner?.name || 'Partenaire')}" loading="eager" fetchpriority="high">` : '<i class="fas fa-building"></i>'}
            ${partnerCertified ? '<span class="ac-badge-tooltip-wrap" data-tooltip="Accord cadre"><span class="ref-card-certified-badge ac-iridescent-badge" aria-label="Partenaire certifié"><span class="ac-iridescent-badge__core">AC</span></span></span>' : ''}
          </div>
          <div class="reference-partner">${esc(partner?.name || 'Partenaire non renseigné')}</div>
        ${partnerUrl ? '</a>' : '</div>'}
      </div>
    </div>
    <h4>${esc(reference.title || 'Projet')}</h4>
    <p>${esc(reference.description || '')}</p>
    <div class="ref-card-bottom">
      <div class="ref-card-dates">
        ${startDate ? `<div class="reference-date"><i class="fas fa-calendar-day"></i> Début: ${esc(startDate)}</div>` : ''}
        ${endDate ? `<div class="reference-date"><i class="fas fa-calendar-check"></i> Fin: ${esc(endDate)}</div>` : ''}
      </div>
      <div class="ref-card-footer">
        <div class="ref-card-site-bottom">
          <i class="fas fa-location-dot"></i>
          <span>${esc(site?.name || 'Site non renseigné')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          ${budget ? `<span class="budget-chip"><i class="fas fa-money-bill-wave"></i> ${esc(budget)}</span>` : ''}
        </div>
      </div>
    </div>
  </div>
</article>`;
    }

    return { buildHTML, categoryIcons, categoryLabels, getImages, getStatus, formatDate, budgetShort, slugify };
})();

if (typeof window !== 'undefined') {
    window.RefCard = RefCard;
}
