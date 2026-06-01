"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
     Card,
     CardContent,
     CardDescription,
     CardHeader,
     CardTitle,
} from "@/components/ui/card";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useProposalForm } from "@/hooks/useProposalForm";
import { ProposalPreview } from "@/components/proposal/ProposalPreview";
import type { ProposalFormState, ProposalProblem } from "@/types/proposal";

interface ProposalBuilderProps {
     initialProposal: Partial<ProposalFormState> | null;
     problem: ProposalProblem;
}

export default function ProposalBuilder({ initialProposal, problem }: ProposalBuilderProps) {
     const router = useRouter();
     const [statusMessage, setStatusMessage] = useState<string | null>(null);

     const {
          state,
          step,
          steps,
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
     } = useProposalForm({
          ...initialProposal,
          problemId: problem.id,
     });

     const { saveStatus, saveError, saveNow } = useAutoSave(state, (savedProposal) => {
          if (savedProposal.id) {
               setProposalId(savedProposal.id);
          }
     });

     const currentError = getStepError(step);

     const saveStateLabel =
          saveStatus === "saving"
               ? "Saving..."
               : saveStatus === "saved"
                    ? "Saved"
                    : saveStatus === "error"
                         ? `Error: ${saveError ?? "Unable to save."}`
                         : "Draft auto-save active";

     const handleNext = () => {
          setStatusMessage(null);
          if (!nextStep()) {
               setStatusMessage(currentError ?? "Please fix the current step before continuing.");
          }
     };

     const handleSubmit = async () => {
          setStatusMessage(null);
          if (!isReadyToSubmit()) {
               setStatusMessage("Complete all sections before sending your proposal.");
               return;
          }

          const result = await saveNow("submitted");

          if (result?.id) {
               router.push("/proposals");
          } else {
               setStatusMessage("Unable to submit proposal right now. Please try again.");
          }
     };

     return (
          <div className="grid gap-6 xl:grid-cols-[280px_1fr_360px]">
               <aside className="space-y-5 rounded-3xl border border-border/70 bg-white p-5 shadow-sm">
                    <div>
                         <p className="text-sm font-semibold text-foreground">Proposal Steps</p>
                         <p className="text-sm text-muted-foreground">
                              Complete each section to build a strong recommendation.
                         </p>
                    </div>

                    <div className="space-y-3">
                         {steps.map((item) => {
                              const stepIndex = item.id;
                              const isActive = step === stepIndex;
                              const canJump = stepIndex <= step || isStepValid(stepIndex - 1);

                              return (
                                   <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => goToStep(item.id)}
                                        className={
                                             "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition " +
                                             (isActive
                                                  ? "border-primary bg-primary/5 text-primary"
                                                  : "border-border/80 bg-muted/50 text-foreground hover:border-border/90 hover:bg-muted") +
                                             (canJump ? "" : " cursor-not-allowed opacity-60")
                                        }
                                        disabled={!canJump}
                                   >
                                        <span className="font-medium">{item.title}</span>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                             {item.id}
                                        </span>
                                   </button>
                              );
                         })}
                    </div>
               </aside>

               <section className="space-y-6">
                    <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
                         <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                   <h1 className="text-2xl font-semibold text-foreground">Step {step}: {steps[step - 1].title}</h1>
                                   <p className="text-sm text-muted-foreground">
                                        {step === 1 && "Summarize the proposal and the problem it solves."}
                                        {step === 2 && "Capture the measurable goals your proposal will deliver."}
                                        {step === 3 && "Map the project timeframe and key milestones."}
                                        {step === 4 && "Share how the team will execute and coordinate."}
                                        {step === 5 && "Review the full proposal before submitting."}
                                   </p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-muted/70 px-4 py-2 text-sm text-muted-foreground">
                                   {saveStateLabel}
                              </div>
                         </div>

                         <div className="space-y-6">
                              {step === 1 && (
                                   <div className="space-y-6">
                                        <div className="space-y-2">
                                             <label className="text-sm font-medium text-foreground" htmlFor="proposal-title">
                                                  Proposal title
                                             </label>
                                             <Input
                                                  id="proposal-title"
                                                  value={state.title}
                                                  onChange={(event) => updateField("title", event.target.value)}
                                                  placeholder="Community Garden Planning"
                                             />
                                        </div>

                                        <div className="space-y-2">
                                             <label className="text-sm font-medium text-foreground" htmlFor="proposal-overview">
                                                  Overview
                                             </label>
                                             <Textarea
                                                  id="proposal-overview"
                                                  value={state.overview}
                                                  onChange={(event) => updateField("overview", event.target.value)}
                                                  placeholder="Describe what you want to achieve and why it matters."
                                                  className="min-h-[180px]"
                                             />
                                        </div>
                                   </div>
                              )}

                              {step === 2 && (
                                   <div className="space-y-6">
                                        <div className="space-y-2">
                                             <p className="text-sm font-medium text-foreground">Goals</p>
                                             <p className="text-sm text-muted-foreground">
                                                  Add clear, measurable goals for the proposal.
                                             </p>
                                        </div>
                                        <div className="space-y-4">
                                             {state.goals.map((goal, index) => (
                                                  <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                                       <div>
                                                            <Input
                                                                 value={goal}
                                                                 onChange={(event) => setGoal(index, event.target.value)}
                                                                 placeholder={`Goal ${index + 1}`}
                                                            />
                                                       </div>
                                                       <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => removeGoal(index)}
                                                            aria-label={`Remove goal ${index + 1}`}
                                                       >
                                                            ×
                                                       </Button>
                                                  </div>
                                             ))}
                                        </div>
                                        <Button type="button" variant="secondary" onClick={addGoal}>
                                             Add another goal
                                        </Button>
                                   </div>
                              )}

                              {step === 3 && (
                                   <div className="space-y-6">
                                        <div className="space-y-2">
                                             <label className="text-sm font-medium text-foreground" htmlFor="proposal-timeline">
                                                  Timeline
                                             </label>
                                             <Textarea
                                                  id="proposal-timeline"
                                                  value={state.timeline}
                                                  onChange={(event) => updateField("timeline", event.target.value)}
                                                  placeholder="Week 1: research, Week 2: workshops, Week 3: pilot rollout..."
                                                  className="min-h-[180px]"
                                             />
                                        </div>
                                   </div>
                              )}

                              {step === 4 && (
                                   <div className="space-y-6">
                                        <div className="space-y-2">
                                             <label className="text-sm font-medium text-foreground" htmlFor="proposal-team-notes">
                                                  Team notes
                                             </label>
                                             <Textarea
                                                  id="proposal-team-notes"
                                                  value={state.teamNotes}
                                                  onChange={(event) => updateField("teamNotes", event.target.value)}
                                                  placeholder="Who will lead, who will support, and what roles are needed."
                                                  className="min-h-[180px]"
                                             />
                                        </div>
                                   </div>
                              )}

                              {step === 5 && (
                                   <div className="space-y-5">
                                        <Card className="border border-border/80 bg-muted/60">
                                             <CardHeader>
                                                  <CardTitle>Review your proposal</CardTitle>
                                                  <CardDescription>
                                                       Verify every section and submit when you are ready.
                                                  </CardDescription>
                                             </CardHeader>
                                             <CardContent className="space-y-4">
                                                  <div>
                                                       <p className="text-sm font-semibold text-foreground">Title</p>
                                                       <p className="text-sm text-muted-foreground">{state.title || "Missing title"}</p>
                                                  </div>
                                                  <div>
                                                       <p className="text-sm font-semibold text-foreground">Overview</p>
                                                       <p className="text-sm text-muted-foreground">{state.overview || "Missing overview"}</p>
                                                  </div>
                                                  <div>
                                                       <p className="text-sm font-semibold text-foreground">Goals</p>
                                                       <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                                            {state.goals.map((goal, index) => (
                                                                 <li key={index}>{goal || "Empty goal"}</li>
                                                            ))}
                                                       </ul>
                                                  </div>
                                                  <div>
                                                       <p className="text-sm font-semibold text-foreground">Timeline</p>
                                                       <p className="text-sm text-muted-foreground">{state.timeline || "Missing timeline"}</p>
                                                  </div>
                                                  <div>
                                                       <p className="text-sm font-semibold text-foreground">Team notes</p>
                                                       <p className="text-sm text-muted-foreground">{state.teamNotes || "Missing team notes"}</p>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </div>
                              )}
                         </div>

                         {statusMessage ? (
                              <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                   {statusMessage}
                              </p>
                         ) : null}

                         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex gap-3">
                                   <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                                        Back
                                   </Button>
                                   {step < 5 ? (
                                        <Button type="button" onClick={handleNext} disabled={!isStepValid(step)}>
                                             Continue
                                        </Button>
                                   ) : (
                                        <Button type="button" onClick={handleSubmit}>
                                             Submit proposal
                                        </Button>
                                   )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                   {step < 5 ? "Complete the current section to continue." : "Submit will mark the proposal as sent."}
                              </p>
                         </div>
                    </div>
               </section>

               <aside className="hidden xl:block">
                    <ProposalPreview proposal={state} problem={problem} />
               </aside>
          </div>
     );
}
