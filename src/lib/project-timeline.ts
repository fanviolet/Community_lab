export interface ProjectTimelineInput {
  startDate?: string | null;
  endDate?: string | null;
}

export interface ProjectTimelineInfo {
  startDate: string | null;
  endDate: string | null;
  duration: string | null;
  daysRemaining: string | null;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function toDateOnly(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatProjectDate(value: string | null | undefined): string {
  const date = value ? toDateOnly(value) : null;
  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString("en-GB", DATE_FORMAT);
}

export function calculateDurationDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number | null {
  const start = startDate ? toDateOnly(startDate) : null;
  const end = endDate ? toDateOnly(endDate) : null;

  if (!start || !end || end < start) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
}

export function calculateDaysRemaining(endDate: string | null | undefined): number | null {
  const end = endDate ? toDateOnly(endDate) : null;
  if (!end) {
    return null;
  }

  const today = toDateOnly(new Date().toISOString());
  if (!today) {
    return null;
  }

  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

export function getProjectTimelineInfo(
  input: ProjectTimelineInput
): ProjectTimelineInfo {
  const durationDays = calculateDurationDays(input.startDate, input.endDate);
  const daysRemaining = calculateDaysRemaining(input.endDate);

  return {
    startDate: input.startDate ? formatProjectDate(input.startDate) : null,
    endDate: input.endDate ? formatProjectDate(input.endDate) : null,
    duration: durationDays !== null ? `${durationDays} days` : null,
    daysRemaining: daysRemaining !== null ? `${daysRemaining} days` : null,
  };
}

export function buildProjectTimelineContext(project: {
  title: string;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): string {
  const timeline = getProjectTimelineInfo({
    startDate: project.startDate,
    endDate: project.endDate,
  });

  return [
    `Project Title: ${project.title}`,
    `Project Description: ${project.description ?? "No description provided."}`,
    `Status: ${project.status ?? "active"}`,
    "",
    "Project Timeline",
    `* Start Date: ${timeline.startDate ?? "Not set"}`,
    `* End Date: ${timeline.endDate ?? "Not set"}`,
    `* Duration: ${timeline.duration ?? "Not set"}`,
    `* Days Remaining: ${timeline.daysRemaining ?? "Not set"}`,
  ].join("\n");
}
