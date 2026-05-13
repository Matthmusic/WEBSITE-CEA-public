const categoryLabels = {
  aeroportuaire: 'Aéroportuaire',
  hospitalier: 'Hospitalier',
  portuaire: 'Portuaire',
  transports: 'Transports',
  public: 'Établissement Public',
  hotellerie: 'Hôtellerie',
  commerces: 'Commerces',
  bureaux: 'Bureaux',
  parking: 'Parking',
  datacenter: 'Data Center'
};

const categoryAliases = {
  aeroport: 'aeroportuaire',
  port: 'portuaire'
};

const esc = (t) => { const d = document.createElement('div'); d.textContent = String(t ?? ''); return d.innerHTML; };

function budgetShort(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} M€`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n % 1e3 ? 1 : 0)} k€`;
  return `${new Intl.NumberFormat('fr-FR').format(n)} €`;
}

function formatDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function statusOf(endDate) {
  const raw = String(endDate || '').trim();
  if (!raw) return { key: 'ongoing', label: 'En cours' };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { key: 'ongoing', label: 'En cours' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d <= today ? { key: 'delivered', label: 'Terminé' } : { key: 'ongoing', label: 'En cours' };
}
