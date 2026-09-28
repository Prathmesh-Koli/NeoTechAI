"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage, Image as KonvaImage, Text as KonvaText, Rect, Group } from "react-konva";
import type Konva from "konva";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import type { Annotation, WorkspacePage } from "@/lib/evaluation-types";
import { useEvaluationStore } from "@/store/evaluationStore";
import { useHtmlImage } from "./useHtmlImage";

interface PendingNote {
  x: number; // natural image-space coords
  y: number;
  screenX: number;
  screenY: number;
}

export function PageCanvasInner({ page }: { page: WorkspacePage }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pendingNote, setPendingNote] = useState<PendingNote | null>(null);
  const [noteText, setNoteText] = useState("");

  const image = useHtmlImage(page.imageUrl);
  const tool = useEvaluationStore((s) => s.tool);
  const selectedAnnotationId = useEvaluationStore((s) => s.selectedAnnotationId);
  const addAnnotation = useEvaluationStore((s) => s.addAnnotation);
  const selectAnnotation = useEvaluationStore((s) => s.selectAnnotation);
  const deleteAnnotation = useEvaluationStore((s) => s.deleteAnnotation);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" && selectedAnnotationId) {
        void deleteAnnotation(page.id, selectedAnnotationId);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAnnotationId, page.id, deleteAnnotation]);

  const scale = containerWidth > 0 ? containerWidth / page.imageWidth : 0;
  const stageHeight = page.imageHeight * scale;

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Clicks on an annotation shape are handled by that shape's own
      // handler (which stops propagation); this only fires for empty space.
      if (tool === "select") {
        selectAnnotation(null);
        return;
      }

      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer || scale === 0) return;

      const x = pointer.x / scale;
      const y = pointer.y / scale;

      if (tool === "tick") {
        void addAnnotation(page.id, { type: "TICK", x, y });
      } else if (tool === "cross") {
        void addAnnotation(page.id, { type: "CROSS", x, y });
      } else if (tool === "note") {
        const containerRect = containerRef.current!.getBoundingClientRect();
        setPendingNote({
          x,
          y,
          screenX: containerRect.left + pointer.x,
          screenY: containerRect.top + pointer.y,
        });
        setNoteText("");
      }
    },
    [tool, scale, addAnnotation, page.id, selectAnnotation],
  );

  function commitNote() {
    if (pendingNote && noteText.trim()) {
      void addAnnotation(page.id, {
        type: "NOTE",
        x: pendingNote.x,
        y: pendingNote.y,
        text: noteText.trim(),
      });
    }
    setPendingNote(null);
  }

  return (
    <Box ref={containerRef} sx={{ width: "100%", position: "relative" }}>
      {containerWidth > 0 && (
        <Stage
          width={containerWidth}
          height={stageHeight}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer scaleX={scale} scaleY={scale}>
            {image && (
              <KonvaImage
                image={image}
                width={page.imageWidth}
                height={page.imageHeight}
              />
            )}
            {page.isBlank && (
              <>
                <Rect
                  width={page.imageWidth}
                  height={page.imageHeight}
                  fill="rgba(120,120,120,0.35)"
                  listening={false}
                />
                <KonvaText
                  text="MARKED BLANK"
                  fontSize={56}
                  fill="rgba(80,80,80,0.6)"
                  x={page.imageWidth / 2}
                  y={page.imageHeight / 2}
                  offsetX={260}
                  rotation={-20}
                  listening={false}
                />
              </>
            )}

            {page.annotations.map((annotation) => (
              <AnnotationShape
                key={annotation.id}
                annotation={annotation}
                selected={annotation.id === selectedAnnotationId}
                onSelect={() => tool === "select" && selectAnnotation(annotation.id)}
              />
            ))}
          </Layer>
        </Stage>
      )}

      <Popover
        open={pendingNote !== null}
        onClose={commitNote}
        anchorReference="anchorPosition"
        anchorPosition={
          pendingNote
            ? { top: pendingNote.screenY, left: pendingNote.screenX }
            : undefined
        }
      >
        <Box sx={{ p: 1.5, width: 260 }}>
          <TextField
            autoFocus
            multiline
            minRows={2}
            fullWidth
            placeholder="Note text..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitNote();
              }
            }}
          />
        </Box>
      </Popover>
    </Box>
  );
}

function AnnotationShape({
  annotation,
  selected,
  onSelect,
}: {
  annotation: Annotation;
  selected: boolean;
  onSelect: () => void;
}) {
  if (annotation.type === "TICK") {
    return (
      <KonvaText
        text="✓"
        fontSize={44}
        fontStyle="bold"
        fill="#2e7d32"
        stroke={selected ? "#1565c0" : undefined}
        strokeWidth={selected ? 1.5 : 0}
        x={annotation.x - 12}
        y={annotation.y - 22}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
      />
    );
  }

  if (annotation.type === "CROSS") {
    return (
      <KonvaText
        text="✗"
        fontSize={44}
        fontStyle="bold"
        fill="#c62828"
        stroke={selected ? "#1565c0" : undefined}
        strokeWidth={selected ? 1.5 : 0}
        x={annotation.x - 12}
        y={annotation.y - 22}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
      />
    );
  }

  // NOTE
  return (
    <Group
      x={annotation.x}
      y={annotation.y}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
    >
      <Rect
        width={Math.max(80, annotation.text.length * 6)}
        height={40}
        fill="#fff59d"
        stroke={selected ? "#1565c0" : "#c9b458"}
        strokeWidth={selected ? 2 : 1}
        cornerRadius={4}
        shadowBlur={3}
        shadowOpacity={0.3}
      />
      <KonvaText
        text={annotation.text}
        fontSize={14}
        fill="#3a2f00"
        padding={6}
        width={Math.max(80, annotation.text.length * 6)}
        wrap="word"
      />
    </Group>
  );
}
