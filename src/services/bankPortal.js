/**
 * Couche d'accès à l'API Bank Portal (com.onda.core.bank).
 * Toutes les réponses sont enveloppées dans ApiResponse<T> : on renvoie directement `data.data`.
 *
 * Les endpoints paginés renvoient une Page<T> Spring :
 *   { content, totalElements, totalPages, number, size, first, last, empty }
 */
import http, { readBlobError } from './http';

const PREFIX = '/api/bank-portal';

/* ─────────────── Profil de la microfinance ─────────────── */

/** PartnerBankResponse : identité de l'établissement + catalogue produits. */
export async function getProfile() {
  const { data } = await http.get(`${PREFIX}/profile`);
  return data.data;
}

/**
 * Met à jour l'identité de l'établissement.
 * Les champs réservés à l'admin (slug, isOfficial, isActive, config payout)
 * ne sont pas modifiables ici et sont ignorés par le serveur.
 * @param {{name:string,shortPitch?:string,description?:string,logoUrl?:string,
 *   primaryColor?:string,website?:string,phone?:string,country?:string}} payload
 */
export async function updateProfile(payload) {
  const { data } = await http.put(`${PREFIX}/profile`, payload);
  return data.data;
}

/* ─────────────── Catalogue de produits ─────────────── */

export async function addProduct(payload) {
  const { data } = await http.post(`${PREFIX}/products`, payload);
  return data.data;
}

export async function updateProduct(productId, payload) {
  const { data } = await http.put(`${PREFIX}/products/${productId}`, payload);
  return data.data;
}

export async function deleteProduct(productId) {
  const { data } = await http.delete(`${PREFIX}/products/${productId}`);
  return data.data;
}

/* ─────────────── Leads (PME finançables) ─────────────── */

/** @param {{page?:number,size?:number,minScore?:number,country?:string}} params */
export async function getLeads(params = {}) {
  const { data } = await http.get(`${PREFIX}/leads`, {
    params: { minScore: 0, ...params },
  });
  return data.data;
}

export async function getLeadProfile(orgId) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}`);
  return data.data;
}

export async function getLeadFinancials(orgId) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}/financials`);
  return data.data;
}

export async function getLeadFinancialStatements(orgId) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}/financial-statements`);
  return data.data;
}

export async function getLeadPatrimony(orgId) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}/patrimony`);
  return data.data;
}

export async function getLeadTaxDeclarations(orgId) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}/tax-declarations`);
  return data.data;
}

export async function getLeadAccounts(orgId) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}/accounts`);
  return data.data;
}

/** @param {number} months nombre de mois d'historique (défaut 6) */
export async function getLeadActivityTrend(orgId, months = 6) {
  const { data } = await http.get(`${PREFIX}/leads/${orgId}/activity-trend`, {
    params: { months },
  });
  return data.data;
}

/**
 * Récupère une preuve de patrimoine sous forme d'object-URL utilisable dans <img :src>.
 * L'endpoint exige le Bearer token, un <img src> direct ne l'enverrait pas.
 * Penser à URL.revokeObjectURL() après usage.
 */
