"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { WorkspaceRubricStep, StepMark } from "@/lib/evaluation-types";
import { useEvaluationStore } from "@/store/evaluationStore";

export function StepMarkRow({
  step,
  mark,
  disabled,
}: {
  step: WorkspaceRubricStep;
  mark: StepMark | undefined;
  disabled?: boolean;
}) {
  const setStepMark = useEvaluationStore((s) => s.setStepMark);

  const isNotApplicable = mark?.attemptStatus === "NOT_APPLICABLE";
  const isNotAttempted = mark?.attemptStatus === "NOT_ATTEMPTED";

  function handleMarksChange(raw: string) {
    if (raw === "") {
      setStepMark(step.id, "ATTEMPTED", null);
      return;
    }
    const value = Math.min(Math.max(Number(raw), 0), step.maxMarks);
    setStepMark(step.id, "ATTEMPTED", Number.isNaN(value) ? null : value);
  }

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", py: 0.75 }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2">{step.description}</Typography>
        <Typography variant="caption" color="text.secondary">
          Max {step.maxMarks}
        </Typography>
      </Box>

      {isNotApplicable ? (
        <Chip label="N/A" size="small" variant="outlined" />
      ) : (
        <>
          <TextField
            size="small"
            type="number"
            disabled={disabled || isNotAttempted}
            value={mark?.attemptStatus === "ATTEMPTED" ? (mark.marksAwarded ?? "") : ""}
            onChange={(e) => handleMarksChange(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: step.maxMarks, step: 0.5 } }}
            sx={{ width: 72 }}
          />
          <Chip
            label="Not attempted"
            size="small"
            variant={isNotAttempted ? "filled" : "outlined"}
            color={isNotAttempted ? "warning" : "default"}
            disabled={disabled}
            onClick={() =>
              setStepMark(
                step.id,
                isNotAttempted ? "ATTEMPTED" : "NOT_ATTEMPTED",
                null,
              )
            }
          />
        </>
      )}
    </Stack>
  );
}
