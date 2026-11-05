import React, { useEffect, useRef, useState } from "react";

interface LazyMountProps {
  /** Space reserved until mounted, so the page doesn't jump when it appears. */
  minHeight: number;
  children: React.ReactNode;
}

/** Holds back an expensive subtree until it nears the viewport, then keeps it. */
const LazyMount: React.FC<LazyMountProps> = ({ minHeight, children }) => {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (mounted || !placeholder) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [mounted]);

  return mounted ? (
    <>{children}</>
  ) : (
    <div ref={placeholderRef} style={{ minHeight }} />
  );
};

export default LazyMount;
