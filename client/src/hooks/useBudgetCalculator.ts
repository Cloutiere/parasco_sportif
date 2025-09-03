// [client/src/hooks/useBudgetCalculator.ts] - Version 6.0 - Intégration du calcul des frais administratifs

import { useState, useEffect, useCallback } from 'react';
import type { BudgetFormData, BudgetResults } from '../types/budget';
import { calculateActiveWeeks } from '../lib/date-utils';
import { startOfWeek } from 'date-fns';

/**
 * L'état initial par défaut pour le formulaire du calculateur de budget.
 */
const defaultInitialState: BudgetFormData = {
  discipline: 'Handball',
  level: 'Tous',
  category: 'D4',
  headCoachRate: 35,
  assistantCoachRate: 27,
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
  // NOUVEAU : Ajout de la valeur par défaut pour les frais administratifs.
  administrativeFeePercentage: 15,
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
    costSeasonPractices: 0,
    costSeasonGames: 0,
    costPlayoffPractices: 0,
    costPlayoffFinals: 0,
    totalCoachingSalaries: 0,
    tournamentBonus: 0,
    federationFee: 0,
    grandTotal: 0,
    activeSeasonWeeks: 0,
    activePlayoffWeeks: 0,
    // NOUVEAU : Initialisation du montant des frais administratifs.
    administrativeFeeAmount: 0,
  });

  const calculateBudget = useCallback(() => {
    const activeSeasonWeeks = calculateActiveWeeks(formData.seasonStartDate, formData.seasonEndDate);
    const activePlayoffWeeks = calculateActiveWeeks(formData.playoffStartDate, formData.playoffEndDate);

    const totalCoachRatePerHour = formData.headCoachRate + formData.assistantCoachRate;

    const totalPracticeHoursSeason = activeSeasonWeeks * formData.practicesPerWeek * formData.practiceDuration;
    const costSeasonPractices = totalPracticeHoursSeason * totalCoachRatePerHour;

    const totalGameHoursSeason = formData.numGames * formData.gameDuration;
    const costSeasonGames = totalGameHoursSeason * totalCoachRatePerHour;

    const totalPracticeHoursPlayoffs = activePlayoffWeeks * formData.practicesPerWeek * formData.practiceDuration;
    const costPlayoffPractices = totalPracticeHoursPlayoffs * totalCoachRatePerHour;

    const totalPlayoffFinalHours = formData.playoffFinalDays * formData.playoffFinalsDuration;
    const costPlayoffFinals = totalPlayoffFinalHours * totalCoachRatePerHour;

    const totalCoachingSalaries = costSeasonPractices + costSeasonGames + costPlayoffPractices + costPlayoffFinals;

    // NOUVEAU : Calcul du montant des frais administratifs basé sur le pourcentage.
    const administrativeFeeAmount = (totalCoachingSalaries * formData.administrativeFeePercentage) / 100;

    // MODIFIÉ : Le grand total inclut maintenant les frais administratifs.
    const grandTotal = totalCoachingSalaries + administrativeFeeAmount + formData.tournamentBonus + formData.federationFee;

    setResults({
      costSeasonPractices,
      costSeasonGames,
      costPlayoffPractices,
      costPlayoffFinals,
      totalCoachingSalaries,
      tournamentBonus: formData.tournamentBonus,
      federationFee: formData.federationFee,
      grandTotal,
      activeSeasonWeeks,
      activePlayoffWeeks,
      // NOUVEAU : Mise à jour de l'état des résultats avec le montant calculé.
      administrativeFeeAmount,
    });
  }, [formData]);

  useEffect(() => {
    calculateBudget();
  }, [calculateBudget]);

  const handleInputChange = useCallback((field: keyof BudgetFormData, value: string | number | Date | undefined) => {
    const isNumericField = typeof defaultInitialState[field] === 'number' && typeof value === 'string';

    setFormData(prev => ({
      ...prev,
      [field]: isNumericField ? Number(value) : value
    }));
  }, []);

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