"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import { StatusChip } from "@/components/StatusChip";

export default function ModerationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:4000/moderation/allocations/${id}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch allocation details");
        return res.json();
      })
      .then((data) => {
        setAllocation(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleAction = async (actionType: "APPROVE" | "RETURN_FOR_REVISION" | "RECHECK", reason?: string) => {
    if (actionType === "RETURN_FOR_REVISION" && !reason) {
      alert("Please provide a reason for returning the script.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/moderation/allocations/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: actionType, reason }),
      });

      if (!res.ok) throw new Error("Failed to perform action");

      alert(`Action ${actionType} completed successfully!`);
      router.push("/chief-evaluator/moderation");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "400px" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading script details...</Typography>
      </Stack>
    );
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Moderate Script: {allocation?.answerScript?.scriptCode}</Typography>
      
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Exam: {allocation?.answerScript?.exam?.name}</Typography>
          <Typography variant="subtitle2">Evaluator: {allocation?.evaluator?.email}</Typography>
          <Typography>
            Current Status: <StatusChip status={allocation?.status} />
          </Typography>

          <Divider />

          <Typography variant="h6">Marks Awarded</Typography>
          {allocation?.marks?.map((m: any) => (
            <Box key={m.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography>Step ID: {m.rubricStepId}</Typography>
              <Typography fontWeight="bold">{m.marksAwarded} Marks</Typography>
            </Box>
          ))}

          <Divider />

          <Typography variant="h6">Moderation Actions</Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              disabled={actionLoading}
              onClick={() => handleAction("APPROVE")}
            >
              Approve Script
            </Button>

            <Button
              variant="outlined"
              color="warning"
              disabled={actionLoading}
              onClick={() => handleAction("RECHECK")}
            >
              Request Recheck / Revaluation
            </Button>
          </Stack>

          <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Return for Revision
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Enter reason for returning..."
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="error"
              disabled={actionLoading}
              onClick={() => handleAction("RETURN_FOR_REVISION", revisionReason)}
            >
              Return for Revision
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}