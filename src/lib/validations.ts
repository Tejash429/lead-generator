// ============================================================
// Zod Validation Schemas
// ============================================================

import { z } from "zod";

export const searchSchema = z.object({
  city: z
    .string()
    .min(2, "City name must be at least 2 characters")
    .max(100, "City name too long")
    .trim(),
  category: z
    .string()
    .min(1, "Please select a business category")
    .trim(),
});

export const saveLeadsSchema = z.object({
  leads: z.array(
    z.object({
      placeId: z.string(),
      businessName: z.string(),
      address: z.string(),
      phone: z.string().nullable(),
      website: z.string().nullable(),
      rating: z.number().nullable(),
      ratingCount: z.number().nullable(),
      category: z.string(),
      city: z.string(),
      hasWebsite: z.boolean(),
      websiteSpeed: z.number().nullable(),
      websiteStatus: z.string().nullable(),
      leadScore: z.number().nullable().optional(),
    })
  ).min(1, "Select at least one lead to save"),
});

export const updateLeadSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "contacted", "responded", "converted", "skipped"]).optional(),
  notes: z.string().optional(),
  lastContactedAt: z.string().datetime().optional(),
  isFavorite: z.boolean().optional(),
});

export const analyzeUrlSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type SaveLeadsInput = z.infer<typeof saveLeadsSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
