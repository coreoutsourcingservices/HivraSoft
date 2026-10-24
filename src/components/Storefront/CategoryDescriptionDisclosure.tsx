"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function CategoryDescriptionDisclosure({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(168);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      const style = getComputedStyle(content);
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
      const height = Math.ceil(lineHeight * 6);
      setPreviewHeight(height);
      setHasMore(content.scrollHeight > height + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [children]);

  return <section className="mx-auto w-full max-w-[960px] px-6 py-8 sm:px-8">
    <div id={contentId} ref={contentRef} style={expanded ? undefined : { maxHeight: previewHeight, overflow: "hidden" }}>
      {children}
    </div>
    {hasMore && <div className="mt-4 flex justify-center">
      <button type="button" aria-controls={contentId} aria-expanded={expanded}
        className="rounded-lg border border-black/15 bg-white px-6 py-3 text-sm font-semibold text-[#211A18]"
        onClick={() => setExpanded((current) => !current)}>
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>}
  </section>;
}
