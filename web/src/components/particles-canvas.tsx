"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "next-themes";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

async function initParticles(engine: Engine) {
  await loadSlim(engine);
}

export function ParticlesCanvas() {
  const { resolvedTheme } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const isDark = resolvedTheme !== "light";
  const color = isDark ? "#d4d4d8" : "#71717a";

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: true, zIndex: 0 },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: true, mode: "grab" },
          onClick: { enable: false },
          resize: { enable: true },
        },
        modes: {
          grab: {
            distance: 140,
            links: { opacity: 0.45 },
          },
        },
      },
      particles: {
        color: { value: color },
        links: {
          color,
          distance: 150,
          enable: true,
          opacity: isDark ? 0.28 : 0.2,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "out" },
          speed: 1.4,
        },
        number: {
          density: { enable: true },
          value: 70,
        },
        opacity: {
          value: isDark ? 0.45 : 0.35,
        },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
    }),
    [color, isDark],
  );

  if (reduceMotion) {
    return null;
  }

  return (
    <ParticlesProvider init={initParticles}>
      <Particles
        id="sentinel-particles"
        className="pointer-events-none"
        options={options}
      />
    </ParticlesProvider>
  );
}
