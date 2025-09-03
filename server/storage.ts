// [server/storage.ts] - Version 1.0 - Ajout du CRUD pour les Budget Models
import {
  type BudgetModel,
  type InsertBudgetModel,
  type InsertUser,
  type User,
} from "@shared/schema";
import { randomUUID } from "crypto";

// modifiez l'interface avec toutes les méthodes CRUD nécessaires
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private budgetModels: Map<string, BudgetModel>;

  constructor() {
    this.users = new Map();
    this.budgetModels = new Map();
  }

  // --- User methods ---
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // --- BudgetModel methods ---
  async createBudgetModel(modelData: InsertBudgetModel): Promise<BudgetModel> {
    const id = randomUUID();
    const newModel: BudgetModel = {
      ...modelData,
      id,
      createdAt: new Date(),
      updatedAt: null, // Pas de mise à jour à la création
      // Drizzle s'attend à ce que les décimaux soient des strings, mais en mémoire, nous les traitons comme des nombres
      // Pour une vraie DB, il faudrait s'assurer de la conversion
    };
    this.budgetModels.set(id, newModel);
    return newModel;
  }

  async getBudgetModels(): Promise<BudgetModel[]> {
    return Array.from(this.budgetModels.values());
  }

  async getBudgetModelById(id: string): Promise<BudgetModel | undefined> {
    return this.budgetModels.get(id);
  }

  async updateBudgetModel(
    id: string,
    modelData: Partial<InsertBudgetModel>,
  ): Promise<BudgetModel | undefined> {
    const existingModel = this.budgetModels.get(id);
    if (!existingModel) {
      return undefined;
    }

    const updatedModel: BudgetModel = {
      ...existingModel,
      ...modelData,
      updatedAt: new Date(),
    };

    this.budgetModels.set(id, updatedModel);
    return updatedModel;
  }

  async deleteBudgetModel(id: string): Promise<{ success: boolean }> {
    const success = this.budgetModels.delete(id);
    return { success };
  }
}

export const storage = new MemStorage();