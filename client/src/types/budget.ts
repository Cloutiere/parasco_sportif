// [client/src/types/budget.ts] - Version 6.0 - Réintroduction d'un taux de charges patronales modifiable

export interface BudgetFormData {
  discipline: string;
  level: string;
  category: string;
  headCoachRate: number;
  assistantCoachRate: number;
  // NOUVEAU : Taux des charges patronales (en pourcentage).
  employerContributionRate: number;
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
  activeSeasonWeeks: number;
  activePlayoffWeeks: number;
}