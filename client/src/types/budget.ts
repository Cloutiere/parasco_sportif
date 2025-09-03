// [client/src/types/budget.ts] - Version 8.0 - Ajout de 'gender' et 'seasonYear'
export interface BudgetFormData {
  discipline: string;
  level: string;
  category: string;
  gender: string; // NOUVEAU
  seasonYear: string; // NOUVEAU
  headCoachRate: number;
  assistantCoachRate: number;
  employerContributionRate: number;
  seasonStartDate?: Date;
  seasonEndDate?: Date;
  practicesPerWeek: number;
  practiceDuration: number;
  numGames: number;
  gameDuration: number;
  playoffStartDate?: Date;
  playoffEndDate?: Date;
  playoffFinalDays: number;
  playoffFinalsDuration: number;
  tournamentBonus: number;
  federationFee: number;
  transportationFee: number;
}

export interface BudgetResults {
  costSeasonPractices: number;
  costSeasonGames: number;
  costPlayoffPractices: number;
  costPlayoffFinals: number;
  tournamentBonus: number;
  federationFee: number;
  grandTotal: number;
  activeSeasonWeeks: number;
  activePlayoffWeeks: number;
  subTotalRegularSeason: number;
  subTotalPlayoffs: number;
}