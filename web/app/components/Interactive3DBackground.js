"use client";

import { useEffect, useRef } from "react";

export default function Interactive3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const particles = Array.from({ length: 55 }, (_, i) => ({
      x: (Math.random() - 0.5) * width * 1.6,
      y: (Math.random() - 0.5) * height * 1.6,
      z: Math.random() * 900 + 100,
      size: Math.random() * 2.4 + 0.8,
      speedZ: Math.random() * 1.6 + 0.45,
      color:
        i % 3 === 0
          ? "rgba(220, 38, 38, 0.85)"
          : i % 3 === 1
            ? "rgba(248, 250, 252, 0.65)"
            : "rgba(161, 161, 170, 0.5)"
    }));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
      const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
      if (typeof clientX === "number" && typeof clientY === "number") {
        mouse.targetX = clientX;
        mouse.targetY = clientY;
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    let tick = 0;

    const render = () => {
      tick += 0.012;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const offsetX = (mouse.x - width / 2) * 0.08;
      const offsetY = (mouse.y - height / 2) * 0.08;

      // Spotlight dinámico rojo/gris siguiendo el cursor
      const grad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        20,
        mouse.x,
        mouse.y,
        Math.max(width, height) * 0.45
      );
      grad.addColorStop(0, "rgba(220, 38, 38, 0.13)");
      grad.addColorStop(0.45, "rgba(39, 39, 42, 0.08)");
      grad.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Rejilla de perspectiva 3D inferior estilo túnel automotriz
      const horizonY = height * 0.68 + offsetY * 0.35;
      ctx.save();
      ctx.strokeStyle = "rgba(220, 38, 38, 0.14)";
      ctx.lineWidth = 1;

      const numLines = 14;
      for (let i = -numLines; i <= numLines; i++) {
        const startX = width / 2 + i * 42 + offsetX * 0.5;
        const endX = width / 2 + i * 240 + offsetX * 1.8;
        ctx.beginPath();
        ctx.moveTo(startX, horizonY);
        ctx.lineTo(endX, height + 40);
        ctx.stroke();
      }

      for (let j = 0; j < 7; j++) {
        const progress = ((j / 7 + (tick * 0.35) % (1 / 7)) % 1);
        const y = horizonY + Math.pow(progress, 2.1) * (height - horizonY + 20);
        ctx.strokeStyle = `rgba(161, 161, 170, ${0.04 + progress * 0.14})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Partículas 3D con proyección de profundidad
      const fov = 420;
      for (const p of particles) {
        p.z -= p.speedZ;
        if (p.z <= 20) {
          p.z = 950;
          p.x = (Math.random() - 0.5) * width * 1.6;
          p.y = (Math.random() - 0.5) * height * 1.6;
        }

        const scale = fov / (fov + p.z);
        const projX = width / 2 + (p.x - offsetX * 2.2) * scale;
        const projY = height / 2 + (p.y - offsetY * 2.2) * scale;
        const radius = Math.max(0.6, p.size * scale * 2.1);

        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.arc(projX, projY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90"
    />
  );
}
