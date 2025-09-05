// [server/storage.ts] - Version 14.0 - Centralisation de la logique de tri des modèles de budget
import Database from "@replit/database";
import {
  type BudgetModel,
  type DetailedReportLine,
  type InsertBudgetModel,
  type InsertUser,
  type User,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { calculateActiveWeeks } from "@shared/date-utils";

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
  clearAllBudgetModels(): Promise<{ success: boolean; deletedCount: number }>;

  // Reporting methods
  getBudgetSummaryByDiscipline(): Promise<{ discipline: string; totalCost: number }[]>;
  getDetailedReport(): Promise<DetailedReportLine[]>;
}

/**
 * Implémentation du stockage utilisant la base de données clé-valeur persistante de Replit.
 */
export class ReplitDbStorage implements IStorage {
  private db: Database;
  private BUDGET_MODEL_PREFIX = "budget_model_";
  private USER_PREFIX = "user_";

  /**
   * Ordre de tri personnalisé pour les niveaux.
   */
  private static readonly _LEVEL_ORDER: { [key: string]: number } = {
    'Atome': 1,
    'Benjamin': 2,
    'Cadet': 3,
    'Juvénile': 4,
    'Tous': 5,
  };

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

  /**
   * Trie un tableau d'entités (modèles de budget ou lignes de rapport)
   * par discipline (alphabétique) puis par niveau (ordre personnalisé).
   * @param entities Le tableau d'entités à trier.
   * @returns Le tableau d'entités trié.
   */
  private _sortBudgetEntities<T extends { discipline: string; level: string }>(entities: T[]): T[] {
    return entities.sort((a, b) => {
      // 1. Tri principal par discipline (alphabétique)
      const disciplineComparison = a.discipline.localeCompare(b.discipline);
      if (disciplineComparison !== 0) {
        return disciplineComparison;
      }

      // 2. Tri secondaire par niveau (ordre personnalisé)
      const levelAOrder = ReplitDbStorage._LEVEL_ORDER[a.level] || 99;
      const levelBOrder = ReplitDbStorage._LEVEL_ORDER[b.level] || 99;
      return levelAOrder - levelBOrder;
    });
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
    const hydratedModels = rawModels.map((model: any) => this._hydrateModel(model));
    // Trier les modèles avant de les retourner
    return this._sortBudgetEntities(hydratedModels);
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

  async clearAllBudgetModels(): Promise<{ success: boolean; deletedCount: number }> {
    const keysResult: any = await this.db.list(this.BUDGET_MODEL_PREFIX);
    if (!keysResult?.ok || !Array.isArray(keysResult.value) || keysResult.value.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    console.log("DEBUG: Clearing all budget models, keys found:", keysResult.value);

    // Supprimer chaque clé une par une
    const deletePromises = keysResult.value.map((key: string) => this.db.delete(key));
    await Promise.all(deletePromises);

    return { success: true, deletedCount: keysResult.value.length };
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
        Number(model.federationFee); // Retrait de transportationFee

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

  async getDetailedReport(): Promise<DetailedReportLine[]> {
    const allModels = await this.getBudgetModels(); // Utilise getBudgetModels qui retourne déjà des modèles triés
    const reportLines: DetailedReportLine[] = [];

    for (const model of allModels) {
      // --- Calculs de base ---
      const salaryMultiplier = 1 + Number(model.employerContributionRate) / 100;
      const activeSeasonWeeks = calculateActiveWeeks(model.seasonStartDate, model.seasonEndDate);
      const activePlayoffWeeks = calculateActiveWeeks(model.playoffStartDate, model.playoffEndDate);

      // --- Calculs des heures totales par phase (pour une équipe) ---
      const totalSeasonHours =
        (activeSeasonWeeks * model.practicesPerWeek * Number(model.practiceDuration)) +
        (model.numGames * Number(model.gameDuration));

      const totalPlayoffsHours =
        (activePlayoffWeeks * model.practicesPerWeek * Number(model.practiceDuration)) +
        (model.playoffFinalDays * Number(model.playoffFinalsDuration));

      // --- Calcul des coûts par rôle et frais (pour UNE SEULE équipe) ---
      const costSeasonHeadCoach = totalSeasonHours * Number(model.headCoachRate) * salaryMultiplier;
      const costSeasonAssistantCoach = totalSeasonHours * Number(model.assistantCoachRate) * salaryMultiplier;
      const costPlayoffsHeadCoach = totalPlayoffsHours * Number(model.headCoachRate) * salaryMultiplier;
      const costPlayoffsAssistantCoach = totalPlayoffsHours * Number(model.assistantCoachRate) * salaryMultiplier;
      const tournamentBonus = Number(model.tournamentBonus);
      const federationFee = Number(model.federationFee);

      // --- Calcul des sous-totaux et total (pour UNE SEULE équipe) ---
      const subTotalRegularSeason =
        costSeasonHeadCoach +
        costSeasonAssistantCoach +
        tournamentBonus +
        federationFee; // Retrait de transportationFee
      const subTotalPlayoffs = costPlayoffsHeadCoach + costPlayoffsAssistantCoach;
      const grandTotal = subTotalRegularSeason + subTotalPlayoffs;

      const singleTeamReportLine: DetailedReportLine = {
        modelId: model.id,
        discipline: model.discipline,
        gender: model.gender,
        category: model.category,
        level: model.level,
        numberOfTeams: model.numberOfTeams,

        seasonStartDate: model.seasonStartDate,
        seasonEndDate: model.seasonEndDate,
        playoffEndDate: model.playoffEndDate,

        costSeasonHeadCoach,
        costSeasonAssistantCoach,
        tournamentBonus,
        federationFee,
        subTotalRegularSeason,
        costPlayoffsHeadCoach,
        costPlayoffsAssistantCoach,
        subTotalPlayoffs,
        grandTotal,

        // Champs de configuration ajoutés pour l'export détaillé
        headCoachRate: Number(model.headCoachRate),
        assistantCoachRate: Number(model.assistantCoachRate),
        employerContributionRate: Number(model.employerContributionRate),
        practicesPerWeek: model.practicesPerWeek,
        practiceDuration: Number(model.practiceDuration),
        numGames: model.numGames,
        gameDuration: Number(model.gameDuration),
        playoffFinalDays: model.playoffFinalDays,
        playoffFinalsDuration: Number(model.playoffFinalsDuration),
        transportationFee: Number(model.transportationFee),
      };

      // Dupliquer la ligne pour chaque équipe définie dans le modèle
      for (let i = 0; i < model.numberOfTeams; i++) {
        reportLines.push(singleTeamReportLine);
      }
    }

    // Trier les résultats finaux avant de les retourner
    // Puisque `allModels` est déjà trié via `getBudgetModels`, les `reportLines` résultantes
    // (qui sont basées sur `allModels` et créées dans le même ordre) sont déjà triées.
    // Cependant, si la logique de "duplication pour chaque équipe" change l'ordre
    // ou si `getDetailedReport` devait être appelée indépendamment de `getBudgetModels`
    // (ce qui n'est pas le cas ici), il serait pertinent de trier à nouveau.
    // Pour la robustesse, nous allons maintenir l'appel à _sortBudgetEntities.
    return this._sortBudgetEntities(reportLines);
  }
}

// Export persistent storage implementation
export const storage = new ReplitDbStorage();