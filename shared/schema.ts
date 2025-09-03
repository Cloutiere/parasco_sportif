// [shared/schema.ts] - Version 1.0 - Ajout du modèle de données pour les Budget Models
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
  numberOfTeams: integer("number_of_teams").notNull().default(1),

  // Champs dérivés de BudgetFormData
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
  practiceDuration: integer("practice_duration").notNull(),
  numGames: integer("num_games").notNull(),
  gameDuration: integer("game_duration").notNull(),
  playoffStartDate: timestamp("playoff_start_date"),
  playoffEndDate: timestamp("playoff_end_date"),
  playoffFinalDays: integer("playoff_final_days").notNull(),
  playoffFinalsDuration: integer("playoff_finals_duration").notNull(),
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
export const insertBudgetModelSchema = createInsertSchema(budgetModels).omit({
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