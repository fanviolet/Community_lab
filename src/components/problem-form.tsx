"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function ProblemForm() {
  const router = useRouter();

  const supabase = createClient();

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState("Medium");

  const [category, setCategory] = useState("Education");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);

        alert(userError.message);

        return;
      }

      if (!user) {
        alert("You must be logged in");

        return;
      }

      const { error } = await supabase
        .from("problems")
        .insert([
          {
            title,
            description,
            priority,
            category,
            author_id: user.id,
          },
        ])
        .select();

      if (error) {
        console.error(error);

        alert(error.message);

        return;
      }

      alert("Problem created!");

      setTitle("");

      setDescription("");

      setPriority("Medium");

      router.push("/dashboard/problems");

      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">Title</label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border p-3"
          placeholder="Describe the problem"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Description</label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[160px] w-full rounded-xl border p-3"
          placeholder="Explain the issue..."
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Priority</label>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-xl border p-3"
        >
          <option>Low</option>

          <option>Medium</option>

          <option>High</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Category</label>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border p-3"
        >
          <option>Education</option>

          <option>Environment</option>

          <option>Community</option>

          <option>Technology</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Problem"}
      </button>
    </form>
  );
}
