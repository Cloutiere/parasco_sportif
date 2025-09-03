// [client/src/types/budget.ts] - Version 10.0 - Refonte des coûts par rôle (chef/adjoint)
export interface BudgetFormData {
  schoolName: string;
  schoolCode: string;
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
  // Coûts saison régulière ventilés par rôle
  costSeasonHeadCoach: number;
  costSeasonAssistantCoach: number;

  // Coûts séries ventilés par rôle
  costPlayoffsHeadCoach: number;
  costPlayoffsAssistantCoach: number;

  // Frais fixes
  tournamentBonus: number;
  federationFee: number;

  // Totaux et métriques
  grandTotal: number;
  activeSeasonWeeks: number;
  activePlayoffWeeks: number;
  subTotalRegularSeason: number;
  subTotalPlayoffs: number;
}