"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface Summary {
  awaitingModeration: number;
  inProgress: number;
  returnedForRevision: number;
}

export default function ChiefEvaluatorOverviewPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api
      .getModerationSummary(accessToken)
      .then(setSummary)
      .catch((err: Error) => setError(err.message));
  }, [accessToken]);

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Overview</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        <StatCard label="Awaiting moderation" value={summary?.awaitingModeration ?? 0} />
        <StatCard label="In progress" value={summary?.inProgress ?? 0} />
        <StatCard label="Returned for revision" value={summary?.returnedForRevision ?? 0} />
      </Stack>
    </Stack>
  );
}
