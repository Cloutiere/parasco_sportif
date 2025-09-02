// [src/hooks/useBudgetCalculator.ts] - Version 1.0 - Extraction de la logique métier dans un hook

import { useState, useEffect, useCallback } from 'react';
import type { BudgetFormData, BudgetResults } from '../types/budget';

/**
 * L'état initial par défaut pour le formulaire du calculateur de budget.
 */
const defaultInitialState: BudgetFormData = {
  discipline: 'Handball',
  level: 'Tous',
  category: 'D4',
  headCoachRate: 35,
  assistantCoachRate: 27,
  seasonWeeks: 25,
  practicesPerWeek: 2,
  practiceDuration: 1.5,
  numGames: 12,
  gameDuration: 3.5,
  playoffWeeks: 2,
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
    const totalCoachRatePerHour = formData.headCoachRate + formData.assistantCoachRate;

    // Coûts de la saison régulière
    const totalPracticeHoursSeason = formData.seasonWeeks * formData.practicesPerWeek * formData.practiceDuration;
    const costSeasonPractices = totalPracticeHoursSeason * totalCoachRatePerHour;

    const totalGameHoursSeason = formData.numGames * formData.gameDuration;
    const costSeasonGames = totalGameHoursSeason * totalCoachRatePerHour;

    // Coûts des séries éliminatoires
    const totalPracticeHoursPlayoffs = formData.playoffWeeks * formData.practicesPerWeek * formData.practiceDuration;
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
  }, [formData]);

  // Recalcule le budget chaque fois que les données du formulaire changent.
  useEffect(() => {
    calculateBudget();
  }, [calculateBudget]);

  /**
   * Met à jour un champ du formulaire.
   */
  const handleInputChange = useCallback((field: keyof BudgetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
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