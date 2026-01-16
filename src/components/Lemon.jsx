import { useEffect, useRef } from "react";
import walkSheet from "../assets/lemon_walk_2.png";

export default function Lemon() {
  const FRAME_W = 32;
  const FRAME_H = 32;
  const FRAMES = 6;
  const FPS = 10;

  const SCALE = 3;
  const SPEED = 70;
  const TURN_EVERY_MS = 1200;

  const wrapRef = useRef(null);
  const flipRef = useRef(null);
  const spriteRef = useRef(null);

  const pos = useRef({ x: 40, y: 120 });
  const vel = useRef({ vx: 1, vy: 0 });
  const rafRef = useRef(0);

  // random direction changes
  useEffect(() => {
    const t = setInterval(() => {
      const a = Math.random() * Math.PI * 2;
      vel.current.vx = Math.cos(a);
      vel.current.vy = Math.sin(a);
    }, TURN_EVERY_MS);

    return () => clearInterval(t);
  }, []);

  // movement loop
  useEffect(() => {
    let last = performance.now();

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const sizeW = FRAME_W * SCALE;
      const sizeH = FRAME_H * SCALE;

      let nx = pos.current.x + vel.current.vx * SPEED * dt;
      let ny = pos.current.y + vel.current.vy * SPEED * dt;

      if (nx < 0) { nx = 0; vel.current.vx *= -1; }
      if (ny < 0) { ny = 0; vel.current.vy *= -1; }
      if (nx > w - sizeW) { nx = w - sizeW; vel.current.vx *= -1; }
      if (ny > h - sizeH) { ny = h - sizeH; vel.current.vy *= -1; }

      pos.current.x = nx;
      pos.current.y = ny;

      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
      }

      if (flipRef.current) {
        flipRef.current.style.transform = vel.current.vx < 0 ? "scaleX(-1)" : "scaleX(1)";
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="lemonWrap"
      style={{
        width: FRAME_W * SCALE,
        height: FRAME_H * SCALE,
      }}
    >
      <div ref={flipRef} className="lemonFlip">
        <div
          ref={spriteRef}
          className="lemonSprite"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            backgroundImage: `url(${walkSheet})`,
            backgroundSize: `${FRAME_W * FRAMES}px ${FRAME_H}px`,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            "--frame-w": `${FRAME_W}px`,
            "--frames": FRAMES,
            "--fps": FPS,
          }}
        />
      </div>
    </div>
  );
}
