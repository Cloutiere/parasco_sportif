// [server/storage.ts] - Version 3.0 - Remplacement de MemStorage par ReplitDbStorage
import Database from "@replit/database";
import {
  type BudgetModel,
  type InsertBudgetModel,
  type InsertUser,
  type User,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { differenceInCalendarWeeks } from 'date-fns';

/**
 * Calcule le nombre de semaines actives entre deux dates, en ignorant les semaines de congé.
 * NOTE : Pour une symétrie parfaite avec le frontend, la liste des congés devrait être partagée.
 * Pour l'instant, cette implémentation est une réplication directe de la logique de base.
 * @param start - La date de début.
 * @param end - La date de fin.
 * @returns Le nombre de semaines actives.
 */
function calculateActiveWeeks(start: Date | null, end: Date | null): number {
  if (!start || !end || start > end) {
    return 0;
  }
  // Les objets Date de ReplitDB peuvent être des strings, il faut s'assurer que ce sont des objets Date
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;

  // +1 car differenceInCalendarWeeks est exclusif (0 pour la même semaine)
  return differenceInCalendarWeeks(endDate, startDate, { weekStartsOn: 0 }) + 1;
}

// L'interface définit le contrat que nos classes de stockage doivent respecter.
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // BudgetModel methods
  createBudgetModel(modelData: InsertBudgetModel): Promise<BudgetModel>;
  getBudgetModels(): Promise<BudgetModel[]>;
  getBudgetModelById(id: string): Promise<BudgetModel | undefined>;
  updateBudgetModel(
    id: string,
    modelData: Partial<InsertBudgetModel>,
  ): Promise<BudgetModel | undefined>;
  deleteBudgetModel(id: string): Promise<{ success: boolean }>;

  // Reporting methods
  getBudgetSummaryByDiscipline(): Promise<{ discipline: string; totalCost: number }[]>;
}

/**
 * Implémentation du stockage utilisant la base de données clé-valeur de Replit.
 */
export class ReplitDbStorage implements IStorage {
  private db: Database;
  private BUDGET_MODEL_PREFIX = "budget_model_";
  private USER_PREFIX = "user_"; // Défini pour le futur

  constructor() {
    this.db = new Database();
  }

  // --- User methods (NON IMPLÉMENTÉ) ---
  async getUser(id: string): Promise<User | undefined> {
    console.warn("STUB: getUser not implemented for ReplitDbStorage");
    throw new Error("Not Implemented");
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.warn("STUB: getUserByUsername not implemented for ReplitDbStorage");
    throw new Error("Not Implemented");
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.warn("STUB: createUser not implemented for ReplitDbStorage");
    throw new Error("Not Implemented");
  }

  // --- BudgetModel methods ---
  async createBudgetModel(modelData: InsertBudgetModel): Promise<BudgetModel> {
    const id = randomUUID();
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;

    const newModel: BudgetModel = {
      ...modelData,
      id,
      createdAt: new Date(),
      updatedAt: null,
      // Les dates sont déjà des objets Date grâce à la coercition de Zod
      seasonStartDate: modelData.seasonStartDate ?? null,
      seasonEndDate: modelData.seasonEndDate ?? null,
      playoffStartDate: modelData.playoffStartDate ?? null,
      playoffEndDate: modelData.playoffEndDate ?? null,
    };

    await this.db.set(key, newModel);
    return newModel;
  }

  async getBudgetModels(): Promise<BudgetModel[]> {
    const keys = await this.db.list({ prefix: this.BUDGET_MODEL_PREFIX });
    if (!keys || keys.length === 0) {
      return [];
    }
    const promises = keys.map(key => this.db.get(key));
    const models = await Promise.all(promises);
    return models as BudgetModel[];
  }

  async getBudgetModelById(id: string): Promise<BudgetModel | undefined> {
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
    const model = await this.db.get(key);
    return model as BudgetModel | undefined;
  }

