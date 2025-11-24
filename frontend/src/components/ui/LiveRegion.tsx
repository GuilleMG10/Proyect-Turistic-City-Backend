import { useEffect, useRef } from "react";

type LiveRegionProps = {
  message: string;
  priority?: "polite" | "assertive";
  role?: "status" | "alert" | "log";
  "aria-live"?: "polite" | "assertive" | "off";
  "aria-atomic"?: boolean;
};

export default function LiveRegion({
  message,
  priority = "polite",
  role = "status",
  "aria-live": ariaLive = priority,
  "aria-atomic": ariaAtomic = true
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      // Clear and set the message to trigger screen reader announcement
      regionRef.current.textContent = "";
      // Use setTimeout to ensure the screen reader picks up the change
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className="sr-only"
      aria-label="Live region for dynamic content updates"
    />
  );
}