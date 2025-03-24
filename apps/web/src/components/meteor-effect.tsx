"use client";

import { useEffect, useRef } from "react";

export function MeteorEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create meteors
    const meteorCount = 20;
    const meteors: HTMLDivElement[] = [];

    for (let i = 0; i < meteorCount; i++) {
      const meteor = document.createElement("div");
      meteor.classList.add("meteor");
      container.appendChild(meteor);
      meteors.push(meteor);
    }

    // Animate meteors
    const animateMeteors = () => {
      meteors.forEach((meteor, index) => {
        // Reset meteor position
        const delay = Math.random() * 10;
        const duration = 3 + Math.random() * 4;
        const top = Math.random() * 90;
        const left = 30 + Math.random() * 70;
        const angle = -15 - Math.random() * 30; // Between -15 and -45 degrees

        meteor.style.top = `${top}%`;
        meteor.style.left = `${left}%`;
        meteor.style.setProperty("--angle", `${angle}deg`);
        meteor.style.animationDelay = `${delay}s`;
        meteor.style.animationDuration = `${duration}s`;
      });
    };

    animateMeteors();
    const interval = setInterval(animateMeteors, 10000);

    return () => {
      clearInterval(interval);
      meteors.forEach((meteor) => meteor.remove());
    };
  }, []);

  return <div ref={containerRef} className="meteor-container" />;
}
