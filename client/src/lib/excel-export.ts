// [client/src/lib/excel-export.ts] - Version 4.0 - Ajout de formules dynamiques pour le calcul des semaines
import * as XLSX from 'xlsx';
import type { BudgetFormData, BudgetResults } from '../types/budget';

/**
 * Crée et télécharge un fichier Excel à partir des données du budget.
 * @param formData - Les données du formulaire de configuration.
 * @param results - Les résultats des calculs du budget (utilisé pour les dates).
 * @param modelName - Le nom du modèle, utilisé pour le nom du fichier.
 */
export const exportToExcel = (formData: BudgetFormData, results: BudgetResults, modelName:string): void => {
  // Cell formatters
  const currencyFormat = '#,##0.00" $"'.replace('.', ',');
  const currencyCell = (value: number | string) => {
    if (typeof value === 'number') {
      return { t: 'n', v: value, z: currencyFormat };
    }
    // For formulas
    return { t: 'n', f: value, z: currencyFormat };
  };

  // 1. Définir les données sous forme de tableau de tableaux
  const data: (string | number | null | { t: string; v?: any; f?: string; z?: string; s?: any })[][] = [
    // --- Section 1: Paramètres de Configuration (Indices basés sur 1 pour la lisibilité) ---
    [{ t: 's', v: 'Paramètres de Configuration', s: { font: { bold: true } } }, null], // Ligne 1
    [], // Ligne 2
    ['Année scolaire', formData.seasonYear], // Ligne 3
    ['Nom de l\'école', formData.schoolName], // Ligne 4
    ['Code d\'identification', formData.schoolCode], // Ligne 5
    ['Discipline', formData.discipline], // Ligne 6
    ['Sexe', formData.gender], // Ligne 7
    ['Catégorie', formData.category], // Ligne 8
    ['Niveau', formData.level], // Ligne 9
    [], // Ligne 10
    ['Taux horaire Chef ($/h)', formData.headCoachRate], // Ligne 11 -> B11
    ['Taux horaire Adjoint ($/h)', formData.assistantCoachRate], // Ligne 12 -> B12
    ['Part employeur (%)', formData.employerContributionRate], // Ligne 13 -> B13
    [], // Ligne 14
    ['Date de début de saison', formData.seasonStartDate ? { t: 'd', v: formData.seasonStartDate } : 'N/A'], // Ligne 15 -> B15
    ['Date de fin de saison', formData.seasonEndDate ? { t: 'd', v: formData.seasonEndDate } : 'N/A'], // Ligne 16 -> B16
    ['Semaines actives (Saison)', { t: 'n', f: '(B16-B15)/7' }], // Ligne 17 -> B17 (Formule)
    ['Entraînements / semaine', formData.practicesPerWeek], // Ligne 18 -> B18
    ['Durée entraînement (heures)', formData.practiceDuration], // Ligne 19 -> B19
    ['Nombre de matchs', formData.numGames], // Ligne 20 -> B20
    ['Durée match (heures)', formData.gameDuration], // Ligne 21 -> B21
    [], // Ligne 22
    ['Date de début des séries', formData.playoffStartDate ? { t: 'd', v: formData.playoffStartDate } : 'N/A'], // Ligne 23 -> B23
    ['Date de fin des séries', formData.playoffEndDate ? { t: 'd', v: formData.playoffEndDate } : 'N/A'], // Ligne 24 -> B24
    ['Semaines actives (Séries)', { t: 'n', f: '(B24-B23)/7' }], // Ligne 25 -> B25 (Formule)
    ['Jours de finales', formData.playoffFinalDays], // Ligne 26 -> B26
    ['Durée jour de finale (heures)', formData.playoffFinalsDuration], // Ligne 27 -> B27
    [], // Ligne 28
    ['Frais Tournoi ($)', currencyCell(formData.tournamentBonus)], // Ligne 29 -> B29
    ['Frais Fédération (RSEQ) ($)', currencyCell(formData.federationFee)], // Ligne 30 -> B30
    ['Frais de transport ($)', currencyCell(formData.transportationFee)], // Ligne 31 -> B31
    [], // Ligne 32
    [], // Ligne 33

    // --- Section 2: Répartition des Coûts ---
    [{ t: 's', v: 'Répartition des Coûts', s: { font: { bold: true } } }, null], // Ligne 34
    [], // Ligne 35
    [
      { t: 's', v: 'Poste de Dépense', s: { font: { bold: true } } },
      { t: 's', v: 'Coût Total', s: { font: { bold: true } } },
    ], // Ligne 36
    // Saison Régulière
    [{ t: 's', v: 'Saison Régulière', s: { font: { bold: true } } }, null], // Ligne 37
    ['Entraînements (Saison régulière)', currencyCell('B17*B18*B19*(B11+B12)*(1+B13/100)')], // Ligne 38
    ['Matchs (Saison régulière)', currencyCell('B20*B21*(B11+B12)*(1+B13/100)')], // Ligne 39
    ['Frais Tournoi', currencyCell('B29')], // Ligne 40
    ['Frais de transport', currencyCell('B31')], // Ligne 41
    ['Frais de Fédération (RSEQ)', currencyCell('B30')], // Ligne 42
    [
      { t: 's', v: 'Sous-total Saison Régulière', s: { font: { bold: true } } },
      { ...currencyCell('SUM(B38:B42)'), s: { font: { bold: true } } }, // Ligne 43
    ],
    [], // Ligne 44
    // Séries (Playoffs)
    [{ t: 's', v: 'Séries (Playoffs)', s: { font: { bold: true } } }, null], // Ligne 45
    ['Entraînements (Séries)', currencyCell('B25*B18*B19*(B11+B12)*(1+B13/100)')], // Ligne 46
    ['Journées de finales (Séries)', currencyCell('B26*B27*(B11+B12)*(1+B13/100)')], // Ligne 47
    [
      { t: 's', v: 'Sous-total Séries', s: { font: { bold: true } } },
      { ...currencyCell('SUM(B46:B47)'), s: { font: { bold: true } } }, // Ligne 48
    ],
    [], // Ligne 49
    // Total
    [
      { t: 's', v: 'BUDGET TOTAL', s: { font: { bold: true } } },
      { ...currencyCell('B43+B48'), s: { font: { bold: true } } }, // Ligne 50
    ],
  ];

  // 2. Créer la feuille de calcul
  const worksheet = XLSX.utils.aoa_to_sheet(data, { cellStyles: true });

  // 3. Appliquer le formatage (largeur des colonnes, fusion de cellules)
  worksheet['!cols'] = [{ wch: 45 }, { wch: 20 }];

  // Les indices de fusion restent corrects car la structure n'a pas changé.
  // Note: les indices ici sont basés sur 0. Ligne 34 -> index 33.
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Titre 'Paramètres de Configuration'
    { s: { r: 33, c: 0 }, e: { r: 33, c: 1 } }, // Titre 'Répartition des Coûts'
    { s: { r: 36, c: 0 }, e: { r: 36, c: 1 } }, // Sous-titre 'Saison Régulière'
    { s: { r: 44, c: 0 }, e: { r: 44, c: 1 } }, // Sous-titre 'Séries (Playoffs)'
  ];

  // 4. Créer le classeur et ajouter la feuille
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');

  // 5. Générer et déclencher le téléchargement du fichier
  const fileName = `Budget - ${modelName.replace(/ /g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};