export async function getLeadPatrimonyProofUrl(orgId, fileId) {
  const response = await http.get(`${PREFIX}/leads/${orgId}/patrimony/proof/${fileId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(response.data);
}

/**
 * Export du dossier complet du marchand.
 *
 * Le serveur renvoie une archive ZIP, pas un PDF : forcer l'extension .pdf
 * produisait un fichier illisible (« Échec de chargement du document PDF »).
 * On déduit donc le nom et l'extension de la réponse elle-même, et on remonte
 * proprement les erreurs JSON encapsulées dans le Blob.
 *
 * @returns {Promise<{blob:Blob,filename:string}>}
 */
export async function exportClientDossier(orgId, fallbackName = 'Dossier') {
  let response;

  try {
    response = await http.get(`${PREFIX}/leads/${orgId}/export`, { responseType: 'blob' });
  } catch (error) {
    // Avec responseType:'blob', une erreur JSON arrive aussi sous forme de Blob.
    const blob = error.response?.data;
    if (blob instanceof Blob) {
      const message = await readBlobError(blob);
      if (message) throw new Error(message);
    }
    throw error;
  }

  const blob = response.data;
  const contentType = (response.headers?.['content-type'] || '').toLowerCase();

  // Réponse d'erreur renvoyée en 200 avec un corps JSON : ne pas la télécharger.
  if (contentType.includes('application/json')) {
    const message = await readBlobError(blob);
    throw new Error(message || "L'export n'a renvoyé aucun document.");
  }

  if (!blob || blob.size === 0) {
    throw new Error("L'export est vide : aucun document disponible pour ce marchand.");
  }

  // 1) Nom fourni par le serveur via Content-Disposition
  const disposition = response.headers?.['content-disposition'] || '';
  const match = /filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i.exec(disposition);
  if (match) {
    return { blob, filename: decodeURIComponent(match[1].trim()) };
  }

  // 2) Sinon, extension déduite du type MIME
  const EXT_BY_TYPE = {
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/pdf': 'pdf',
    'application/octet-stream': 'zip',
  };
  const ext = EXT_BY_TYPE[contentType.split(';')[0].trim()] || 'zip';

  const safeName = String(fallbackName).replace(/[^\w\-]+/g, '_');
  return { blob, filename: `Dossier_${safeName}.${ext}` };
}

/* ─────────────── Demandes de financement ─────────────── */

/** @param {{page?:number,size?:number,status?:string}} params */
export async function listApplications(params = {}) {
  const { data } = await http.get(`${PREFIX}/applications`, { params });
  return data.data;
}

export async function getApplication(id) {
  const { data } = await http.get(`${PREFIX}/applications/${id}`);
  return data.data;
}

/** @param {{decision:'UNDER_REVIEW'|'APPROVED'|'REJECTED', note?:string}} payload */
export async function reviewApplication(id, payload) {
  const { data } = await http.post(`${PREFIX}/applications/${id}/review`, payload);
  return data.data;
}

export async function disburseApplication(id, payload) {
  const { data } = await http.post(`${PREFIX}/applications/${id}/disburse`, payload);
  return data.data;
}

/* ─────────────── Portefeuille clients financés ─────────────── */

export async function listClients(params = {}) {
  const { data } = await http.get(`${PREFIX}/clients`, { params });
  return data.data;
}

export async function getClientOverview(orgId) {
  const { data } = await http.get(`${PREFIX}/clients/${orgId}/overview`);
  return data.data;
}

/** @param {{amount:number,paymentDate:string,reference?:string}} payload */
export async function registerManualRepayment(orgId, loanId, payload) {
  await http.post(`${PREFIX}/clients/${orgId}/loans/${loanId}/repayments`, payload);
}

/** @param {{clientCode?:string,phone?:string,taxId?:string}} payload */
export async function requestClientLink(payload) {
  await http.post(`${PREFIX}/clients/link-request`, payload);
}

export async function getBankLinkRequests() {
  const { data } = await http.get(`${PREFIX}/clients/link-requests`);
  return data.data || [];
}

export async function importExternalLoan(orgId, payload) {
  await http.post(`${PREFIX}/clients/${orgId}/external-loans`, payload);
}

/* ─────────────── Prêts : solde anticipé ─────────────── */

export async function getEarlyPayoffQuote(loanId, penaltyAmount) {
  const { data } = await http.get(`${PREFIX}/loans/${loanId}/payoff-quote`, {
    params: penaltyAmount !== undefined ? { penaltyAmount } : {},
  });
  return data.data;
}

export async function executeEarlyPayoff(loanId, payload) {
  await http.post(`${PREFIX}/loans/${loanId}/early-payoff`, payload);
}

/* ─────────────── Wallet de remboursement ─────────────── */

export async function getWalletSummary() {
  const { data } = await http.get(`${PREFIX}/wallet`);
  return data.data;
}

/**
 * Compte de destination des versements actuellement enregistré.
 * `configured` indique si canal + numéro sont renseignés, `recipientRegistered`
 * si le destinataire Paystack existe déjà (retrait immédiat possible).
 */
export async function getPayoutAccount() {
  const { data } = await http.get(`${PREFIX}/payout-account`);
  return data.data;
}

/** @param {{payoutChannel:'MOBILE_MONEY'|'BANK_ACCOUNT',accountNumber:string,providerCode:string,accountName:string}} payload */
export async function configurePayoutAccount(payload) {
  await http.put(`${PREFIX}/payout-account`, payload);
}

/** Historique des versements, du plus récent au plus ancien. */
export async function listPayouts(params = {}) {
  const { data } = await http.get(`${PREFIX}/wallet/payouts`, {
    params: { page: 0, size: 20, ...params },
  });
  return data.data;
}

export async function requestPayout() {
  const { data } = await http.post(`${PREFIX}/wallet/payout`);
  return data.data;
}

export async function getClientWalletHistory(orgId) {
  const { data } = await http.get(`${PREFIX}/wallet/clients/${orgId}`);
  return data.data;
}

export async function reconcileWalletTransactions(olderThanMinutes = 3) {
  const { data } = await http.post(`${PREFIX}/wallet/reconcile`, null, {
    params: { olderThanMinutes },
  });
  return data.data;
}

/* ─────────────── Tendance du portefeuille ─────────────── */

/**
 * Agrégat mensuel sur tout le portefeuille financé par l'établissement.
 * `collectedAmount` ne compte que les rechargements wallet Paystack réussis :
 * les remboursements saisis manuellement n'y figurent pas.
 * @param {number} months 1 à 24 (défaut 6)
 */
export async function getBankActivityTrend(months = 6) {
  const { data } = await http.get(`${PREFIX}/activity-trend`, { params: { months } });
  return data.data;
}

/* ─────────────── Alertes de risque ─────────────── */

/** @param {{page?:number,size?:number,resolved?:boolean}} params */
export async function getRiskAlerts(params = {}) {
  const { data } = await http.get(`${PREFIX}/risk-alerts`, { params });
  return data.data;
}

export async function getUnresolvedRiskAlertsCount() {
  const { data } = await http.get(`${PREFIX}/risk-alerts/count`);
  return data.data;
}

export async function resolveRiskAlert(id) {
  const { data } = await http.post(`${PREFIX}/risk-alerts/${id}/resolve`);
  return data.data;
}
