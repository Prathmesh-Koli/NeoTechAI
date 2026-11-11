"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@/components/StatusChip";
import {
  api,
  type AuditLogEntryResponse,
  type MarkChange,
  type ModerationDetailResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function ModerationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const id = params?.id as string;

  const [detail, setDetail] = useState<ModerationDetailResponse | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntryResponse[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    try {
      const [d, log] = await Promise.all([
        api.getModerationDetail(accessToken, id),
        api.getModerationAuditLog(accessToken, id),
      ]);
      setDetail(d);
      setAuditLog(log);
      setEdits({});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const canModerate = detail?.status === "SUBMITTED";

  // Run an action, then either go back to the queue or refresh this page.
  async function run(task: () => Promise<unknown>, done: string, leave: boolean) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await task();
      if (leave) {
        router.push("/chief-evaluator/moderation");
        return;
      }
      setNotice(done);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function saveMarks() {
    if (!accessToken || !detail) return;
    const changes: MarkChange[] = [];
    for (const mark of detail.marks) {
      const raw = edits[mark.rubricStepId];
      if (raw === undefined || raw.trim() === "") continue;
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0 || value > mark.maxMarks) {
        setError(
          `Q${mark.questionNumber} step ${mark.stepNumber}: enter a number between 0 and ${mark.maxMarks}`,
        );
        return;
      }
      if (value !== mark.marksAwarded) {
        changes.push({
          rubricStepId: mark.rubricStepId,
          attemptStatus: "ATTEMPTED",
          marksAwarded: value,
        });
      }
    }
    if (changes.length === 0) {
      setError("No marks were changed.");
      return;
    }
    void run(
      () => api.adjustModerationMarks(accessToken, id, changes, reason.trim() || undefined),
      "Marks updated and recorded in the audit log.",
      false,
    );
  }

  function requireReason(): string | null {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please enter a reason first.");
      return null;
    }
    return trimmed;
  }

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "400px" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading script details...</Typography>
      </Stack>
    );
  }

  if (!detail) {
    return <Alert severity="error">{error ?? "Allocation not found."}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Moderate script {detail.scriptCode}</Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}
      {!canModerate ? (
        <Alert severity="info">
          This evaluation is no longer awaiting moderation, so actions are disabled.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">
            {detail.examName} ({detail.subjectCode})
          </Typography>
          <Typography variant="body2">Evaluator: {detail.evaluator.email}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Status:</Typography>
            <StatusChip status={detail.status} />
          </Stack>
          <Typography variant="body2">
            Total marks: {detail.totalMarksAwarded ?? "-"} · Annotations: {detail.annotations.length}
          </Typography>

          <Divider />

          <Typography variant="h6">Marks</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Step</TableCell>
                <TableCell>Rubric</TableCell>
                <TableCell align="right">Max</TableCell>
                <TableCell align="right">Awarded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.marks.map((m) => (
                <TableRow key={m.rubricStepId}>
                  <TableCell>{m.questionNumber}</TableCell>
                  <TableCell>{m.stepNumber}</TableCell>
                  <TableCell>{m.description}</TableCell>
                  <TableCell align="right">{m.maxMarks}</TableCell>
                  <TableCell align="right">
                    {m.attemptStatus === "ATTEMPTED" ? (
                      <TextField
                        size="small"
                        type="number"
                        disabled={!canModerate || busy}
                        value={edits[m.rubricStepId] ?? String(m.marksAwarded ?? "")}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [m.rubricStepId]: e.target.value }))
                        }
                        slotProps={{ htmlInput: { min: 0, max: m.maxMarks, step: 0.5 } }}
                        sx={{ width: 100 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {m.attemptStatus === "NOT_ATTEMPTED" ? "Not attempted" : "N/A"}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {detail.marks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      No marks recorded on this evaluation.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <Box>
            <Button variant="outlined" disabled={!canModerate || busy} onClick={saveMarks}>
              Save mark changes
            </Button>
          </Box>

          <Divider />

          <Typography variant="h6">Moderation actions</Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Reason / comments"
            helperText="Required to return for revision or request a recheck; optional for approve and mark changes."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!canModerate || busy}
          />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="success"
              disabled={!canModerate || busy}
              onClick={() =>
                accessToken &&
                void run(
                  () => api.approveAllocation(accessToken, id, reason.trim() || undefined),
                  "Approved.",
                  true,
                )
              }
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={!canModerate || busy}
              onClick={() => {
                const r = requireReason();
                if (r && accessToken) {
                  void run(() => api.returnAllocation(accessToken, id, r), "Returned.", true);
                }
              }}
            >
              Return for revision
            </Button>
            <Button
              variant="outlined"
              color="warning"
              disabled={!canModerate || busy}
              onClick={() => {
                const r = requireReason();
                if (r && accessToken) {
                  void run(() => api.requestRecheck(accessToken, id, r), "Recheck requested.", true);
                }
              }}
            >
              Request recheck
            </Button>
          </Stack>

          <Divider />

          <Typography variant="h6">Audit trail</Typography>
          {auditLog.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No moderation actions yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Who</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.performedAt).toLocaleString()}</TableCell>
                    <TableCell>{entry.performedBy.email}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{ m: 0, whiteSpace: "pre-wrap" }}
                      >
                        {entry.metadata ? JSON.stringify(entry.metadata, null, 1) : ""}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
