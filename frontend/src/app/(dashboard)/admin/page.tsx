import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/StatCard";
import { mockAllocations, mockExams, mockUsers } from "@/lib/mock-data";

export default function AdminOverviewPage() {
  const totalScripts = mockExams.reduce((sum, e) => sum + e.totalScripts, 0);
  const evaluatedScripts = mockExams.reduce(
    (sum, e) => sum + e.evaluatedScripts,
    0,
  );
  const activeEvaluators = mockUsers.filter(
    (u) => u.role === "EVALUATOR" && u.isActive,
  ).length;
  const pendingAllocations = mockAllocations.filter(
    (a) => a.status === "PENDING",
  ).length;

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Overview</Typography>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        <StatCard
          label="Scripts evaluated"
          value={`${evaluatedScripts} / ${totalScripts}`}
          caption="Across all active exams"
        />
        <StatCard
          label="Active evaluators"
          value={activeEvaluators}
        />
        <StatCard
          label="Pending allocations"
          value={pendingAllocations}
        />
        <StatCard label="Active exams" value={mockExams.length} />
      </Stack>
    </Stack>
  );
}
