// [shared/date-utils.ts] - Version 1.1 - Correction des dates pour utiliser UTC
import { addWeeks, isBefore, startOfWeek } from 'date-fns';

/**
 * Définit les dates de début des semaines de pause qui ne doivent pas être comptabilisées.
 * Les dates sont définies en UTC pour éviter les problèmes de fuseau horaire.
 * Note: Le mois dans Date.UTC est 0-indexé (0 = Janvier, 11 = Décembre).
 */
export const HOLIDAY_WEEKS_STARTS = new Set([
  // Semaine de Noël (21 déc 2025 tombe un dimanche)
  startOfWeek(new Date(Date.UTC(2025, 11, 21))).getTime(),
  // Semaine du Nouvel An (28 déc 2025 tombe un dimanche)
  startOfWeek(new Date(Date.UTC(2025, 11, 28))).getTime(),
  // Semaine de relâche (1er mars 2026 tombe un dimanche)
  startOfWeek(new Date(Date.UTC(2026, 2, 1))).getTime(),
]);

/**
 * Calcule le nombre de semaines actives entre deux dates, en excluant des périodes de pause spécifiques.
 * La logique est basée sur le nombre de débuts de semaine qui précèdent la date de fin.
 *
 * @param startDate - La date de début de la période.
 * @param endDate - La date de fin de la période.
 * @returns Le nombre total de semaines actives, ou 0 si les dates sont invalides.
 */
export function calculateActiveWeeks(startDate: Date | undefined | null, endDate: Date | undefined | null): number {
  // Garde-fou pour s'assurer que les deux dates sont définies.
  if (!startDate || !endDate || isBefore(endDate, startDate)) {
    return 0;
  }

  let activeWeeksCount = 0;
  // On commence l'itération au début de la semaine de la date de départ.
  let currentWeekStart = startOfWeek(startDate);

  // On boucle tant que le début de la semaine en cours est strictement avant la date de fin.
  // Cela aligne le calcul sur la durée réelle de l'intervalle.
  while (isBefore(currentWeekStart, endDate)) {
    // On vérifie si le timestamp du début de la semaine courante n'est pas dans notre liste de pauses.
    if (!HOLIDAY_WEEKS_STARTS.has(currentWeekStart.getTime())) {
      activeWeeksCount++;
    }

    // On passe à la semaine suivante.
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }

  return activeWeeksCount;
}