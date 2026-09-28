import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { mockExams } from "@/lib/mock-data";

export default function AdminExamsPage() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">Exams</Typography>
        <Button variant="contained">New exam</Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Subject code</TableCell>
              <TableCell>Academic year</TableCell>
              <TableCell sx={{ width: 240 }}>Evaluation progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockExams.map((exam) => {
              const progress = Math.round(
                (exam.evaluatedScripts / exam.totalScripts) * 100,
              );
              return (
                <TableRow key={exam.id} hover>
                  <TableCell>{exam.name}</TableCell>
                  <TableCell>{exam.subjectCode}</TableCell>
                  <TableCell>{exam.academicYear}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {exam.evaluatedScripts} / {exam.totalScripts} scripts (
                        {progress}%)
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
