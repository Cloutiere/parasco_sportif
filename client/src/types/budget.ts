// [src/types/budget.ts] - Version 1.0 - Centralisation des types de données du budget

export interface BudgetFormData {
  discipline: string;
  level: string;
  category: string;
  headCoachRate: number;
  assistantCoachRate: number;
  seasonWeeks: number;
  practicesPerWeek: number;
  practiceDuration: number;
  numGames: number;
  gameDuration: number;
  playoffWeeks: number;
  playoffFinalDays: number;
  playoffFinalsDuration: number;
  tournamentBonus: number;
  federationFee: number;
}

export interface BudgetResults {
  costSeasonPractices: number;
  costSeasonGames: number;
  costPlayoffPractices: number;
  costPlayoffFinals: number;
  totalCoachingSalaries: number;
  tournamentBonus: number;
  federationFee: number;
  grandTotal: number;
}