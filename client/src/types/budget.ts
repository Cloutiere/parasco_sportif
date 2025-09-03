// [client/src/types/budget.ts] - Version 4.0 - Ajout des frais administratifs

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
  // NOUVEAU : Pourcentage des frais administratifs.
  administrativeFeePercentage: number;
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
  // NOUVEAU : Montant calculé des frais administratifs.
  administrativeFeeAmount: number;
}