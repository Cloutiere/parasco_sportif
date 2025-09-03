// [client/src/types/budget.ts] - Version 9.0 - Ajout des champs d'identification de l'école
export interface BudgetFormData {
  schoolName: string; // NOUVEAU
  schoolCode: string; // NOUVEAU
  discipline: string;
  level: string;
  category: string;
  gender: string;
  seasonYear: string;
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