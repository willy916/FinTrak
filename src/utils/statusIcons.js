/**
 * Icône associée à chaque statut de demande de financement.
 * Centralisé ici pour que la page Demandes et la modale d'instruction
 * restent visuellement cohérentes : une seule ligne à changer par statut.
 */
import iconPending from '@/assets/img/Doc.png';
import iconUnderReview from '@/assets/img/Docs.png';
import iconApproved from '@/assets/img/valide.png';
import iconRejected from '@/assets/img/supp.png';
import iconDisbursed from '@/assets/img/Coins.png';

const STATUS_ICONS = {
  PENDING: iconPending,
  UNDER_REVIEW: iconUnderReview,
  APPROVED: iconApproved,
  REJECTED: iconRejected,
  DISBURSED: iconDisbursed,
  CANCELLED: iconRejected,
};

export function statusIcon(status) {
  return STATUS_ICONS[status] || iconPending;
}

/**
 * Fond de la pastille : noir pour tous les statuts, afin de rester cohérent
 * avec les cartes du tableau de bord et du bloc Statistiques.
 */
export function statusIconBg() {
  return 'bg-black';
}

export default STATUS_ICONS;