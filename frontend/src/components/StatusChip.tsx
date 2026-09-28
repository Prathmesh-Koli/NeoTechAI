import Chip from "@mui/material/Chip";
import type { ChipProps } from "@mui/material/Chip";
import type { AllocationStatus } from "@/lib/types";

const COLOR_BY_STATUS: Record<AllocationStatus, ChipProps["color"]> = {
  PENDING: "default",
  IN_PROGRESS: "info",
  SUBMITTED: "success",
  RETURNED_FOR_REVISION: "warning",
  LOCKED: "secondary",
};

const LABEL_BY_STATUS: Record<AllocationStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED_FOR_REVISION: "Returned for revision",
  LOCKED: "Locked",
};

export function StatusChip({ status }: { status: AllocationStatus }) {
  return (
    <Chip
      label={LABEL_BY_STATUS[status]}
      color={COLOR_BY_STATUS[status]}
      size="small"
    />
  );
}
