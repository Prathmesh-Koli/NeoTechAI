"use client";

import React, { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { StatusChip } from "@/components/StatusChip";
import { api, type ModerationQueueItem } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function ModerationQueuePage() {
  const { accessToken } = useAuth();
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api
      .getModerationQueue(accessToken)
      .then((data) => setQueue(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "400px" }}>
        <CircularProgress />
        <Typography>Loading moderation queue...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Moderation queue</Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Script code</TableCell>
              <TableCell>Exam</TableCell>
              <TableCell>Evaluator</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Total marks</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.scriptCode}</TableCell>
                <TableCell>{item.examName}</TableCell>
                <TableCell>{item.evaluator.email}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={item.type === "REVALUATION" ? "Revaluation" : "First evaluation"}
                  />
                </TableCell>
                <TableCell align="right">{item.totalMarksAwarded ?? "-"}</TableCell>
                <TableCell>
                  <StatusChip status={item.status} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    component={Link}
                    href={`/chief-evaluator/moderation/${item.id}`}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {queue.length === 0 && !error ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">
                    Nothing waiting on moderation right now.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
