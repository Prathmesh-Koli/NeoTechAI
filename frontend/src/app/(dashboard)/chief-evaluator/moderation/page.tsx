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
import { StatusChip } from "@/components/StatusChip";
import { mockAllocations } from "@/lib/mock-data";

export default function ModerationQueuePage() {
  const queue = mockAllocations.filter((a) => a.status === "SUBMITTED");

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
            {queue.map((allocation) => (
              <TableRow key={allocation.id} hover>
                <TableCell>{allocation.scriptCode}</TableCell>
                <TableCell>{allocation.examName}</TableCell>
                <TableCell>{allocation.evaluatorName}</TableCell>
                <TableCell>
                  <StatusChip status={allocation.status} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small">Review</Button>
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
