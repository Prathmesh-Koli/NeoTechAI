"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
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
import { LinkButton } from "@/components/LinkButton";
import { StatusChip } from "@/components/StatusChip";
import { api, ApiError, type AllocationSummaryResponse } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function EvaluatorScriptsPage() {
  const { accessToken } = useAuth();
  const [allocations, setAllocations] = useState<AllocationSummaryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api
      .getMyAllocations(accessToken)
      .then(setAllocations)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [accessToken]);

  return (
    <Stack spacing={3}>
      <Typography variant="h5">My scripts</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!allocations && !error ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {allocations && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Script code</TableCell>
                <TableCell>Exam</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allocations.map((allocation) => (
                <TableRow key={allocation.id} hover>
                  <TableCell>{allocation.scriptCode}</TableCell>
                  <TableCell>{allocation.examName}</TableCell>
                  <TableCell>
                    <StatusChip status={allocation.status} />
                  </TableCell>
                  <TableCell>{allocation.assignedAt.slice(0, 10)}</TableCell>
                  <TableCell align="right">
                    <LinkButton
                      size="small"
                      href={`/evaluator/scripts/${allocation.id}`}
                    >
                      Open
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ))}
              {allocations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      No scripts allocated to you yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