  async updateBudgetModel(
    id: string,
    modelData: Partial<InsertBudgetModel>,
  ): Promise<BudgetModel | undefined> {
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
    const existingModel = await this.getBudgetModelById(id);
    if (!existingModel) {
      return undefined;
    }

    const updatedModel: BudgetModel = {
      ...existingModel,
      ...modelData,
      updatedAt: new Date(),
    };

    await this.db.set(key, updatedModel);
    return updatedModel;
  }

  async deleteBudgetModel(id: string): Promise<{ success: boolean }> {
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
    // Vérifier si la clé existe avant de supprimer
    const model = await this.getBudgetModelById(id);
    if (!model) {
      return { success: false };
    }
    await this.db.delete(key);
    return { success: true };
  }

  // --- Reporting methods ---
  async getBudgetSummaryByDiscipline(): Promise<{ discipline: string; totalCost: number }[]> {
    const allModels = await this.getBudgetModels();
    const summary = new Map<string, number>();

    for (const model of allModels) {
      // Réplication de la logique de calcul
      const salaryMultiplier = 1 + Number(model.employerContributionRate) / 100;

      const activeSeasonWeeks = calculateActiveWeeks(model.seasonStartDate, model.seasonEndDate);
      const activePlayoffWeeks = calculateActiveWeeks(model.playoffStartDate, model.playoffEndDate);

      const totalCoachRatePerHour = Number(model.headCoachRate) + Number(model.assistantCoachRate);

      const totalPracticeHoursSeason = activeSeasonWeeks * model.practicesPerWeek * Number(model.practiceDuration);
      const costSeasonPractices = totalPracticeHoursSeason * totalCoachRatePerHour * salaryMultiplier;

      const totalGameHoursSeason = model.numGames * Number(model.gameDuration);
      const costSeasonGames = totalGameHoursSeason * totalCoachRatePerHour * salaryMultiplier;

      const totalPracticeHoursPlayoffs = activePlayoffWeeks * model.practicesPerWeek * Number(model.practiceDuration);
      const costPlayoffPractices = totalPracticeHoursPlayoffs * totalCoachRatePerHour * salaryMultiplier;

      const totalPlayoffFinalHours = model.playoffFinalDays * Number(model.playoffFinalsDuration);
      const costPlayoffFinals = totalPlayoffFinalHours * totalCoachRatePerHour * salaryMultiplier;

      const subTotalPlayoffs = costPlayoffPractices + costPlayoffFinals;
      const subTotalRegularSeason =
        costSeasonPractices +
        costSeasonGames +
        Number(model.tournamentBonus) +
        Number(model.transportationFee) +
        Number(model.federationFee);

      const grandTotal = subTotalRegularSeason + subTotalPlayoffs;
      const finalCostForModel = grandTotal * model.numberOfTeams;

      const currentTotal = summary.get(model.discipline) ?? 0;
      summary.set(model.discipline, currentTotal + finalCostForModel);
    }

    return Array.from(summary.entries()).map(([discipline, totalCost]) => ({
      discipline,
      totalCost,
    }));
  }
}

// export class MemStorage implements IStorage {
//   private users: Map<string, User>;
//   private budgetModels: Map<string, BudgetModel>;

//   constructor() {
//     this.users = new Map();
//     this.budgetModels = new Map();
//   }

//   // --- User methods ---
//   async getUser(id: string): Promise<User | undefined> {
//     return this.users.get(id);
//   }

//   async getUserByUsername(username: string): Promise<User | undefined> {
//     return Array.from(this.users.values()).find(
//       (user) => user.username === username,
//     );
//   }

//   async createUser(insertUser: InsertUser): Promise<User> {
//     const id = randomUUID();
//     const user: User = { ...insertUser, id };
//     this.users.set(id, user);
//     return user;
//   }

