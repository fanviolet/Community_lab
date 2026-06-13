/**
 * Project Types
 * Shared types for project actions
 * This file does NOT use "use server" directive
 */

export type CreateProjectResult =
  | { success: true; projectId: string }
  | { success: false; error: string };

export type PitchReviewResult =
  | { success: true }
  | { success: false; error: string };
