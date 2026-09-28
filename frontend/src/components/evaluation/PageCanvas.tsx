"use client";

import dynamic from "next/dynamic";
import Skeleton from "@mui/material/Skeleton";

// konva touches `window` at import time, so it can never be part of the
// server-rendered bundle -- ssr:false forces it into a client-only chunk.
export const PageCanvas = dynamic(
  () => import("./PageCanvasInner").then((m) => m.PageCanvasInner),
  {
    ssr: false,
    loading: () => (
      <Skeleton variant="rectangular" width="100%" height={600} />
    ),
  },
);
