// [client/src/lib/api-client.ts] - Version 2.0 - Ajout de la récupération des modèles de budget
import type { BudgetModel, InsertBudgetModel } from '@shared/schema';
import { apiRequest } from './queryClient';

/**
 * Crée un nouveau modèle de budget sur le serveur.
 * @param data - Les données du modèle de budget à créer.
 * @returns Le modèle de budget nouvellement créé.
 */
export async function createBudgetModel(data: InsertBudgetModel): Promise<BudgetModel> {
  const res = await apiRequest('POST', '/api/budget-models', data);
  return await res.json();
}

/**
 * Récupère la liste de tous les modèles de budget depuis le serveur.
 * @returns Une promesse résolue avec un tableau de modèles de budget.
 */
export async function getBudgetModels(): Promise<BudgetModel[]> {
  const res = await apiRequest('GET', '/api/budget-models');
  return await res.json();
}