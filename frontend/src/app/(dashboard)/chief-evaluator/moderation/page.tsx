"use client";

import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { StatusChip } from "@/components/StatusChip";
import Link from "next/link";

export default function ModerationQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/moderation/allocations", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch moderation queue");
        return res.json();
      })
      .then((data) => {
        setQueue(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "400px" }}>
        <CircularProgress />
        <Typography>Loading moderation queue...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={3}>
        <Typography variant="h5">Moderation queue</Typography>
        <Typography color="error">Error: {error}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Moderation queue</Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Script code</TableCell>
              <TableCell>Exam</TableCell>
              <TableCell>Evaluator</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.map((allocation: any) => (
              <TableRow key={allocation.id} hover>
                <TableCell>{allocation.answerScript?.scriptCode}</TableCell>
                <TableCell>{allocation.answerScript?.exam?.name}</TableCell>
                <TableCell>{allocation.evaluator?.email}</TableCell>
                <TableCell>
                  <StatusChip status={allocation.status} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    component={Link}
                    href={`/chief-evaluator/moderation/${allocation.id}`}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {queue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
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