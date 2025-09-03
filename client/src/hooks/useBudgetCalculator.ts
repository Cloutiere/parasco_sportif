// [client/src/hooks/useBudgetCalculator.ts] - Version 4.0 - Gestion des plages de dates

import { useState, useEffect, useCallback } from 'react';
import type { BudgetFormData, BudgetResults } from '../types/budget';
import { calculateActiveWeeks } from '../lib/date-utils';
// NOUVEAU : Importations pour la gestion des plages de dates
import { type DateRange } from 'react-day-picker';
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
  });

  const calculateBudget = useCallback(() => {
    // ... (la logique de calcul reste inchangée)
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
      activeSeasonWeeks,
      activePlayoffWeeks,
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

  /**
   * NOUVEAU : Gère la mise à jour d'une plage de dates en appliquant la logique métier
   * de sélection au début de la semaine.
   */
  const handleDateRangeChange = useCallback(
    (
      range: DateRange | undefined,
      startField: keyof BudgetFormData,
      endField: keyof BudgetFormData
    ) => {
      const fromDate = range?.from;
      const toDate = range?.to;

      // Applique la règle : la date sélectionnée est toujours le début de la semaine (dimanche)
      const newStartDate = fromDate ? startOfWeek(fromDate, { weekStartsOn: 0 }) : undefined;
      const newEndDate = toDate ? startOfWeek(toDate, { weekStartsOn: 0 }) : newStartDate; // Si 'to' est indéfini, on le met égal à 'from'

      setFormData(prev => ({
        ...prev,
        [startField]: newStartDate,
        [endField]: newEndDate,
      }));
    },
    []
  );

  const formatCurrency = useCallback((value: number): string => {
    return value.toFixed(2).replace('.', ',') + ' $';
  }, []);

  return {
    formData,
    results,
    handleInputChange,
    // NOUVEAU : Exposition de la nouvelle fonction
    handleDateRangeChange,
    formatCurrency,
  };
}