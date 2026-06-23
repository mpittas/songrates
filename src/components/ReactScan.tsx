"use client";

import { scan } from "react-scan";
import { useEffect } from "react";

export default function ReactScan() {
  useEffect(() => {
    scan({
      enabled: true,
      log: true,
      trackUnnecessaryRenders: true,
      showToolbar: true,
    });
  }, []);

  return null;
}
