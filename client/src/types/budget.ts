// [client/src/types/budget.ts] - Version 7.0 - Ajout des frais de transport et des sous-totaux
export interface BudgetFormData {
  discipline: string;
  level: string;
  category: string;
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
  transportationFee: number; // NOUVEAU
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
  subTotalRegularSeason: number; // NOUVEAU
  subTotalPlayoffs: number; // NOUVEAU
}