// [client/src/lib/date-utils.ts] - Version 2.0 - Exportation de la configuration des congés
import { addWeeks, isBefore, isEqual, startOfWeek } from 'date-fns';

/**
 * Définit les dates de début des semaines de pause qui ne doivent pas être comptabilisées.
 * Une semaine est définie par son premier jour (dimanche). Si une date de pause tombe
 * n'importe quel jour de la semaine, la semaine entière est exclue.
 */
export const HOLIDAY_WEEKS_STARTS = new Set([
  // Semaine de Noël (21 déc 2025 tombe un dimanche)
  startOfWeek(new Date('2025-12-21')).getTime(),
  // Semaine du Nouvel An (28 déc 2025 tombe un dimanche)
  startOfWeek(new Date('2025-12-28')).getTime(),
  // Semaine de relâche (1er mars 2026 tombe un dimanche)
  startOfWeek(new Date('2026-03-01')).getTime(),
]);

/**
 * Calcule le nombre de semaines actives entre deux dates, en excluant des périodes de pause spécifiques.
 * Une semaine est considérée comme "touchée" par l'intervalle si au moins un jour de cette semaine
 * est inclus dans la plage de dates.
 *
 * @param startDate - La date de début de la période.
 * @param endDate - La date de fin de la période.
 * @returns Le nombre total de semaines actives, ou 0 si les dates sont invalides.
 */
export function calculateActiveWeeks(startDate: Date | undefined, endDate: Date | undefined): number {
  // Garde-fou pour s'assurer que les deux dates sont définies.
  if (!startDate || !endDate || isBefore(endDate, startDate)) {
    return 0;
  }

  let activeWeeksCount = 0;
  // On commence l'itération au début de la semaine de la date de départ.
  let currentWeekStart = startOfWeek(startDate);

  // On boucle tant que le début de la semaine en cours est avant la date de fin.
  // Cela garantit que l'on inclut la semaine de la date de fin, même si elle est partielle.
  while (isBefore(currentWeekStart, endDate) || isEqual(currentWeekStart, endDate)) {
    // On vérifie si le timestamp du début de la semaine courante n'est pas dans notre liste de pauses.
    if (!HOLIDAY_WEEKS_STARTS.has(currentWeekStart.getTime())) {
      activeWeeksCount++;
    }

    // On passe à la semaine suivante.
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }

  return activeWeeksCount;
}