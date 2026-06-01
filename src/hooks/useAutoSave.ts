"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProposalFormState } from "@/types/proposal";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave(
     proposal: ProposalFormState,
     onSaved?: (savedProposal: ProposalFormState) => void,
) {
     const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>("idle");
     const [saveError, setSaveError] = useState<string | null>(null);
     const isFirstRender = useRef(true);
     const supabase = createClient();

     const hasSomeContent =
          proposal.title.trim().length > 0 ||
          proposal.overview.trim().length > 0 ||
          proposal.goals.some((goal) => goal.trim().length > 0) ||
          proposal.timeline.trim().length > 0 ||
          proposal.teamNotes.trim().length > 0;

     const saveProposal = useCallback(
          async (statusOverride?: ProposalFormState["status"]) => {
               if (!proposal.problemId) {
                    return;
               }

               if (statusOverride === undefined && proposal.status !== "draft") {
                    return;
               }

               if (!hasSomeContent) {
                    return;
               }

               setSaveStatus("saving");
               setSaveError(null);

               try {
                    const { data: authData, error: authError } = await supabase.auth.getUser();
                    if (authError || !authData.user) {
                         throw new Error(authError?.message ?? "You must sign in to save the proposal.");
                    }

                    const payload = {
                         id: proposal.id,
                         problem_id: proposal.problemId,
                         title: proposal.title,
                         overview: proposal.overview,
                         goals: proposal.goals,
                         timeline: proposal.timeline,
                         team_notes: proposal.teamNotes,
                         status: statusOverride ?? proposal.status ?? "draft",
                         user_id: authData.user.id,
                    };

                    const normalizedGoals = proposal.goals.filter((goal) => goal.trim().length > 0);
                    const row = {
                         ...payload,
                         goals: normalizedGoals,
                    };

                    const response = proposal.id
                         ? await supabase
                              .from("proposals")
                              .upsert(row, { onConflict: "id" })
                              .select()
                              .single()
                         : await supabase
                              .from("proposals")
                              .insert(row)
                              .select()
                              .single();

                    if (response.error) {
                         throw response.error;
                    }

                    if (!response.data) {
                         throw new Error("Proposal save did not return any data.");
                    }

                    const savedProposal: ProposalFormState = {
                         ...proposal,
                         id: response.data.id,
                         status: (response.data.status as ProposalFormState["status"]) ?? payload.status,
                         goals: Array.isArray(response.data.goals) ? response.data.goals : normalizedGoals,
                    };

                    setSaveStatus("saved");
                    onSaved?.(savedProposal);
                    return savedProposal;
               } catch (error) {
                    const errorMessage =
                         error instanceof Error ? error.message : "Unable to save proposal.";
                    setSaveStatus("error");
                    setSaveError(errorMessage);
                    console.error("Auto-save failed:", error);
               }
          },
          [proposal, hasSomeContent, onSaved, supabase],
     );

     useEffect(() => {
          if (isFirstRender.current) {
               isFirstRender.current = false;
               return;
          }

          const timer = window.setTimeout(() => {
               void saveProposal();
          }, 1500);

          return () => window.clearTimeout(timer);
     }, [proposal, saveProposal]);

     useEffect(() => {
          if (saveStatus !== "saved") {
               return;
          }

          const timer = window.setTimeout(() => {
               setSaveStatus("idle");
          }, 3000);

          return () => window.clearTimeout(timer);
     }, [saveStatus]);

     return { saveStatus, saveError, saveNow: saveProposal };
}
