"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { TabsContent } from "@/components/ui/tabs";

interface LazyTabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  /** When true, children mount immediately (e.g. default tab). */
  eager?: boolean;
}

/**
 * Defers mounting tab children until the tab is first activated.
 * Preserves Radix tab behavior and UI; only delays heavy client subtrees.
 */
export function LazyTabsContent({
  value,
  children,
  className,
  eager = false,
}: LazyTabsContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(eager);

  useEffect(() => {
    if (eager || shouldRender) {
      return;
    }

    const el = ref.current;
    if (!el) {
      return;
    }

    const activateIfVisible = () => {
      if (el.getAttribute("data-state") === "active") {
        setShouldRender(true);
      }
    };

    activateIfVisible();

    const observer = new MutationObserver(activateIfVisible);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["data-state"],
    });

    return () => observer.disconnect();
  }, [eager, shouldRender]);

  return (
    <TabsContent ref={ref} value={value} className={className}>
      {shouldRender ? children : null}
    </TabsContent>
  );
}
