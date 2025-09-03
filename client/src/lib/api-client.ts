// [client/src/lib/api-client.ts] - Version 4.0 - Ajout de la suppression de modèle de budget
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

/**
 * Supprime un modèle de budget sur le serveur.
 * @param modelId - L'identifiant du modèle de budget à supprimer.
 * @returns La réponse brute de l'API (attendue 204 No Content en cas de succès).
 */
export async function deleteBudgetModel(modelId: string): Promise<Response> {
  return await apiRequest('DELETE', `/api/budget-models/${modelId}`);
}

/**
 * Récupère le rapport agrégé des coûts par discipline.
 * @returns Une promesse résolue avec le rapport.
 */
export async function getDisciplineReport(): Promise<{ discipline: string; totalCost: number }[]> {
  const res = await apiRequest('GET', '/api/reports/by-discipline');
  return await res.json();
}