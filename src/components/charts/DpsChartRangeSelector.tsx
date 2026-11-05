import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import {
  formatTimeRangeSpan,
  getFightTimeAtPlotX,
  TimeRange,
} from "../../utils/timeRangeFilter";

interface DpsChartRangeSelectorProps {
  domain: TimeRange;
  onSelect: (range: TimeRange) => void;
  children: React.ReactNode;
}

interface PlotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Selection {
  anchorMs: number;
  currentMs: number;
  plot: PlotRect;
}

/** Safety net for a selection that doesn't change the chart, e.g. the whole fight. */
const HELD_SELECTION_TIMEOUT_MS = 3000;

/** The plot area, read from the axis lines recharts draws around it. */
const getPlotRect = (root: HTMLElement): PlotRect | null => {
  const xAxis = root.querySelector(
    ".recharts-xAxis .recharts-cartesian-axis-line",
  );
  const yAxis = root.querySelector(
    ".recharts-yAxis .recharts-cartesian-axis-line",
  );
  if (!xAxis || !yAxis) {
    return null;
  }
  const x = xAxis.getBoundingClientRect();
  const y = yAxis.getBoundingClientRect();
  return { left: x.left, right: x.right, top: y.top, bottom: y.bottom };
};

/**
 * Click-and-drag time selection over a DPS chart. Only presses inside the plot
 * start a drag, so the phase marker icons above it keep their hover tooltips.
 * On release the selection stays drawn until the chart has zoomed to it.
 */
const DpsChartRangeSelector: React.FC<DpsChartRangeSelectorProps> = ({
  domain,
  onSelect,
  children,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const domainRef = useRef(domain);
  domainRef.current = domain;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const timeAt = (clientX: number, plot: PlotRect) =>
    getFightTimeAtPlotX(
      clientX,
      { left: plot.left, width: plot.right - plot.left },
      domainRef.current,
    );

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || !rootRef.current) {
      return;
    }
    const plot = getPlotRect(rootRef.current);
    if (
      !plot ||
      event.clientX < plot.left ||
      event.clientX > plot.right ||
      event.clientY < plot.top ||
      event.clientY > plot.bottom
    ) {
      return;
    }
    const anchorMs = timeAt(event.clientX, plot);
    setSelection({ anchorMs, currentMs: anchorMs, plot });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      setSelection(
        (prev) =>
          prev && { ...prev, currentMs: timeAt(event.clientX, prev.plot) },
      );
    };
    const handleUp = (event: PointerEvent) => {
      setIsDragging(false);
      const current = selectionRef.current;
      if (!current) {
        return;
      }
      const endMs = timeAt(event.clientX, current.plot);
      if (endMs === current.anchorMs) {
        setSelection(null);
        return;
      }
      setSelection({ ...current, currentMs: endMs });
      onSelectRef.current({
        startMs: Math.min(current.anchorMs, endMs),
        endMs: Math.max(current.anchorMs, endMs),
      });
    };
    const cancel = () => {
      setIsDragging(false);
      setSelection(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancel();
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDragging]);

  // Once released, the held selection goes when the chart zooms to it.
  const isHeld = selection !== null && !isDragging;
  useEffect(() => {
    if (!isHeld) {
      return;
    }
    const timeoutId = window.setTimeout(
      () => setSelection(null),
      HELD_SELECTION_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isHeld]);
  useEffect(() => {
    setSelection(null);
    setIsDragging(false);
  }, [domain.startMs, domain.endMs]);

  const overlay = (() => {
    if (
      !selection ||
      selection.anchorMs === selection.currentMs ||
      !rootRef.current
    ) {
      return null;
    }
    const root = rootRef.current.getBoundingClientRect();
    const span = domain.endMs - domain.startMs;
    const width = selection.plot.right - selection.plot.left;
    const startMs = Math.min(selection.anchorMs, selection.currentMs);
    const endMs = Math.max(selection.anchorMs, selection.currentMs);
    return {
      startMs,
      endMs,
      left:
        selection.plot.left -
        root.left +
        ((startMs - domain.startMs) / span) * width,
      width: ((endMs - startMs) / span) * width,
      top: selection.plot.top - root.top,
      height: selection.plot.bottom - selection.plot.top,
    };
  })();

  return (
    <Box
      ref={rootRef}
      onPointerDown={handlePointerDown}
      sx={{
        position: "relative",
        width: "100%",
        cursor: "crosshair",
        userSelect: "none",
        touchAction: "pan-y",
        ...(selection && {
          "& .recharts-tooltip-wrapper": { display: "none" },
        }),
      }}
    >
      {children}
      {overlay && (
        <Box
          data-testid="dps-chart-range-preview"
          sx={{
            position: "absolute",
            left: overlay.left,
            top: overlay.top,
            width: overlay.width,
            height: overlay.height,
            bgcolor: "rgba(173, 216, 230, 0.25)",
            borderLeft: "1px solid lightblue",
            borderRight: "1px solid lightblue",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          <Box
            component="span"
            sx={{
              position: "absolute",
              top: 2,
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              fontSize: "0.75rem",
              color: "white",
              textShadow: "1px 1px 0 #000",
            }}
          >
            {formatTimeRangeSpan({
              startMs: overlay.startMs,
              endMs: overlay.endMs,
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DpsChartRangeSelector;
