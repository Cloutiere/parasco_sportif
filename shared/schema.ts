// [shared/schema.ts] - Version 12.0 - Ajout des champs de configuration à DetailedReportLine pour l'export détaillé
import { sql } from "drizzle-orm";
import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const budgetModels = pgTable("budget_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  schoolName: text("school_name").notNull(),
  schoolCode: text("school_code").notNull(),
  numberOfTeams: integer("number_of_teams").notNull().default(1),

  // Champs dérivés de BudgetFormData
  seasonYear: text("season_year").notNull(),
  gender: text("gender").notNull(),
  discipline: text("discipline").notNull(),
  level: text("level").notNull(),
  category: text("category").notNull(),
  headCoachRate: decimal("head_coach_rate", { precision: 10, scale: 2 }).notNull(),
  assistantCoachRate: decimal("assistant_coach_rate", {
    precision: 10,
    scale: 2,
  }).notNull(),
  employerContributionRate: decimal("employer_contribution_rate", {
    precision: 10,
    scale: 2,
  }).notNull(),
  seasonStartDate: timestamp("season_start_date"),
  seasonEndDate: timestamp("season_end_date"),
  practicesPerWeek: integer("practices_per_week").notNull(),
  practiceDuration: decimal("practice_duration", { precision: 10, scale: 2 }).notNull(),
  numGames: integer("num_games").notNull(),
  gameDuration: decimal("game_duration", { precision: 10, scale: 2 }).notNull(),
  playoffStartDate: timestamp("playoff_start_date"),
  playoffEndDate: timestamp("playoff_end_date"),
  playoffFinalDays: integer("playoff_final_days").notNull(),
  playoffFinalsDuration: decimal("playoff_finals_duration", { precision: 10, scale: 2 }).notNull(),
  tournamentBonus: decimal("tournament_bonus", {
    precision: 10,
    scale: 2,
  }).notNull(),
  federationFee: decimal("federation_fee", {
    precision: 10,
    scale: 2,
  }).notNull(),
  transportationFee: decimal("transportation_fee", {
    precision: 10,
    scale: 2,
  }).notNull(),

  // Métadonnées
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// Schéma pour l'insertion/mise à jour
export const insertBudgetModelSchema = createInsertSchema(budgetModels, {
  // Valeurs par défaut pour les champs école
  schoolName: z.string().default("Marie-Rivier"),
  schoolCode: z.string().default("055"),
  // Coercition pour les dates envoyées en chaîne ISO
  seasonStartDate: z.coerce.date().optional().nullable(),
  seasonEndDate: z.coerce.date().optional().nullable(),
  playoffStartDate: z.coerce.date().optional().nullable(),
  playoffEndDate: z.coerce.date().optional().nullable(),
  // Coercition pour les champs `decimal` envoyés en tant que `number` par le frontend
  headCoachRate: z.coerce.number(),
  assistantCoachRate: z.coerce.number(),
  employerContributionRate: z.coerce.number(),
  practiceDuration: z.coerce.number(),
  gameDuration: z.coerce.number(),
  playoffFinalsDuration: z.coerce.number(),
  tournamentBonus: z.coerce.number(),
  federationFee: z.coerce.number(),
  transportationFee: z.coerce.number(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types dérivés
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBudgetModel = z.infer<typeof insertBudgetModelSchema>;
export type BudgetModel = typeof budgetModels.$inferSelect;

/**
 * Définit la structure d'une ligne de données pour le rapport financier détaillé.
 * La structure est modifiée pour ventiler les coûts salariaux par rôle (chef/adjoint)
 * et inclure les dates clés.
 */
export type DetailedReportLine = {
  modelId: string;
  discipline: string;
  gender: string;
  category: string;
  level: string;
  numberOfTeams: number; // Conserve l'information d'origine du modèle

  // Dates
  seasonStartDate: Date | null;
  seasonEndDate: Date | null;
  playoffEndDate: Date | null;

  // Coûts saison régulière (par équipe)
  costSeasonHeadCoach: number;
  costSeasonAssistantCoach: number;
  tournamentBonus: number;
  federationFee: number;
  subTotalRegularSeason: number;

  // Coûts séries (par équipe)
  costPlayoffsHeadCoach: number;
  costPlayoffsAssistantCoach: number;
  subTotalPlayoffs: number;

  // Total (par équipe)
  grandTotal: number;

  // --- Champs de configuration pour l'export détaillé ---
  headCoachRate?: number | null;
  assistantCoachRate?: number | null;
  employerContributionRate?: number | null;
  practicesPerWeek?: number | null;
  practiceDuration?: number | null;
  numGames?: number | null;
  gameDuration?: number | null;
  playoffFinalDays?: number | null;
  playoffFinalsDuration?: number | null;
  transportationFee?: number | null;
};