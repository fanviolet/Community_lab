import DiscussionHub from "@/components/discussion/DiscussionHub";

export default function DiscussionPage({
  searchParams,
}: {
  searchParams: { group?: string };
}) {
  const groupId = searchParams.group;
  return <DiscussionHub groupId={groupId || undefined} />;
}
