import { useEffect, useRef } from "react";

// A projected torus knot drawn locally in 2D: no WebGL, models, or CDN.
export default function NeuralField({ paused = false, active = false }) {
  const canvas = useRef(null);
  const flags = useRef({ paused, active });
  useEffect(() => {
    flags.current = { paused, active };
  }, [paused, active]);
  useEffect(() => {
    const element = canvas.current;
    const ctx = element.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1,
      height = 1,
      frame,
      rotation = 0,
      previous = 0;
    const pointer = { x: 0, y: 0 };
    let target = { x: 0, y: 0 },
      visible = true,
      inViewport = true,
      dirty = true;
    const points = [];
    const slices = 155,
      strands = 25;
    for (let i = 0; i < slices; i++) {
      const t = (i / slices) * Math.PI * 2;
      const radius = 1.75 + 0.55 * Math.cos(3 * t);
      const center = [
        radius * Math.cos(2 * t),
        radius * Math.sin(2 * t),
        0.65 * Math.sin(3 * t),
      ];
      for (let j = 0; j < strands; j++) {
        const a = (j / strands) * Math.PI * 2;
        const tube = 0.25 + 0.06 * Math.cos(3 * t);
        points.push({
          x: center[0] + tube * Math.cos(a) * Math.cos(2 * t),
          y: center[1] + tube * Math.cos(a) * Math.sin(2 * t),
          z: center[2] + tube * Math.sin(a),
          warm: i > 97 && i < 120,
        });
      }
    }
    const draw = (time = 0) => {
      const moving =
        !flags.current.paused && !reduceMotion.matches && visible && inViewport;
      if ((moving && time - previous >= 32) || dirty || !previous) {
        if (moving) rotation += 0.002;
        pointer.x += (target.x - pointer.x) * 0.035;
        pointer.y += (target.y - pointer.y) * 0.035;
        ctx.clearRect(0, 0, width, height);
        const scale = Math.min(width, height) * 0.155;
        const rx = 0.65 + pointer.y * 0.12,
          ry = -0.42 + rotation + pointer.x * 0.18,
          rz = -0.42;
        const projected = points
          .map((p) => {
            const x1 = p.x * Math.cos(ry) + p.z * Math.sin(ry);
            const z1 = -p.x * Math.sin(ry) + p.z * Math.cos(ry);
            const y1 = p.y * Math.cos(rx) - z1 * Math.sin(rx);
            const z2 = p.y * Math.sin(rx) + z1 * Math.cos(rx);
            const x2 = x1 * Math.cos(rz) - y1 * Math.sin(rz);
            const y2 = x1 * Math.sin(rz) + y1 * Math.cos(rz);
            const perspective = 7 / (7 - z2);
            return {
              x: width * 0.5 + x2 * scale * perspective,
              y: height * 0.49 + y2 * scale * perspective,
              z: z2,
              perspective,
              warm: p.warm,
            };
          })
          .sort((a, b) => a.z - b.z);
        projected.forEach((p) => {
          const opacity = Math.max(0.12, Math.min(0.95, (p.z + 3.5) / 6));
          ctx.fillStyle = p.warm
            ? `rgba(255,173,111,${opacity})`
            : `rgba(143,222,246,${opacity})`;
          ctx.beginPath();
          ctx.arc(
            p.x,
            p.y,
            (flags.current.active ? 1.2 : 0.95) * p.perspective,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        });
        previous = time;
        dirty = false;
      }
      frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const box = element.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const dpr = Math.min(devicePixelRatio || 1, 1.75);
      element.width = width * dpr;
      element.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      previous = 0;
      dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const intersection = new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
    });
    intersection.observe(element);
    const move = (event) => {
      if (reduceMotion.matches || flags.current.paused) return;
      const box = element.getBoundingClientRect();
      target = {
        x: (event.clientX - box.left) / box.width - 0.5,
        y: (event.clientY - box.top) / box.height - 0.5,
      };
    };
    const visibility = () => {
      visible = !document.hidden;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return <canvas ref={canvas} className="neural-canvas" aria-hidden="true" />;
}
