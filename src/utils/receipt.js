/**
 * Génération du reçu PDF d'une transaction wallet.
 *
 * Extrait de Detailpme.vue pour être réutilisé ailleurs (ex. simulation dans
 * Wallet) sans dupliquer la mise en page. Toute logique de calcul du montant
 * passe par `formatAmountForPdf` : Intl.NumberFormat('fr-FR') insère une
 * espace fine insécable comme séparateur de milliers, que les polices
 * standards de jsPDF ne savent pas rendre (elle apparaît comme un « / »).
 */
import jsPDF from 'jspdf';
import { formatAmountForPdf, formatDate } from './format';

/**
 * @param {object} item Transaction à imprimer.
 * @param {number} item.amount
 * @param {string} item.status 'SUCCESS' | 'FAILED' | autre
 * @param {string} [item.createdAt]
 * @param {string} [item.paystackReference]
 * @param {string} [item.id]
 * @param {string} [item.loanId]
 * @param {object} [context]
 * @param {string} [context.logoUrl] Image du logo (import Vite), affichée en haut à gauche.
 * @param {string} [context.organizationName] Nom du marchand facturé.
 * @param {string} [context.clientCode]
 * @param {string} [context.phone]
 * @param {boolean} [context.isSimulation] Ajoute un bandeau d'avertissement : le document
 *   ne doit jamais pouvoir être confondu avec une preuve de paiement réelle.
 */
export async function generateTransactionReceipt(item, context = {}) {
  const {
    logoUrl = null,
    organizationName = '—',
    clientCode = null,
    phone = null,
    isSimulation = false,
  } = context;

  try {
    const doc = new jsPDF();

    if (logoUrl) {
      try {
        const img = new Image();
        img.src = logoUrl;
        img.crossOrigin = 'Anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('logo'));
        });
        doc.addImage(img, 'PNG', 20, 10, 60, 20);
      } catch {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Djeli - Fin', 20, 20);
      }
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Djeli - Fin', 20, 20);
    }

    const isSuccess = (item.status || '').toUpperCase() === 'SUCCESS';
    const reference = item.paystackReference || item.id;

    // Bandeau de simulation : impossible à manquer, en haut du document.
    if (isSimulation) {
      doc.setFillColor(217, 119, 6);
      doc.rect(0, 0, 210, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      doc.text('DOCUMENT DE SIMULATION — AUCUNE TRANSACTION RÉELLE', 105, 5.5, { align: 'center' });
      doc.setTextColor(0);
    }

    const topOffset = isSimulation ? 8 : 0;

    let yLeft = 38 + topOffset;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Djeli - Fin', 20, yLeft);
    doc.setFont('helvetica', 'normal');
    yLeft += 5;
    doc.text('Portail Microfinance', 20, yLeft);

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REÇU', 115, 23 + topOffset);
    doc.setFont('helvetica', 'normal');

    let yRight = 32 + topOffset;
    doc.setFontSize(10);
    doc.text(`Référence : ${reference}`, 115, yRight);
    yRight += 5;
    doc.text(`Date : ${formatDate(item.createdAt)}`, 115, yRight);
    yRight += 5;
    doc.text(`Montant : ${formatAmountForPdf(item.amount, { withCurrency: true })}`, 115, yRight);

    if (isSuccess) {
      doc.setFillColor(16, 185, 129);
      doc.setTextColor(255);
      doc.rect(115, yRight + 4, 24, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIRMÉ', 117, yRight + 9.5);
    } else {
      doc.setFillColor(220, 53, 69);
      doc.setTextColor(255);
      doc.rect(115, yRight + 4, 22, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('ÉCHOUÉ', 117, yRight + 9.5);
    }

    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    let yBill = yLeft + 15;
    doc.text('MARCHAND', 20, yBill);
    doc.setFont('helvetica', 'normal');
    yBill += 5;
    doc.text(organizationName, 20, yBill);
    if (clientCode) {
      yBill += 5;
      doc.text(`Code client : ${clientCode}`, 20, yBill);
    }
    if (phone) {
      yBill += 5;
      doc.text(phone, 20, yBill);
    }

    yBill += 15;
    doc.setDrawColor(200);
    doc.line(20, yBill, 190, yBill);
    yBill += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', 20, yBill);
    doc.text('MONTANT (F CFA)', 145, yBill);
    yBill += 2;
    doc.line(20, yBill, 190, yBill);

    yBill += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Remboursement — prêt ${item.loanId?.slice(0, 8) || ''}`, 20, yBill);
    doc.text(formatAmountForPdf(item.amount), 145, yBill);

    yBill += 10;
    doc.line(20, yBill, 190, yBill);
    yBill += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total', 120, yBill);
    doc.text(formatAmountForPdf(item.amount, { withCurrency: true }), 145, yBill);

    yBill += 18;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (isSuccess) {
      doc.text(
        `${formatAmountForPdf(item.amount, { withCurrency: true })} encaissé le ${formatDate(item.createdAt)}.`,
        20,
        yBill
      );
    } else {
      doc.setTextColor(220, 53, 69);
      doc.text(`Transaction échouée le ${formatDate(item.createdAt)}. Aucun montant débité.`, 20, yBill);
    }

    if (isSimulation) {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Ce document est une simulation générée à titre de test et ne constitue pas une preuve de paiement.', 20, yBill + 8);
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Merci pour votre confiance.', 60, 210);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Document généré automatiquement par Djeli - Fin.', 62, 216);

    const filenamePrefix = isSimulation ? 'Simulation' : 'Recu';
    doc.save(`${filenamePrefix}_${reference}.pdf`);
    return true;
  } catch (error) {
    console.error('Erreur PDF :', error);
    return false;
  }
}
