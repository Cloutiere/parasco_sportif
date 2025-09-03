// [client/src/lib/api-client.ts] - Version 1.0 - Client API pour les modèles de budget
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