// [client/src/hooks/useBudgetCalculator.ts] - Version 2.0 - Adaptation à la gestion par plages de dates

import { useState, useEffect, useCallback } from 'react';
import type { BudgetFormData, BudgetResults } from '../types/budget';
import { calculateActiveWeeks } from '../lib/date-utils';

/**
 * L'état initial par défaut pour le formulaire du calculateur de budget.
 */
const defaultInitialState: BudgetFormData = {
  discipline: 'Handball',
  level: 'Tous',
  category: 'D4',
  headCoachRate: 35,
  assistantCoachRate: 27,
  // MISE À JOUR : Utilisation des plages de dates
  seasonStartDate: new Date('2025-09-14'),
  seasonEndDate: new Date('2026-03-23'),
  practicesPerWeek: 2,
  practiceDuration: 1.5,
  numGames: 12,
  gameDuration: 3.5,
  // MISE À JOUR : Utilisation des plages de dates
  playoffStartDate: new Date('2026-03-29'),
  playoffEndDate: new Date('2026-05-12'),
  playoffFinalDays: 2,
  playoffFinalsDuration: 8,
  tournamentBonus: 500,
  federationFee: 1148,
};

/**
 * Hook personnalisé pour gérer la logique du calculateur de budget d'équipe sportive.
 * Encapsule l'état du formulaire, les résultats calculés et les fonctions de mise à jour.
 *
 * @param initialState - L'état initial optionnel du formulaire.
 * @returns Un objet contenant l'état du formulaire, les résultats, et les gestionnaires d'événements.
 */
export function useBudgetCalculator(initialState?: Partial<BudgetFormData>) {
  const [formData, setFormData] = useState<BudgetFormData>({
    ...defaultInitialState,
    ...initialState,
  });

  const [results, setResults] = useState<BudgetResults>({
    costSeasonPractices: 0,
    costSeasonGames: 0,
    costPlayoffPractices: 0,
    costPlayoffFinals: 0,
    totalCoachingSalaries: 0,
    tournamentBonus: 0,
    federationFee: 0,
    grandTotal: 0,
  });

  /**
   * Calcule les différents postes de coûts du budget sur la base des données du formulaire.
   */
  const calculateBudget = useCallback(() => {
    // NOUVEAU : Calcul des semaines actives via l'utilitaire de dates
    const activeSeasonWeeks = calculateActiveWeeks(formData.seasonStartDate, formData.seasonEndDate);
    const activePlayoffWeeks = calculateActiveWeeks(formData.playoffStartDate, formData.playoffEndDate);

    const totalCoachRatePerHour = formData.headCoachRate + formData.assistantCoachRate;

    // Coûts de la saison régulière (utilise maintenant activeSeasonWeeks)
    const totalPracticeHoursSeason = activeSeasonWeeks * formData.practicesPerWeek * formData.practiceDuration;
    const costSeasonPractices = totalPracticeHoursSeason * totalCoachRatePerHour;

    const totalGameHoursSeason = formData.numGames * formData.gameDuration;
    const costSeasonGames = totalGameHoursSeason * totalCoachRatePerHour;

    // Coûts des séries éliminatoires (utilise maintenant activePlayoffWeeks)
    const totalPracticeHoursPlayoffs = activePlayoffWeeks * formData.practicesPerWeek * formData.practiceDuration;
    const costPlayoffPractices = totalPracticeHoursPlayoffs * totalCoachRatePerHour;

    const totalPlayoffFinalHours = formData.playoffFinalDays * formData.playoffFinalsDuration;
    const costPlayoffFinals = totalPlayoffFinalHours * totalCoachRatePerHour;

    // Totaux
    const totalCoachingSalaries = costSeasonPractices + costSeasonGames + costPlayoffPractices + costPlayoffFinals;
    const grandTotal = totalCoachingSalaries + formData.tournamentBonus + formData.federationFee;

    setResults({
      costSeasonPractices,
      costSeasonGames,
      costPlayoffPractices,
      costPlayoffFinals,
      totalCoachingSalaries,
      tournamentBonus: formData.tournamentBonus,
      federationFee: formData.federationFee,
      grandTotal,
    });
    // MISE À JOUR : Le tableau de dépendances reflète les nouveaux champs de dates.
  }, [formData]);

  // Recalcule le budget chaque fois que les données du formulaire changent.
  useEffect(() => {
    calculateBudget();
  }, [calculateBudget]);

  /**
   * Met à jour un champ du formulaire. Gère les types string, number et Date.
   */
  const handleInputChange = useCallback((field: keyof BudgetFormData, value: string | number | Date | undefined) => {
    // Pour les champs numériques venant d'un <input>, la valeur est une string qu'il faut convertir.
    const isNumericField = typeof defaultInitialState[field] === 'number' && typeof value === 'string';

    setFormData(prev => ({
      ...prev,
      [field]: isNumericField ? Number(value) : value
    }));
  }, []);

  /**
   * Formate un nombre en chaîne de caractères monétaire (ex: "123,45 $").
   */
  const formatCurrency = useCallback((value: number): string => {
    return value.toFixed(2).replace('.', ',') + ' $';
  }, []);

  return {
    formData,
    results,
    handleInputChange,
    formatCurrency,
  };
}