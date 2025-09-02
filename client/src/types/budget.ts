// [client/src/types/budget.ts] - Version 2.0 - Remplacement des durées par des plages de dates

export interface BudgetFormData {
  discipline: string;
  level: string;
  category: string;
  headCoachRate: number;
  assistantCoachRate: number;
  // REMPLACÉ : seasonWeeks est maintenant calculé à partir de ces dates.
  seasonStartDate: Date | undefined;
  seasonEndDate: Date | undefined;
  practicesPerWeek: number;
  practiceDuration: number;
  numGames: number;
  gameDuration: number;
  // REMPLACÉ : playoffWeeks est maintenant calculé à partir de ces dates.
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
}