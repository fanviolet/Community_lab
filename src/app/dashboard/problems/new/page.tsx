import { redirect } from "next/navigation";

import ProblemForm from "@/components/problem-form";
import { buildRBACContext } from "@/lib/rbac-server";
import { hasPermission } from "@/lib/rbac";

export default async function NewProblemPage() {
  const ctx = await buildRBACContext();

  if (!hasPermission(ctx, "problem.create")) {
    redirect("/dashboard/problems");
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Create New Problem</h1>

      <p className="text-gray-500 mb-8">
        Share an issue affecting your community.
      </p>

      <ProblemForm />
    </div>
  );
}
