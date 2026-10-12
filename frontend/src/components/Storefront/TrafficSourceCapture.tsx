"use client";

import { useEffect } from "react";
import { captureTrafficSource } from "@/lib/traffic-source";

export default function TrafficSourceCapture() {
  useEffect(() => {
    captureTrafficSource();
  }, []);

  return null;
}
