"use client";

import { useEffect, useRef } from "react";

export function MeteorEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes meteor-fall {
        0% { 
          transform: translateX(0) translateY(0) rotate(var(--angle)); 
          opacity: 1;
        }
        70% { opacity: 1; }
        100% { 
          transform: translateX(-100vh) translateY(100vh) rotate(var(--angle)); 
          opacity: 0;
        }
      }
      
      @keyframes meteor-glow {
        0% { box-shadow: 0 0 10px 2px var(--meteor-color); }
        50% { box-shadow: 0 0 20px 4px var(--meteor-color); }
        100% { box-shadow: 0 0 10px 2px var(--meteor-color); }
      }
      
      @keyframes tail-fade {
        0% { width: 0; }
        30% { width: 100px; opacity: 1; }
        100% { width: 150px; opacity: 0; }
      }
      
      .meteor {
        position: absolute;
        width: 2px;
        height: 2px;
        background-color: white;
        border-radius: 50%;
        animation: meteor-fall 6s linear infinite, meteor-glow 2s ease-in-out infinite;
        transform-origin: center;
      }
      
      .meteor-tail {
        position: absolute;
        top: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(to left, transparent, var(--meteor-color));
        animation: tail-fade 2s ease-in-out infinite;
      }
      
      .star {
        position: absolute;
        width: 2px;
        height: 2px;
        background-color: white;
        border-radius: 50%;
        animation: twinkle 3s ease-in-out infinite;
      }
      
      @keyframes twinkle {
        0% { opacity: 0.2; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0.2; transform: scale(0.8); }
      }
    `;
    document.head.appendChild(style);

    const container = containerRef.current;
    if (!container) return;

    const meteorCount = 35;
    const meteors: HTMLDivElement[] = [];

    for (let i = 0; i < meteorCount; i++) {
      const meteor = document.createElement("div");
      meteor.classList.add("meteor");

      const tail = document.createElement("div");
      tail.classList.add("meteor-tail");
      meteor.appendChild(tail);

      container.appendChild(meteor);
      meteors.push(meteor);
    }

    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.classList.add("star");
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.opacity = `${0.2 + Math.random() * 0.8}`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(star);
    }

    const animateMeteors = () => {
      meteors.forEach((meteor) => {
        const scale = 0.5 + Math.random() * 1;
        const opacity = 0.6 + Math.random() * 0.4;

        const delay = Math.random() * 15;
        const duration = 2 + Math.random() * 6;
        const top = Math.random() * 80;
        const left = 20 + Math.random() * 80;
        const angle = -15 - Math.random() * 35;

        meteor.style.opacity = `${opacity}`;
        meteor.style.transform = `scale(${scale})`;
        meteor.style.top = `${top}%`;
        meteor.style.left = `${left}%`;
        meteor.style.setProperty("--angle", `${angle}deg`);
        meteor.style.animationDelay = `${delay}s`;
        meteor.style.animationDuration = `${duration}s`;

        const hue = Math.floor(Math.random() * 60) + 200;
        meteor.style.setProperty(
          "--meteor-color",
          `hsla(${hue}, 80%, 70%, ${opacity})`
        );
      });
    };

    animateMeteors();

    const handleMouseMove = (e: MouseEvent) => {
      // Create meteor burst at cursor position
      const randomMeteors = meteors.slice(0, 5);
      randomMeteors.forEach((meteor, index) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        meteor.style.top = `${y}%`;
        meteor.style.left = `${x}%`;
        meteor.style.animationName = "none";

        setTimeout(() => {
          meteor.style.animationName = "meteor-fall, meteor-glow";
        }, index * 100);
      });
    };

    container.addEventListener("mousemove", handleMouseMove);

    const interval = setInterval(animateMeteors, 8000);

    return () => {
      clearInterval(interval);
      container.removeEventListener("mousemove", handleMouseMove);
      meteors.forEach((meteor) => meteor.remove());
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="meteor-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10,
        background: "transparent",
      }}
    />
  );
}
