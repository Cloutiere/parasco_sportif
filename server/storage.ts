// [server/storage.ts] - Version 6.0 - Implémentation ReplitDbStorage persistante
import Database from "@replit/database";
import {
  type BudgetModel,
  type InsertBudgetModel,
  type InsertUser,
  type User,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { differenceInCalendarWeeks } from "date-fns";

/**
 * Calcule le nombre de semaines actives entre deux dates, en ignorant les semaines de congé.
 * @param start - La date de début.
 * @param end - La date de fin.
 * @returns Le nombre de semaines actives.
 */
function calculateActiveWeeks(start: Date | null, end: Date | null): number {
  if (!start || !end || start > end) {
    return 0;
  }
  // +1 car differenceInCalendarWeeks est exclusif (0 pour la même semaine)
  return differenceInCalendarWeeks(end, start, { weekStartsOn: 0 }) + 1;
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
 * Implémentation du stockage utilisant la base de données clé-valeur persistante de Replit.
 */
export class ReplitDbStorage implements IStorage {
  private db: Database;
  private BUDGET_MODEL_PREFIX = "budget_model_";
  private USER_PREFIX = "user_";

  constructor() {
    this.db = new Database();
  }

  /**
   * Hydrate un modèle de budget brut depuis la BDD en convertissant les chaînes de dates
   * en objets Date.
   */
  private _hydrateModel(rawModel: any): BudgetModel {
    return {
      ...rawModel,
      createdAt: new Date(rawModel.createdAt),
      updatedAt: rawModel.updatedAt ? new Date(rawModel.updatedAt) : null,
      seasonStartDate: rawModel.seasonStartDate ? new Date(rawModel.seasonStartDate) : null,
      seasonEndDate: rawModel.seasonEndDate ? new Date(rawModel.seasonEndDate) : null,
      playoffStartDate: rawModel.playoffStartDate ? new Date(rawModel.playoffStartDate) : null,
      playoffEndDate: rawModel.playoffEndDate ? new Date(rawModel.playoffEndDate) : null,
    };
  }

  // --- User methods (STUB) ---
  async getUser(id: string): Promise<User | undefined> {
    const key = `${this.USER_PREFIX}${id}`;
    const result: any = await this.db.get(key);
    return result?.value || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const keysResult: any = await this.db.list(this.USER_PREFIX);
    if (!keysResult?.ok || !Array.isArray(keysResult.value)) return undefined;
    
    for (const key of keysResult.value) {
      const userResult: any = await this.db.get(key);
      const user = userResult?.value as User;
      if (user && user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      ...insertUser,
    };
    const key = `${this.USER_PREFIX}${id}`;
    await this.db.set(key, user);
    return user;
  }

  // --- BudgetModel methods ---
  async createBudgetModel(modelData: InsertBudgetModel): Promise<BudgetModel> {
    const id = randomUUID();
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
    console.log("DEBUG: Creating model with key:", key);

    const newModel: BudgetModel = {
      ...modelData,
      id,
      createdAt: new Date(),
      updatedAt: null,
      // Valeurs par défaut pour les champs obligatoires
      schoolName: modelData.schoolName || "Marie-Rivier",
      schoolCode: modelData.schoolCode || "055",
      numberOfTeams: modelData.numberOfTeams || 1,
      // Convertir les champs numériques en chaînes pour correspondre au type BudgetModel de la DB
      headCoachRate: String(modelData.headCoachRate),
      assistantCoachRate: String(modelData.assistantCoachRate),
      employerContributionRate: String(modelData.employerContributionRate),
      practiceDuration: String(modelData.practiceDuration),
      gameDuration: String(modelData.gameDuration),
      playoffFinalsDuration: String(modelData.playoffFinalsDuration),
      tournamentBonus: String(modelData.tournamentBonus),
      federationFee: String(modelData.federationFee),
      transportationFee: String(modelData.transportationFee),
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
    const keysResult: any = await this.db.list(this.BUDGET_MODEL_PREFIX);
    if (!keysResult?.ok || !Array.isArray(keysResult.value) || keysResult.value.length === 0) {
      return [];
    }
    const promises = keysResult.value.map((key: string) => this.db.get(key));
    const rawResults = await Promise.all(promises);
    // Extraire les valeurs des objets Result et filtrer les entrées null
    const rawModels = rawResults
      .filter((result: any) => result?.ok && result?.value)
      .map((result: any) => result.value);
    // Hydrater les modèles
    return rawModels.map((model: any) => this._hydrateModel(model));
  }

  async getBudgetModelById(id: string): Promise<BudgetModel | undefined> {
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
    const result: any = await this.db.get(key);
    if (!result?.ok || !result?.value) {
      return undefined;
    }
    return this._hydrateModel(result.value);
  }

  async updateBudgetModel(
    id: string,
    modelData: Partial<InsertBudgetModel>,
  ): Promise<BudgetModel | undefined> {
    const existingModel = await this.getBudgetModelById(id);
    if (!existingModel) {
      return undefined;
    }

    const updatedModel: BudgetModel = {
      ...existingModel,
      ...modelData,
      // Convertir les champs numériques en chaînes si présents
      headCoachRate: modelData.headCoachRate !== undefined ? String(modelData.headCoachRate) : existingModel.headCoachRate,
      assistantCoachRate: modelData.assistantCoachRate !== undefined ? String(modelData.assistantCoachRate) : existingModel.assistantCoachRate,
      employerContributionRate: modelData.employerContributionRate !== undefined ? String(modelData.employerContributionRate) : existingModel.employerContributionRate,
      practiceDuration: modelData.practiceDuration !== undefined ? String(modelData.practiceDuration) : existingModel.practiceDuration,
      gameDuration: modelData.gameDuration !== undefined ? String(modelData.gameDuration) : existingModel.gameDuration,
      playoffFinalsDuration: modelData.playoffFinalsDuration !== undefined ? String(modelData.playoffFinalsDuration) : existingModel.playoffFinalsDuration,
      tournamentBonus: modelData.tournamentBonus !== undefined ? String(modelData.tournamentBonus) : existingModel.tournamentBonus,
      federationFee: modelData.federationFee !== undefined ? String(modelData.federationFee) : existingModel.federationFee,
      transportationFee: modelData.transportationFee !== undefined ? String(modelData.transportationFee) : existingModel.transportationFee,
      updatedAt: new Date(),
    };

    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
    await this.db.set(key, updatedModel);
    return updatedModel;
  }

  async deleteBudgetModel(id: string): Promise<{ success: boolean }> {
    const model = await this.getBudgetModelById(id);
    if (!model) {
      return { success: false };
    }
    const key = `${this.BUDGET_MODEL_PREFIX}${id}`;
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

      const totalPracticeHoursSeason =
        activeSeasonWeeks * model.practicesPerWeek * Number(model.practiceDuration);
      const costSeasonPractices = totalPracticeHoursSeason * totalCoachRatePerHour * salaryMultiplier;

      const totalGameHoursSeason = model.numGames * Number(model.gameDuration);
      const costSeasonGames = totalGameHoursSeason * totalCoachRatePerHour * salaryMultiplier;

      const totalPracticeHoursPlayoffs =
        activePlayoffWeeks * model.practicesPerWeek * Number(model.practiceDuration);
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

// Export persistent storage implementation
export const storage = new ReplitDbStorage();