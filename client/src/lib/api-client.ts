// [client/src/lib/api-client.ts] - Version 5.0 - Ajout de la récupération du rapport détaillé
import type { BudgetModel, DetailedReportLine, InsertBudgetModel } from '@shared/schema';
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
 * Met à jour un modèle de budget existant sur le serveur.
 * @param id - L'identifiant du modèle de budget à mettre à jour.
 * @param data - Les données (partielles) du modèle de budget à mettre à jour.
 * @returns Le modèle de budget mis à jour.
 */
export async function updateBudgetModel(id: string, data: Partial<InsertBudgetModel>): Promise<BudgetModel> {
  const res = await apiRequest('PUT', `/api/budget-models/${id}`, data);
  return await res.json();
}

/**
 * Récupère le rapport agrégé des coûts par discipline.
 * @returns Une promesse résolue avec le rapport.
 */
export async function getDisciplineReport(): Promise<{ discipline: string; totalCost: number }[]> {
  const res = await apiRequest('GET', '/api/reports/by-discipline');
  return await res.json();
}

/**
 * Récupère le rapport financier détaillé, ligne par ligne pour chaque modèle.
 * @returns Une promesse résolue avec le rapport détaillé.
 */
export async function getDetailedReport(): Promise<DetailedReportLine[]> {
  const res = await apiRequest('GET', '/api/reports/detailed');
  return await res.json();
}

/**
 * Supprime tous les modèles de budget.
 * @returns Une promesse résolue avec le résultat de l'opération.
 */
export async function clearAllBudgetModels(): Promise<{ success: boolean; deletedCount: number; message: string }> {
  const res = await apiRequest('DELETE', '/api/budget-models');
  return await res.json();
}