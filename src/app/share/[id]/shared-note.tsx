"use client";

import DOMPurify from "dompurify";
import { useEffect, useState } from "react";

/** Renders shared note HTML after client-side sanitization. */
export function SharedNote({ html }: { html: string }) {
  const [clean, setClean] = useState<string | null>(null);

  useEffect(() => {
    setClean(DOMPurify.sanitize(html));
  }, [html]);

  if (clean === null) {
    return (
      <div className="space-y-3">
        <div className="h-7 w-1/2 animate-pulse-soft rounded-lg bg-muted" />
        <div className="h-4 w-full animate-pulse-soft rounded-md bg-muted" />
        <div className="h-4 w-5/6 animate-pulse-soft rounded-md bg-muted" />
      </div>
    );
  }

  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: clean }} />;
}
