"use client";

import { useState } from "react";
import type { ProposalFormState } from "@/types/proposal";

const stepLabels = [
     { id: 1, title: "Overview" },
     { id: 2, title: "Goals" },
     { id: 3, title: "Timeline" },
     { id: 4, title: "Team" },
     { id: 5, title: "Submit" },
] as const;

const defaultProposal: Omit<ProposalFormState, "problemId"> = {
     title: "",
     overview: "",
     goals: [""],
     timeline: "",
     teamNotes: "",
     status: "draft",
};

function normalizeGoals(goals?: string[]) {
     if (!goals || goals.length === 0) {
          return [""];
     }

     return goals.length > 0 ? goals : [""];
}

export function useProposalForm(initialState: Partial<ProposalFormState> = {}) {
     const [state, setState] = useState<ProposalFormState>({
          problemId: initialState.problemId ?? "",
          title: initialState.title ?? defaultProposal.title,
          overview: initialState.overview ?? defaultProposal.overview,
          goals: normalizeGoals(initialState.goals),
          timeline: initialState.timeline ?? defaultProposal.timeline,
          teamNotes: initialState.teamNotes ?? defaultProposal.teamNotes,
          status: initialState.status ?? defaultProposal.status,
          id: initialState.id,
     });
     const [step, setStep] = useState<number>(1);

     const updateField = <K extends keyof ProposalFormState>(
          key: K,
          value: ProposalFormState[K],
     ) => {
          setState((current) => ({ ...current, [key]: value }));
     };

     const setProposalId = (id: string) => {
          setState((current) => ({ ...current, id }));
     };

     const setGoal = (index: number, value: string) => {
          setState((current) => {
               const goals = [...current.goals];
               goals[index] = value;
               return { ...current, goals };
          });
     };

     const addGoal = () => {
          setState((current) => ({ ...current, goals: [...current.goals, ""] }));
     };

     const removeGoal = (index: number) => {
          setState((current) => ({
               ...current,
               goals: current.goals.filter((_, goalIndex) => goalIndex !== index),
          }));
     };

     const isStepValid = (currentStep: number) => {
          switch (currentStep) {
               case 1:
                    return state.title.trim().length > 0 && state.overview.trim().length > 0;
               case 2:
                    return (
                         state.goals.length > 0 &&
                         state.goals.every((goal) => goal.trim().length > 0)
                    );
               case 3:
                    return state.timeline.trim().length > 0;
               case 4:
                    return state.teamNotes.trim().length > 0;
               case 5:
                    return true;
               default:
                    return false;
          }
     };

     const getStepError = (currentStep: number) => {
          switch (currentStep) {
               case 1:
                    if (!state.title.trim()) {
                         return "Please add a proposal title.";
                    }
                    if (!state.overview.trim()) {
                         return "Please write a proposal overview.";
                    }
                    return undefined;
               case 2:
                    if (state.goals.length === 0) {
                         return "Add at least one goal.";
                    }
                    if (state.goals.some((goal) => !goal.trim())) {
                         return "Please fill in every goal or remove empty items.";
                    }
                    return undefined;
               case 3:
                    if (!state.timeline.trim()) {
                         return "Please describe the project timeline.";
                    }
                    return undefined;
               case 4:
                    if (!state.teamNotes.trim()) {
                         return "Please describe team responsibilities or support needs.";
                    }
                    return undefined;
               default:
                    return undefined;
          }
     };

     const nextStep = () => {
          if (!isStepValid(step)) {
               return false;
          }

          setStep((current) => Math.min(current + 1, stepLabels.length));
          return true;
     };

     const prevStep = () => {
          setStep((current) => Math.max(current - 1, 1));
     };

     const goToStep = (target: number) => {
          if (target < 1 || target > stepLabels.length) {
               return;
          }

          if (target <= step || isStepValid(step)) {
               setStep(target);
          }
     };

     const isReadyToSubmit = () => {
          return [1, 2, 3, 4].every((stepNumber) => isStepValid(stepNumber));
     };

     return {
          state,
          step,
          steps: stepLabels,
          updateField,
          setGoal,
          addGoal,
          removeGoal,
          nextStep,
          prevStep,
          goToStep,
          getStepError,
          isStepValid,
          isReadyToSubmit,
          setProposalId,
     };
}
