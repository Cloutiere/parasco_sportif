// [server/routes.ts] - Version 2.0 - Ajout de l'endpoint pour le rapport par discipline
import { insertBudgetModelSchema } from "@shared/schema";
import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware essentiel pour parser les corps de requête JSON
  app.use(express.json());

  // --- Reports API Routes ---

  // GET /api/reports/by-discipline: Récupère le rapport agrégé des coûts par discipline
  app.get("/api/reports/by-discipline", async (req, res) => {
    try {
      const summary = await storage.getBudgetSummaryByDiscipline();
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error generating discipline report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // --- Budget Models API Routes ---

  // POST /api/budget-models: Crée un nouveau modèle de budget
  app.post("/api/budget-models", async (req, res) => {
    const validationResult = insertBudgetModelSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.flatten() });
    }

    try {
      const newModel = await storage.createBudgetModel(validationResult.data);
      res.status(201).json(newModel);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/budget-models: Récupère tous les modèles de budget
  app.get("/api/budget-models", async (req, res) => {
    try {
      const models = await storage.getBudgetModels();
      res.status(200).json(models);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // PUT /api/budget-models/:id: Met à jour un modèle de budget existant
  app.put("/api/budget-models/:id", async (req, res) => {
    const { id } = req.params;
    // Nous validons un schéma partiel pour permettre les mises à jour partielles
    const validationResult = insertBudgetModelSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.flatten() });
    }

    try {
      const updatedModel = await storage.updateBudgetModel(
        id,
        validationResult.data,
      );

      if (!updatedModel) {
        return res.status(404).json({ error: `Model with id ${id} not found` });
      }

      res.status(200).json(updatedModel);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // DELETE /api/budget-models/:id: Supprime un modèle de budget
  app.delete("/api/budget-models/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const result = await storage.deleteBudgetModel(id);

      if (!result.success) {
        return res.status(404).json({ error: `Model with id ${id} not found` });
      }

      res.status(204).send(); // 204 No Content
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}