// [client/src/types/budget.ts] - Version 3.0 - Exposition des semaines actives

export interface BudgetFormData {
  discipline: string;
  level: string;
  category: string;
  headCoachRate: number;
  assistantCoachRate: number;
  seasonStartDate: Date | undefined;
  seasonEndDate: Date | undefined;
  practicesPerWeek: number;
  practiceDuration: number;
  numGames: number;
  gameDuration: number;
  playoffStartDate: Date | undefined;
  playoffEndDate: Date | undefined;
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
  // NOUVEAU : Ajout des semaines actives pour affichage dans l'UI.
  activeSeasonWeeks: number;
  activePlayoffWeeks: number;
}