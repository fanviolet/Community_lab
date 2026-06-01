"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProposalFormState, ProposalProblem } from "@/types/proposal";

interface ProposalPreviewProps {
     proposal: ProposalFormState;
     problem: ProposalProblem;
}

export function ProposalPreview({ proposal, problem }: ProposalPreviewProps) {
     return (
          <Card className="h-full border border-border bg-white shadow-sm">
               <CardHeader>
                    <CardTitle>Live Proposal Preview</CardTitle>
               </CardHeader>
               <CardContent className="space-y-5">
                    <div>
                         <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Problem</p>
                         <h2 className="mt-2 text-lg font-semibold text-foreground">{problem.title}</h2>
                         <p className="mt-2 text-sm leading-6 text-muted-foreground">{problem.description}</p>
                    </div>

                    <div>
                         <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Proposal title</p>
                         <h3 className="mt-2 text-base font-semibold text-foreground">
                              {proposal.title || "Untitled proposal"}
                         </h3>
                         <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {proposal.overview || "Write a brief overview to explain your idea."}
                         </p>
                    </div>

                    <div>
                         <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Goals</p>
                         {proposal.goals.length > 0 ? (
                              <ul className="mt-3 space-y-2 list-inside list-disc text-sm text-muted-foreground">
                                   {proposal.goals.map((goal, index) => (
                                        <li key={index}>{goal || "Goal description pending"}</li>
                                   ))}
                              </ul>
                         ) : (
                              <p className="mt-2 text-sm text-muted-foreground">No goals added yet.</p>
                         )}
                    </div>

                    <div>
                         <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
                         <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {proposal.timeline || "Share the schedule for your project."}
                         </p>
                    </div>

                    <div>
                         <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Team notes</p>
                         <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {proposal.teamNotes || "Explain who will support the project and how the team will work together."}
                         </p>
                    </div>
               </CardContent>
          </Card>
     );
}
