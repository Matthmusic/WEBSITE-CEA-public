const qp = new URLSearchParams(location.search);
const partnerKey = qp.get('partner') || '';

(async function init() {
  const [partners, sites, references] = await Promise.all([
    fetch('data/partners.json').then((r) => r.ok ? r.json() : []),
    fetch('data/sites.json').then((r) => r.ok ? r.json() : []),
    fetch('data/references.json').then((r) => r.ok ? r.json() : {})
  ]);

  const partner = (Array.isArray(partners) ? partners : []).find(
    (p) => String(p.slug || '').trim() === partnerKey || String(p.id) === partnerKey
  );

  document.getElementById('partnerTitle').textContent = partner?.name || 'Partenaire';
  if (partner?.logo) {
    const box = document.getElementById('partnerLogoBox');
    const img = document.getElementById('partnerLogoImg');
    img.src = partner.logo;
    img.alt = partner.name;
    if (partner.certified) {
      box.insertAdjacentHTML(
        'beforeend',
        '<span class="partner-page-certified-badge ac-iridescent-badge" aria-label="Partenaire certifié" data-tooltip="Accord cadre"><span class="ac-iridescent-badge__core">AC</span></span>'
      );
    }
    box.style.display = '';
  }

  const flatRefs = Object.keys(references || {}).flatMap((cat) =>
    (Array.isArray(references[cat]) ? references[cat] : []).map((r) => {
      const rawCategory = String(r.category || cat || '').trim();
      return { ...r, category: categoryAliases[rawCategory] || rawCategory };
    })
  );
  const siteById = new Map((Array.isArray(sites) ? sites : []).map((s) => [String(s.id), s]));
  const partnerById = new Map((Array.isArray(partners) ? partners : []).map((p) => [String(p.id), p]));

  const partnerRefs = flatRefs
    .filter((r) => String(r.partnerId || '') === String(partner?.id || ''))
    .sort((a, b) => (Number(b.weight) || 5) - (Number(a.weight) || 5) || new Date(b.date || 0) - new Date(a.date || 0));

  const grid = document.getElementById('partnerProjectsGrid');
  if (!partnerRefs.length) {
    grid.innerHTML = '<p class="references-empty">Aucun projet lié à ce partenaire.</p>';
    return;
  }

  grid.innerHTML = partnerRefs.map((r) => {
    const site = siteById.get(String(r.siteId || ''));
    const refPartner = partnerById.get(String(r.partnerId || ''));
    return RefCard.buildHTML(r, refPartner, site);
  }).join('');

  // Lien vers la fiche projet
  grid.querySelectorAll('.ref-content[data-project-url]').forEach((panel) => {
    panel.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const url = panel.getAttribute('data-project-url');
      if (url) window.location.href = url;
    });
  });

  // Galerie photo
  const modal = document.getElementById('gallery-modal');
  if (!modal) return;
  const modalImg = document.getElementById('gallery-image');
  const counter = document.getElementById('gallery-counter');
  let items = [], idx = 0;
  const open = (i) => { idx = i; modalImg.src = items[i]; counter.textContent = `${i + 1} / ${items.length}`; modal.classList.add('visible'); document.body.style.overflow = 'hidden'; };
  const close = () => { modal.classList.remove('visible'); document.body.style.overflow = ''; };
  modal.querySelector('.gallery-close').addEventListener('click', close);
  modal.querySelector('.gallery-prev').addEventListener('click', () => open((idx - 1 + items.length) % items.length));
  modal.querySelector('.gallery-next').addEventListener('click', () => open((idx + 1) % items.length));
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('visible')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') modal.querySelector('.gallery-prev').click();
    if (e.key === 'ArrowRight') modal.querySelector('.gallery-next').click();
  });
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.reference-detail-card[data-gallery]');
    if (!card || e.target.closest('a, button, .ref-content[data-project-url]')) return;
    try { items = JSON.parse(card.getAttribute('data-gallery') || '[]'); } catch { items = []; }
    if (items.length) open(0);
  });
})();
