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

export default function AdminAllocationsPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5">Allocations</Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Script code</TableCell>
              <TableCell>Exam</TableCell>
              <TableCell>Evaluator</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockAllocations.map((allocation) => (
              <TableRow key={allocation.id} hover>
                <TableCell>{allocation.scriptCode}</TableCell>
                <TableCell>{allocation.examName}</TableCell>
                <TableCell>{allocation.evaluatorName}</TableCell>
                <TableCell>
                  <StatusChip status={allocation.status} />
                </TableCell>
                <TableCell>{allocation.assignedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