//   // --- BudgetModel methods ---
//   async createBudgetModel(modelData: InsertBudgetModel): Promise<BudgetModel> {
//     const id = randomUUID();
//     const newModel: BudgetModel = {
//       ...modelData,
//       id,
//       createdAt: new Date(),
//       updatedAt: null,
//       seasonStartDate: modelData.seasonStartDate ? new Date(modelData.seasonStartDate) : null,
//       seasonEndDate: modelData.seasonEndDate ? new Date(modelData.seasonEndDate) : null,
//       playoffStartDate: modelData.playoffStartDate ? new Date(modelData.playoffStartDate) : null,
//       playoffEndDate: modelData.playoffEndDate ? new Date(modelData.playoffEndDate) : null,
//     };
//     this.budgetModels.set(id, newModel);
//     return newModel;
//   }

//   async getBudgetModels(): Promise<BudgetModel[]> {
//     return Array.from(this.budgetModels.values());
//   }

//   async getBudgetModelById(id: string): Promise<BudgetModel | undefined> {
//     return this.budgetModels.get(id);
//   }

//   async updateBudgetModel(
//     id: string,
//     modelData: Partial<InsertBudgetModel>,
//   ): Promise<BudgetModel | undefined> {
//     const existingModel = this.budgetModels.get(id);
//     if (!existingModel) {
//       return undefined;
//     }

//     const updatedModel: BudgetModel = {
//       ...existingModel,
//       ...modelData,
//       updatedAt: new Date(),
//     };

//     this.budgetModels.set(id, updatedModel);
//     return updatedModel;
//   }

//   async deleteBudgetModel(id: string): Promise<{ success: boolean }> {
//     const success = this.budgetModels.delete(id);
//     return { success };
//   }

//   // --- Reporting methods ---
//   async getBudgetSummaryByDiscipline(): Promise<{ discipline: string; totalCost: number }[]> {
//     const allModels = await this.getBudgetModels();
//     const summary = new Map<string, number>();

//     for (const model of allModels) {
//       // Réplication de la logique de calcul de useBudgetCalculator
//       const salaryMultiplier = 1 + Number(model.employerContributionRate) / 100;

//       const activeSeasonWeeks = calculateActiveWeeks(model.seasonStartDate, model.seasonEndDate);
//       const activePlayoffWeeks = calculateActiveWeeks(model.playoffStartDate, model.playoffEndDate);

//       const totalCoachRatePerHour = Number(model.headCoachRate) + Number(model.assistantCoachRate);

//       const totalPracticeHoursSeason = activeSeasonWeeks * model.practicesPerWeek * Number(model.practiceDuration);
//       const costSeasonPractices = totalPracticeHoursSeason * totalCoachRatePerHour * salaryMultiplier;

//       const totalGameHoursSeason = model.numGames * Number(model.gameDuration);
//       const costSeasonGames = totalGameHoursSeason * totalCoachRatePerHour * salaryMultiplier;

//       const totalPracticeHoursPlayoffs = activePlayoffWeeks * model.practicesPerWeek * Number(model.practiceDuration);
//       const costPlayoffPractices = totalPracticeHoursPlayoffs * totalCoachRatePerHour * salaryMultiplier;

//       const totalPlayoffFinalHours = model.playoffFinalDays * Number(model.playoffFinalsDuration);
//       const costPlayoffFinals = totalPlayoffFinalHours * totalCoachRatePerHour * salaryMultiplier;

//       const subTotalPlayoffs = costPlayoffPractices + costPlayoffFinals;
//       const subTotalRegularSeason =
//         costSeasonPractices +
//         costSeasonGames +
//         Number(model.tournamentBonus) +
//         Number(model.transportationFee) +
//         Number(model.federationFee);

//       const grandTotal = subTotalRegularSeason + subTotalPlayoffs;
//       const finalCostForModel = grandTotal * model.numberOfTeams;

//       const currentTotal = summary.get(model.discipline) ?? 0;
//       summary.set(model.discipline, currentTotal + finalCostForModel);
//     }

//     // Conversion de la Map au format de retour attendu
//     return Array.from(summary.entries()).map(([discipline, totalCost]) => ({
//       discipline,
//       totalCost,
//     }));
//   }
// }

// Exportation de la nouvelle implémentation
export const storage = new ReplitDbStorage();