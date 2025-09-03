// [client/src/hooks/useBudgetCalculator.ts] - Version 15.0 - Correction de la logique de liaison des dates
import { useState, useEffect, useCallback } from 'react';
import type { BudgetFormData, BudgetResults } from '../types/budget';
import { calculateActiveWeeks } from '../lib/date-utils';
import { addDays, startOfWeek } from 'date-fns'; // MODIFIÉ: Ajout de 'addDays'

/**
 * L'état initial par défaut pour le formulaire du calculateur de budget.
 */
const defaultInitialState: BudgetFormData = {
  schoolName: 'Marie-Rivier',
  schoolCode: '055',
  discipline: 'Handball',
  level: 'Tous',
  category: 'D4',
  gender: 'Féminin',
  seasonYear: '2025-2026',
  headCoachRate: 35,
  assistantCoachRate: 27,
  employerContributionRate: 0,
  seasonStartDate: startOfWeek(new Date('2025-09-14'), { weekStartsOn: 0 }),
  seasonEndDate: startOfWeek(new Date('2026-03-23'), { weekStartsOn: 0 }),
  practicesPerWeek: 2,
  practiceDuration: 1.5,
  numGames: 12,
  gameDuration: 3.5,
  playoffStartDate: startOfWeek(new Date('2026-03-29'), { weekStartsOn: 0 }),
  playoffEndDate: startOfWeek(new Date('2026-05-12'), { weekStartsOn: 0 }),
  playoffFinalDays: 2,
  playoffFinalsDuration: 8,
  tournamentBonus: 500,
  federationFee: 1148,
  transportationFee: 0,
};

/**
 * Hook personnalisé pour gérer la logique du calculateur de budget d'équipe sportive.
 */
export function useBudgetCalculator(initialState?: Partial<BudgetFormData>) {
  const [formData, setFormData] = useState<BudgetFormData>({
    ...defaultInitialState,
    ...initialState,
  });

  const [results, setResults] = useState<BudgetResults>({
    costSeasonHeadCoach: 0,
    costSeasonAssistantCoach: 0,
    costPlayoffsHeadCoach: 0,
    costPlayoffsAssistantCoach: 0,
    tournamentBonus: 0,
    federationFee: 0,
    grandTotal: 0,
    activeSeasonWeeks: 0,
    activePlayoffWeeks: 0,
    subTotalRegularSeason: 0,
    subTotalPlayoffs: 0,
  });

  const calculateBudget = useCallback(() => {
    // --- Calculs de base ---
    const salaryMultiplier = 1 + formData.employerContributionRate / 100;
    const activeSeasonWeeks = calculateActiveWeeks(formData.seasonStartDate, formData.seasonEndDate);
    const activePlayoffWeeks = calculateActiveWeeks(formData.playoffStartDate, formData.playoffEndDate);

    // --- Calculs des heures totales par phase (pour une équipe) ---
    const totalSeasonHours =
      activeSeasonWeeks * formData.practicesPerWeek * formData.practiceDuration +
      formData.numGames * formData.gameDuration;

    const totalPlayoffsHours =
      activePlayoffWeeks * formData.practicesPerWeek * formData.practiceDuration +
      formData.playoffFinalDays * formData.playoffFinalsDuration;

    // --- Calcul des coûts par rôle (pour UNE SEULE équipe) ---
    const costSeasonHeadCoach = totalSeasonHours * formData.headCoachRate * salaryMultiplier;
    const costSeasonAssistantCoach = totalSeasonHours * formData.assistantCoachRate * salaryMultiplier;
    const costPlayoffsHeadCoach = totalPlayoffsHours * formData.headCoachRate * salaryMultiplier;
    const costPlayoffsAssistantCoach = totalPlayoffsHours * formData.assistantCoachRate * salaryMultiplier;

    // --- Calcul des sous-totaux et total (pour UNE SEULE équipe) ---
    const subTotalRegularSeason =
      costSeasonHeadCoach +
      costSeasonAssistantCoach +
      formData.tournamentBonus +
      formData.transportationFee +
      formData.federationFee;

    const subTotalPlayoffs = costPlayoffsHeadCoach + costPlayoffsAssistantCoach;
    const grandTotal = subTotalRegularSeason + subTotalPlayoffs;

    // MISE À JOUR de l'objet de résultats
    setResults({
      costSeasonHeadCoach,
      costSeasonAssistantCoach,
      costPlayoffsHeadCoach,
      costPlayoffsAssistantCoach,
      tournamentBonus: formData.tournamentBonus,
      federationFee: formData.federationFee,
      grandTotal,
      activeSeasonWeeks,
      activePlayoffWeeks,
      subTotalRegularSeason,
      subTotalPlayoffs,
    });
  }, [formData]);

  const handleInputChange = useCallback((field: keyof BudgetFormData, value: string | number | Date | undefined) => {
    const isNumericField = typeof defaultInitialState[field] === 'number' && typeof value === 'string';

    setFormData(prev => ({
      ...prev,
      [field]: isNumericField ? Number(value) : value,
    }));
  }, []);

  // MODIFIÉ: La logique assure maintenant que les séries commencent la semaine SUIVANT la fin de saison.
  useEffect(() => {
    if (formData.seasonEndDate) {
      // Le lendemain de la fin de saison
      const dayAfterSeasonEnd = addDays(formData.seasonEndDate, 1);
      // On s'assure de commencer au début de la semaine qui suit
      const startOfPlayoffWeek = startOfWeek(dayAfterSeasonEnd, { weekStartsOn: 0 });
      handleInputChange('playoffStartDate', startOfPlayoffWeek);
    }
  }, [formData.seasonEndDate, handleInputChange]);

  useEffect(() => {
    calculateBudget();
  }, [calculateBudget]);

  const formatCurrency = useCallback((value: number): string => {
    // Arrondit à l'entier le plus proche et formate sans décimales.
    return Math.round(value).toFixed(0) + ' $';
  }, []);

  return {
    formData,
    results,
    handleInputChange,
    formatCurrency,
    setFormData,
  };
}