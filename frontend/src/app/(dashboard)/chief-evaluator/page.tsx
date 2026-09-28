import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/StatCard";
import { mockAllocations } from "@/lib/mock-data";

export default function ChiefEvaluatorOverviewPage() {
  const submitted = mockAllocations.filter(
    (a) => a.status === "SUBMITTED",
  ).length;
  const inProgress = mockAllocations.filter(
    (a) => a.status === "IN_PROGRESS",
  ).length;
  const returned = mockAllocations.filter(
    (a) => a.status === "RETURNED_FOR_REVISION",
  ).length;

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Overview</Typography>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        <StatCard label="Awaiting moderation" value={submitted} />
        <StatCard label="In progress" value={inProgress} />
        <StatCard label="Returned for revision" value={returned} />
      </Stack>
    </Stack>
  );
}
