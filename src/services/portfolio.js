/**
 * Agrégations du portefeuille.
 *
 * L'API expose deux ressources complémentaires :
 *  - /clients : les prêts décaissés (montants, échéances, statut)
 *  - /leads   : le profil des marchands (secteur, score, ville, KYC)
 * Les tableaux du template ont besoin des deux : on les fusionne ici sur `organizationId`.
 */
import { listClients, getLeads } from './bankPortal';
import { daysLate, daysUntil, repaymentProgress } from '@/utils/format';

/** Récupère toutes les pages d'un endpoint paginé (plafonné pour éviter les boucles infinies). */
async function fetchAllPages(fetcher, { size = 100, maxPages = 20 } = {}) {
  const first = await fetcher({ page: 0, size });
  const items = [...(first.content || [])];
  const totalPages = Math.min(first.totalPages || 1, maxPages);

  for (let page = 1; page < totalPages; page += 1) {
    const next = await fetcher({ page, size });
    items.push(...(next.content || []));
  }

  return { items, totalElements: first.totalElements ?? items.length };
}

/**
 * Portefeuille complet : prêts enrichis du profil marchand + KPI agrégés.
 * Les leads sont optionnels — si l'endpoint échoue on dégrade sans casser la page.
 */
export async function fetchPortfolio() {
  const [clientsResult, leadsResult] = await Promise.all([
    fetchAllPages(listClients),
    fetchAllPages((p) => getLeads(p)).catch(() => ({ items: [], totalElements: 0 })),
  ]);

  const leadsByOrg = new Map(leadsResult.items.map((lead) => [lead.organizationId, lead]));

  const loans = clientsResult.items.map((client) => {
    const lead = leadsByOrg.get(client.organizationId) || null;
    const late = daysLate(client.nextPaymentDate, client.loanStatus);
    const progress = repaymentProgress(client.principalAmount, client.remainingAmount);

    return {
      ...client,
      lead,
      sector: lead?.sector ?? null,
      city: lead?.city ?? null,
      totalScore: lead?.totalScore ?? null,
      maxScore: lead?.maxScore ?? null,
      scoreLabelFr: lead?.scoreLabelFr ?? null,
      repaidAmount: Math.max(0, (client.principalAmount || 0) - (client.remainingAmount || 0)),
      progress,
      daysLate: late,
      daysRemaining: daysUntil(client.nextPaymentDate),
      /** Statut affiché : le retard prime sur le statut brut du prêt. */
      displayStatus: client.loanStatus === 'PAID_OFF' ? 'PAID_OFF' : late > 0 ? 'LATE' : client.loanStatus,
    };
  });

  return {
    loans,
    leads: leadsResult.items,
    totalClients: clientsResult.totalElements,
    totalLeads: leadsResult.totalElements,
    stats: computeStats(loans),
  };
}

/** KPI du portefeuille calculés côté client à partir des prêts. */
export function computeStats(loans) {
  const totalDisbursed = loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
  const totalRemaining = loans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
  const totalRepaid = totalDisbursed - totalRemaining;

  const paidOff = loans.filter((l) => l.displayStatus === 'PAID_OFF').length;
  const late = loans.filter((l) => l.displayStatus === 'LATE').length;
  const active = loans.filter((l) => l.displayStatus === 'ACTIVE').length;

  return {
    totalLoans: loans.length,
    uniqueClients: new Set(loans.map((l) => l.organizationId)).size,
    totalDisbursed,
    totalRepaid,
    totalRemaining,
    recoveryRate: totalDisbursed > 0 ? Math.round((totalRepaid / totalDisbursed) * 100) : 0,
    paidOff,
    active,
    late,
  };
}

/**
 * Décaissements par mois sur les N derniers mois, à partir de `startDate`.
 * Sert d'alimentation au graphique du tableau de bord — 100 % dérivé de données réelles.
 */
export function disbursementsByMonth(loans, months = 7) {
  const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const buckets = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: MONTHS_SHORT[d.getMonth()],
      disbursed: 0,
      repaid: 0,
      count: 0,
    });
  }

  const byKey = new Map(buckets.map((b) => [b.key, b]));

  loans.forEach((loan) => {
    if (!loan.startDate) return;
    const d = new Date(loan.startDate);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.disbursed += loan.principalAmount || 0;
      bucket.repaid += loan.repaidAmount || 0;
      bucket.count += 1;
    }
  });

  return buckets;
}

/** Prochaines échéances triées : les retards d'abord, puis par date. */
export function upcomingSchedule(loans) {
  return [...loans]
    .filter((l) => l.displayStatus !== 'PAID_OFF')
    .sort((a, b) => {
      if (a.daysLate !== b.daysLate) return b.daysLate - a.daysLate;
      const da = a.nextPaymentDate ? new Date(a.nextPaymentDate).getTime() : Infinity;
      const db = b.nextPaymentDate ? new Date(b.nextPaymentDate).getTime() : Infinity;
      return da - db;
    });
}
