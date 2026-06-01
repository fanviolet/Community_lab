export type ProposalStatus = "draft" | "submitted" | "approved" | "rejected";

export interface ProposalFormState {
     id?: string;
     problemId: string;
     title: string;
     overview: string;
     goals: string[];
     timeline: string;
     teamNotes: string;
     status: ProposalStatus;
}

export interface ProposalProblem {
     id: string;
     title: string;
     description: string;
}
