"use client";

import dynamic from "next/dynamic";

export const ParticlesBackground = dynamic(
  () =>
    import("@/components/particles-canvas").then((mod) => mod.ParticlesCanvas),
  { ssr: false },
);
