import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import {
  BOOST_CHART_SCROLL_STEP,
  getBoostChartScrollbarMetrics,
  getScrollLeftForThumbDrag,
  getScrollLeftForTrackClick,
  hasBoostChartHorizontalOverflow,
} from "../../utils/boostChartScroll";

interface ScrollableBoostChartsProps {
  scrollWidth: number | null;
  children: React.ReactNode;
}

interface ViewportScrollState {
  clientWidth: number;
  scrollLeft: number;
  scrollWidth: number;
}

const ScrollableBoostCharts: React.FC<ScrollableBoostChartsProps> = ({
  scrollWidth,
  children,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startScrollLeft: number; startX: number } | null>(
    null,
  );
  const [viewportScroll, setViewportScroll] = useState<ViewportScrollState>({
    clientWidth: 0,
    scrollLeft: 0,
    scrollWidth: 0,
  });
  const [railWidth, setRailWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isThumbHovered, setIsThumbHovered] = useState(false);
  const isScrollable = scrollWidth != null;

  const updateViewportScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    setViewportScroll({
      clientWidth: viewport.clientWidth,
      scrollLeft: viewport.scrollLeft,
      scrollWidth: viewport.scrollWidth,
    });
  }, []);

  const updateRailWidth = useCallback(() => {
    const rail = railRef.current;
    setRailWidth(rail?.clientWidth ?? 0);
  }, []);

  const setRailRef = useCallback((node: HTMLDivElement | null) => {
    railRef.current = node;
    setRailWidth(node?.clientWidth ?? 0);
  }, []);

  useEffect(() => {
    if (!isScrollable) {
      return;
    }

    updateViewportScroll();
    updateRailWidth();

    const viewport = viewportRef.current;
    const rail = railRef.current;
    if (!viewport) {
      return;
    }

    viewport.addEventListener("scroll", updateViewportScroll, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(() => {
      updateViewportScroll();
      updateRailWidth();
    });

    resizeObserver.observe(viewport);

    const inner = viewport.firstElementChild;
    if (inner) {
      resizeObserver.observe(inner);
    }

    if (rail) {
      resizeObserver.observe(rail);
    }

    return () => {
      viewport.removeEventListener("scroll", updateViewportScroll);
      resizeObserver.disconnect();
    };
  }, [isScrollable, scrollWidth, updateRailWidth, updateViewportScroll]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const viewport = viewportRef.current;
      const dragState = dragRef.current;
      if (!viewport || !dragState) {
        return;
      }

      const metrics = getBoostChartScrollbarMetrics({
        clientWidth: viewport.clientWidth,
        railWidth,
        scrollLeft: viewport.scrollLeft,
        scrollWidth: viewport.scrollWidth,
      });

      viewport.scrollLeft = getScrollLeftForThumbDrag({
        deltaX: event.clientX - dragState.startX,
        maxScrollLeft: metrics.maxScrollLeft,
        railWidth,
        startScrollLeft: dragState.startScrollLeft,
        thumbWidth: metrics.thumbWidth,
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, railWidth]);

  const scrollByStep = useCallback(
    (delta: number) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const metrics = getBoostChartScrollbarMetrics({
        clientWidth: viewport.clientWidth,
        railWidth,
        scrollLeft: viewport.scrollLeft,
        scrollWidth: viewport.scrollWidth,
      });

      viewport.scrollLeft = Math.max(
        0,
        Math.min(metrics.maxScrollLeft, viewport.scrollLeft + delta),
      );
    },
    [railWidth],
  );

  const handleTrackMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    const viewport = viewportRef.current;
    const rail = railRef.current;
    if (!viewport || !rail) {
      return;
    }

    const metrics = getBoostChartScrollbarMetrics({
      clientWidth: viewport.clientWidth,
      railWidth: rail.clientWidth,
      scrollLeft: viewport.scrollLeft,
      scrollWidth: viewport.scrollWidth,
    });

    if (!metrics.canScroll) {
      return;
    }

    const rect = rail.getBoundingClientRect();
    viewport.scrollLeft = getScrollLeftForTrackClick({
      clickX: event.clientX - rect.left,
      clientWidth: viewport.clientWidth,
      maxScrollLeft: metrics.maxScrollLeft,
      railWidth: rail.clientWidth,
      scrollWidth: viewport.scrollWidth,
    });
  };

  const handleThumbMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    dragRef.current = {
      startScrollLeft: viewport.scrollLeft,
      startX: event.clientX,
    };
    setIsDragging(true);
  };

  if (!isScrollable) {
    return (
      <Box className="stat-boosts-charts__chart-well">
        <Box className="stat-boosts-charts__chart-body">{children}</Box>
      </Box>
    );
  }

  const hasOverflow = hasBoostChartHorizontalOverflow({
    clientWidth: viewportScroll.clientWidth,
    scrollWidth: viewportScroll.scrollWidth,
  });

  const scrollbarMetrics = getBoostChartScrollbarMetrics({
    clientWidth: viewportScroll.clientWidth,
    railWidth,
    scrollLeft: viewportScroll.scrollLeft,
    scrollWidth: viewportScroll.scrollWidth,
  });

  const thumbClassName = [
    "boosts-chart-scroll__thumb",
    (isThumbHovered || isDragging) && "boosts-chart-scroll__thumb--active",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box
      className={[
        "boosts-chart-scroll",
        hasOverflow && "boosts-chart-scroll--active",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Box
        ref={viewportRef}
        className="boosts-chart-scroll__viewport stat-boosts-charts__chart-well"
      >
        <Box
          className="boosts-chart-scroll__inner"
          sx={{ width: scrollWidth, minWidth: "100%" }}
        >
          {children}
        </Box>
      </Box>
      {hasOverflow ? (
        <Box className="boosts-chart-scroll__track">
          <button
            type="button"
            className="boosts-chart-scroll__arrow boosts-chart-scroll__arrow--left"
            aria-label="Scroll chart left"
            onClick={() => scrollByStep(-BOOST_CHART_SCROLL_STEP)}
          />
          <Box
            ref={setRailRef}
            className="boosts-chart-scroll__track-rail"
            onMouseDown={handleTrackMouseDown}
          >
            {scrollbarMetrics.canScroll ? (
              <Box
                className={thumbClassName}
                style={{
                  width: scrollbarMetrics.thumbWidth,
                  transform: `translateX(${scrollbarMetrics.thumbLeft}px)`,
                }}
                onMouseDown={handleThumbMouseDown}
                onMouseEnter={() => setIsThumbHovered(true)}
                onMouseLeave={() => setIsThumbHovered(false)}
              />
            ) : null}
          </Box>
          <button
            type="button"
            className="boosts-chart-scroll__arrow boosts-chart-scroll__arrow--right"
            aria-label="Scroll chart right"
            onClick={() => scrollByStep(BOOST_CHART_SCROLL_STEP)}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export default ScrollableBoostCharts;
