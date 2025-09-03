// [client/src/lib/excel-export.ts] - Version 1.0 - Module initial pour l'export Excel
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BudgetFormData, BudgetResults } from '../types/budget';

/**
 * Formate une valeur monétaire en tant que nombre pour Excel.
 * @param value La valeur numérique à formater.
 * @returns Un objet cellule pour xlsx avec le type nombre et le format monétaire.
 */
const formatCurrencyCell = (value: number) => {
  return { t: 'n', v: value, z: '#,##0.00" $"'.replace('.', ',') };
};

/**
 * Crée et télécharge un fichier Excel à partir des données du budget.
 * @param formData - Les données du formulaire de configuration.
 * @param results - Les résultats des calculs du budget.
 * @param modelName - Le nom du modèle, utilisé pour le nom du fichier.
 */
export const exportToExcel = (formData: BudgetFormData, results: BudgetResults, modelName: string): void => {
  // 1. Définir les données sous forme de tableau de tableaux
  const data: (string | number | null | { t: string; v: number | string; z?: string })[][] = [
    // --- Section 1: Paramètres de Configuration ---
    [{ t: 's', v: 'Paramètres de Configuration', s: { font: { bold: true } } }, null],
    [], // Ligne vide
    ['Année scolaire', formData.seasonYear],
    ['Nom de l\'école', formData.schoolName],
    ['Code d\'identification', formData.schoolCode],
    ['Discipline', formData.discipline],
    ['Sexe', formData.gender],
    ['Catégorie', formData.category],
    ['Niveau', formData.level],
    [],
    ['Taux horaire Chef ($/h)', formData.headCoachRate],
    ['Taux horaire Adjoint ($/h)', formData.assistantCoachRate],
    ['Part employeur (%)', formData.employerContributionRate],
    [],
    [
      'Période de la saison',
      formData.seasonStartDate && formData.seasonEndDate
        ? `${format(formData.seasonStartDate, 'd MMM yyyy', { locale: fr })} - ${format(
            formData.seasonEndDate,
            'd MMM yyyy',
            { locale: fr }
          )}`
        : 'N/A',
    ],
    ['Entraînements / semaine', formData.practicesPerWeek],
    ['Durée entraînement (heures)', formData.practiceDuration],
    ['Nombre de matchs', formData.numGames],
    ['Durée match (heures)', formData.gameDuration],
    [],
    [
      'Période des séries',
      formData.playoffStartDate && formData.playoffEndDate
        ? `${format(formData.playoffStartDate, 'd MMM yyyy', { locale: fr })} - ${format(
            formData.playoffEndDate,
            'd MMM yyyy',
            { locale: fr }
          )}`
        : 'N/A',
    ],
    ['Jours de finales', formData.playoffFinalDays],
    ['Durée jour de finale (heures)', formData.playoffFinalsDuration],
    [],
    ['Frais Tournoi ($)', formatCurrencyCell(formData.tournamentBonus)],
    ['Frais Fédération (RSEQ) ($)', formatCurrencyCell(formData.federationFee)],
    ['Frais de transport ($)', formatCurrencyCell(formData.transportationFee)],
    [],
    [], // Double ligne vide pour séparer les sections

    // --- Section 2: Répartition des Coûts ---
    [{ t: 's', v: 'Répartition des Coûts', s: { font: { bold: true } } }, null],
    [], // Ligne vide
    [
      { t: 's', v: 'Poste de Dépense', s: { font: { bold: true } } },
      { t: 's', v: 'Coût Total', s: { font: { bold: true } } },
    ],
    // Saison Régulière
    [{ t: 's', v: 'Saison Régulière', s: { font: { bold: true } } }, null],
    ['Entraînements (Saison régulière)', formatCurrencyCell(results.costSeasonPractices)],
    ['Matchs (Saison régulière)', formatCurrencyCell(results.costSeasonGames)],
    ['Frais Tournoi', formatCurrencyCell(results.tournamentBonus)],
    ['Frais de transport', formatCurrencyCell(formData.transportationFee)],
    ['Frais de Fédération (RSEQ)', formatCurrencyCell(results.federationFee)],
    [
      { t: 's', v: 'Sous-total Saison Régulière', s: { font: { bold: true } } },
      { ...formatCurrencyCell(results.subTotalRegularSeason), s: { font: { bold: true } } },
    ],
    [], // Ligne vide
    // Séries (Playoffs)
    [{ t: 's', v: 'Séries (Playoffs)', s: { font: { bold: true } } }, null],
    ['Entraînements (Séries)', formatCurrencyCell(results.costPlayoffPractices)],
    ['Journées de finales (Séries)', formatCurrencyCell(results.costPlayoffFinals)],
    [
      { t: 's', v: 'Sous-total Séries', s: { font: { bold: true } } },
      { ...formatCurrencyCell(results.subTotalPlayoffs), s: { font: { bold: true } } },
    ],
    [], // Ligne vide
    // Total
    [
      { t: 's', v: 'BUDGET TOTAL', s: { font: { bold: true } } },
      { ...formatCurrencyCell(results.grandTotal), s: { font: { bold: true } } },
    ],
  ];

  // 2. Créer la feuille de calcul
  const worksheet = XLSX.utils.aoa_to_sheet(data, { cellStyles: true });

  // 3. Appliquer le formatage (largeur des colonnes, fusion de cellules)
  worksheet['!cols'] = [{ wch: 45 }, { wch: 20 }];

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Titre 'Paramètres de Configuration'
    { s: { r: 28, c: 0 }, e: { r: 28, c: 1 } }, // Titre 'Répartition des Coûts'
    { s: { r: 31, c: 0 }, e: { r: 31, c: 1 } }, // Sous-titre 'Saison Régulière'
    { s: { r: 39, c: 0 }, e: { r: 39, c: 1 } }, // Sous-titre 'Séries (Playoffs)'
  ];

  // 4. Créer le classeur et ajouter la feuille
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');

  // 5. Générer et déclencher le téléchargement du fichier
  const fileName = `Budget - ${modelName.replace(/ /g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};