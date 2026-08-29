"use client";

import { registerGalleonSourceTools } from "@galleon/publisher-sdk";
import { useEffect, useState } from "react";

export function WebMcpTools() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let dispose: (() => Promise<void>) | undefined;

    void registerGalleonSourceTools().then((registration) => {
      dispose = registration.dispose;
      if (active) {
        setSupported(registration.supported);
      }
    });

    return () => {
      active = false;
      void dispose?.();
    };
  }, []);

  return (
    <span className="webmcp-state" data-supported={supported ?? "checking"}>
      {supported === true
        ? "Site tools available"
        : supported === false
          ? "Open in a WebMCP browser"
          : "Checking site tools"}
    </span>
  );
}
