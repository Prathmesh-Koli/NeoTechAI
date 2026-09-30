"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { questionPaper as qp } from "@/lib/question-paper";

export function QuestionPaperDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>Question paper</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={0.5} sx={{ alignItems: "center", textAlign: "center", mb: 2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qp.logoUrl} alt="College logo" style={{ height: 64 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {qp.institute}
            </Typography>
            <Typography variant="subtitle2">{qp.college}</Typography>
            <Typography variant="caption">{qp.address}</Typography>
            <Typography variant="caption" color="text.secondary">
              {qp.affiliation}
            </Typography>
            <Typography variant="body2">{qp.academicYear}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {qp.examTitle}
            </Typography>
            <Typography variant="body2">Subject code &amp; Name: {qp.subject}</Typography>
            <Typography variant="body2">
              {qp.classInfo} | Max. Marks: {qp.maxMarks}
            </Typography>
          </Stack>

          <Typography variant="subtitle2">Instructions:</Typography>
          <Box component="ol" sx={{ mt: 0.5, mb: 2, pl: 3 }}>
            {qp.instructions.map((i) => (
              <li key={i}>
                <Typography variant="body2">{i}</Typography>
              </li>
            ))}
          </Box>

          {qp.sections.map((s) => (
            <Box key={s.number} sx={{ mb: 2 }}>
              <Divider sx={{ mb: 1 }} />
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="subtitle2">
                  {s.number}) {s.instruction}
                </Typography>
                <Typography variant="subtitle2">[{s.marksNote}]</Typography>
              </Stack>
              <Box component="ol" sx={{ mt: 0.5, pl: 3 }}>
                {s.items.map((item) => (
                  <li key={item}>
                    <Typography variant="body2">{item.replace(/^\d+\.\s*/, "")}</Typography>
                  </li>
                ))}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button component="a" href={qp.docxUrl} download>
            Download original (.docx)
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
