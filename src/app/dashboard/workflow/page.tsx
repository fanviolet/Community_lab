import { redirect } from "next/navigation";

export default function WorkflowRedirectPage() {
  // Redirect to workspace with workflow tab
  redirect("/dashboard/workspace");
}
