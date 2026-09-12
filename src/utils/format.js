/* Helpers de formatage partagés par toutes les vues. */

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

/**
 * Formate un montant sans utiliser Intl.NumberFormat.
 *
 * Intl.NumberFormat('fr-FR') sépare les milliers par une espace fine
 * insécable (U+202F). Les polices standards de jsPDF (Helvetica) ne
 * supportent que l'encodage WinAnsi et n'ont pas ce caractère : il se rend
 * comme un glyphe erroné, souvent affiché « / » dans le PDF généré.
 * On regroupe donc les milliers manuellement avec une espace normale.
 */
export function formatAmountForPdf(value, { withCurrency = false } = {}) {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '-' : '';
  const grouped = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const text = `${sign}${grouped}`;
  return withCurrency ? `${text} F CFA` : text;
}

/** 1 250 000 F CFA — renvoie « — » si la valeur est absente. */
export function formatCurrency(value, currency = 'XOF') {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '—';
  const suffix = currency === 'XOF' ? 'F CFA' : currency;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value))} ${suffix}`;
}

/** Version compacte pour les grands nombres dans les cartes : 12,5 M */
export function formatCompact(value, currency = 'XOF') {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const suffix = currency === 'XOF' ? 'F' : currency;
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} Md ${suffix}`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M ${suffix}`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)} k ${suffix}`;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} ${suffix}`;
}

export function formatNumber(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value));
}

/** 05/11/2025 */
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

/** 05 Nov 2025 — format utilisé dans les tableaux du template. */
export function formatDateLong(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** « 2026-03 » → « Mar 26 » (périodes renvoyées par activity-trend). */
export function formatPeriod(period) {
  if (!period) return '—';
  const [year, month] = String(period).split('-');
  const idx = Number(month) - 1;
  return `${MONTHS_SHORT[idx] ?? month} ${String(year).slice(2)}`;
}

/** Nombre de jours entre aujourd'hui et une date (négatif = échéance dépassée). */
export function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Jours de retard sur une échéance (0 si à jour ou prêt soldé). */
export function daysLate(nextPaymentDate, loanStatus) {
  if (!nextPaymentDate || loanStatus === 'PAID_OFF') return 0;
  const d = daysUntil(nextPaymentDate);
  return d !== null && d < 0 ? Math.abs(d) : 0;
}

/** Pourcentage remboursé d'un prêt, borné à [0, 100]. */
export function repaymentProgress(principalAmount, remainingAmount) {
  const principal = Number(principalAmount);
  if (!principal || principal <= 0) return 0;
  const remaining = Math.max(0, Number(remainingAmount) || 0);
  return Math.min(100, Math.max(0, Math.round(((principal - remaining) / principal) * 100)));
}

/* ─────────────── Libellés métier ─────────────── */

const SECTOR_LABELS = {
  MOBILE_MONEY: 'Mobile Money',
  RETAIL_FASHION: 'Mode & Prêt-à-porter',
  BEAUTY_WELLNESS: 'Beauté & Bien-être',
  FOOD_RESTAURANT: 'Restauration & Alimentation',
  GENERAL_TRADE: 'Commerce général',
  SERVICES: 'Services & Conseil',
  HEALTH: 'Santé',
  EDUCATION: 'Éducation',
  AGRICULTURE: 'Agriculture',
  BAKERY: 'Boulangerie',
  TRANSPORT: 'Transport & Logistique',
  COMMERCE: 'Commerce',
  OTHER: 'Autre',
};

export function formatSector(value) {
  if (!value) return '—';
  return SECTOR_LABELS[value] || value;
}

const KYC_LABELS = {
  NONE: 'Aucun',
  NOT_SUBMITTED: 'Non soumis',
  BASIC: 'Basique',
  STANDARD: 'Standard',
  FULL: 'Complet',
  ENHANCED: 'Renforcé',
};

export function formatKyc(value) {
  if (!value) return '—';
  return KYC_LABELS[value] || value;
}

const LOAN_TYPE_LABELS = {
  BANK_LOAN: 'Prêt bancaire',
  LINE_OF_CREDIT: 'Ligne de crédit',
  LEASING: 'Leasing',
  SUPPLIER_CREDIT: 'Crédit fournisseur',
  OVERDRAFT: 'Découvert',
  BOND: 'Obligation',
  SHAREHOLDER_LOAN: 'Compte courant associé',
};

export function formatLoanType(value) {
  if (!value) return '—';
  return LOAN_TYPE_LABELS[value] || value;
}

/* ─────────────── Statuts : libellé + couleurs Tailwind ─────────────── */

const STATUS_META = {
  // Demandes de financement
  PENDING: { label: 'En attente', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-600' },
  UNDER_REVIEW: { label: 'En instruction', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  APPROVED: { label: 'Approuvée', badge: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  REJECTED: { label: 'Rejetée', badge: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
  DISBURSED: { label: 'Décaissée', badge: 'bg-primary-100 text-primary-700', dot: 'bg-primary-600' },
  CANCELLED: { label: 'Annulée', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-600' },
  // Prêts
  ACTIVE: { label: 'En cours', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  PAID_OFF: { label: 'Soldé', badge: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  DEFAULTED: { label: 'En défaut', badge: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
  LATE: { label: 'En retard', badge: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
  // Transactions wallet
  SUCCESS: { label: 'Réussi', badge: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  FAILED: { label: 'Échoué', badge: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
  PROCESSING: { label: 'En cours', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  COMPLETED: { label: 'Terminé', badge: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  // Déclarations fiscales
  VERIFIED: { label: 'Vérifiée', badge: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  // Statut KYC : distingue « rien soumis » de « en cours d'examen ».
  NOT_SUBMITTED: { label: 'Non soumis', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
  EXPIRED: { label: 'Expiré', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-600' },
  DECLARED: { label: 'Déclarée', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  PENDING_PROOF: { label: 'Preuve attendue', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-600' },
  DUE: { label: 'À échéance', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-600' },
  SCHEDULED: { label: 'Planifiée', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-600' },
  OVERDUE: { label: 'En retard', badge: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
};

export function statusLabel(status) {
  return STATUS_META[status]?.label ?? status ?? '—';
}

export function statusBadgeClass(status) {
  return STATUS_META[status]?.badge ?? 'bg-gray-100 text-gray-700';
}

export function statusDotClass(status) {
  return STATUS_META[status]?.dot ?? 'bg-gray-600';
}

/* Niveaux de risque */

/** Niveaux de risque reconnus, du plus grave au moins grave. */
export const RISK_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Normalise le niveau de risque d'une alerte.
 *
 * Le contrat annonce un champ `level` valant CRITICAL/HIGH/MEDIUM/LOW, mais la
 * réponse réelle peut différer (casse, libellé français, autre nom de champ).
 * On accepte donc plusieurs variantes plutôt que de compter zéro en silence.
 *
 * @param {object} alert l'alerte brute renvoyée par l'API
 * @returns {string|null} niveau normalisé, ou null si absent
 */
export function normalizeRiskLevel(alert) {
  const raw = alert?.level ?? alert?.riskLevel ?? alert?.severity ?? alert?.alertLevel;
  if (raw === undefined || raw === null || raw === '') return null;

  const value = String(raw)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const ALIASES = {
    CRITIQUE: 'CRITICAL',
    URGENT: 'CRITICAL',
    SEVERE: 'CRITICAL',
    ELEVE: 'HIGH',
    ELEVEE: 'HIGH',
    IMPORTANT: 'HIGH',
    MOYEN: 'MEDIUM',
    MOYENNE: 'MEDIUM',
    WARNING: 'MEDIUM',
    FAIBLE: 'LOW',
    INFO: 'LOW',
    MINEUR: 'LOW',
  };

  return ALIASES[value] || value;
}

const RISK_LABELS = {
  CRITICAL: 'Critique',
  HIGH: 'Élevé',
  MEDIUM: 'Moyen',
  LOW: 'Faible',
};

export function riskLabel(level) {
  return RISK_LABELS[level] ?? level ?? '—';
}

/**
 * Couleur de l'icône d'une alerte.
 * C'est le seul élément dont la couleur varie selon le niveau : le reste de la
 * carte reste neutre pour ne pas saturer la page.
 */
const RISK_ICON = {
  CRITICAL: 'text-red-500',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-blue-400',
};

export function riskIconClass(level) {
  return RISK_ICON[level] || 'text-gray-400';
}

/** Couleur de la barre de progression selon l'avancement. */
export function progressBarClass(progress) {
  if (progress >= 75) return 'bg-gradient-to-r from-green-500 to-green-600';
  if (progress >= 50) return 'bg-gradient-to-r from-blue-500 to-blue-600';
  if (progress >= 25) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
  return 'bg-gradient-to-r from-red-500 to-red-600';
}

/** Score de crédit → couleur (barème /1000 côté Onda). */
export function scoreColorClass(score, maxScore = 1000) {
  const ratio = maxScore ? Number(score) / Number(maxScore) : 0;
  if (ratio >= 0.75) return 'text-green-600';
  if (ratio >= 0.5) return 'text-blue-600';
  if (ratio >= 0.3) return 'text-yellow-600';
  return 'text-red-600';
}