import ProblemForm from "@/components/problem-form";

export default function NewProblemPage() {
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
