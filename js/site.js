const qs = new URLSearchParams(location.search);
const siteKey = qs.get('site') || '';
const esc = (t) => { const d = document.createElement('div'); d.textContent = String(t ?? ''); return d.innerHTML; };
const w = (v) => Math.min(10, Math.max(1, Math.round(Number(v) || 5)));
const money = (a) => { const x = Number(a); if (!Number.isFinite(x) || x < 0) return ''; if (x >= 1e6) return `${(x / 1e6).toFixed(x % 1e6 ? 1 : 0)} M€`; if (x >= 1e3) return `${(x / 1e3).toFixed(x % 1e3 ? 1 : 0)} k€`; return `${new Intl.NumberFormat('fr-FR').format(x)} €`; };

function isDelivered(endDate) {
  const raw = String(endDate || '').trim();
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return d <= t;
}

(async function init() {
  const [partners, sites, references] = await Promise.all([
    fetch('data/partners.json').then((r) => r.ok ? r.json() : []),
    fetch('data/sites.json').then((r) => r.ok ? r.json() : []),
    fetch('data/references.json').then((r) => r.ok ? r.json() : {})
  ]);

  const site = (Array.isArray(sites) ? sites : []).find((s) => String(s.slug || '') === siteKey || String(s.id) === siteKey);
  document.getElementById('siteTitle').textContent = site?.name || 'Site';

  const partner = (Array.isArray(partners) ? partners : []).find((p) => String(p.id) === String(site?.partnerId || ''));
  if (partner) {
    document.getElementById('backToPartner').href = `partner.html?partner=${encodeURIComponent(String(partner.slug || partner.id))}`;
  }

  const flatRefs = Object.keys(references || {}).flatMap((category) => (Array.isArray(references[category]) ? references[category] : []).map((ref) => ({ ...ref, category })));
  const linked = flatRefs.filter((r) => String(r.siteId || '') === String(site?.id || ''));

  if (!linked.length) {
    document.getElementById('siteProjectsGrid').innerHTML = '<p class="references-empty">Aucun projet lié à ce site.</p>';
    return;
  }

  linked.sort((a, b) => w(b.weight) - w(a.weight) || new Date(b.date || 0) - new Date(a.date || 0));
  const delivered = linked.filter((r) => isDelivered(r.endDate));
  const ongoing = linked.filter((r) => !isDelivered(r.endDate));
  const blockA = delivered.slice(0, 2);
  const blockB = ongoing;
  const blockC = delivered.slice(2);
  const ordered = [...blockA, ...blockB, ...blockC];

  document.getElementById('siteProjectsGrid').innerHTML = ordered.map((r) => {
    const image = Array.isArray(r.images) && r.images.length ? r.images[0] : (r.imageUrl || '');
    const budget = r.showBudget && r.budgetAmount > 0 ? money(r.budgetAmount) : '';
    return `
      <article class="ref-card">
        <div class="ref-image">
          <div class="project-status-badge project-status-badge--${isDelivered(r.endDate) ? 'delivered' : 'ongoing'}">${isDelivered(r.endDate) ? 'Terminé' : 'En cours'}</div>
          ${image ? `<img src="${esc(image)}" alt="${esc(r.title)}" class="ref-img">` : ''}
          <div class="image-placeholder"><i class="fas fa-image"></i></div>
        </div>
        <div class="ref-content">
          <span class="reference-category-chip">${esc(r.category || 'Projet')}</span>
          <div class="reference-partner">${esc(partner?.name || '')}</div>
          <h4>${esc(r.title)}</h4>
          <p>${esc(r.description || '')}</p>
          ${budget ? `<div class="reference-date"><i class="fas fa-money-bill-wave"></i> ${esc(budget)}</div>` : ''}
        </div>
      </article>`;
  }).join('');
})();
