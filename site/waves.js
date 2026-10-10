// 2D wave interference: a few point sources just outside the edges,
// their ripples cross in the middle. Drawn as iso-lines (marching squares).
(() => {
  const canvas = document.querySelector('canvas.bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CELL = 11;            // grid cell in CSS px
  const LEVELS = [-1.1, -0.35, 0.35, 1.1];
  // sources: position as a fraction of the viewport (can sit outside), wavelength px, speed, amplitude
  const SRC = [
    { x: 1.10, y: 0.15, wl: 190, sp: 0.45, a: 1.0 },
    { x: -0.12, y: 0.55, wl: 230, sp: 0.36, a: 0.75 },
    { x: 0.55, y: -0.25, wl: 160, sp: 0.52, a: 0.55 },
  ];

  let W, H, cols, rows, field, dpr;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
    field = new Float32Array(cols * rows);
  }

  function compute(t) {
    const src = SRC.map(s => ({ x: s.x * W, y: s.y * H, k: (2 * Math.PI) / s.wl, w: s.sp, a: s.a }));
    for (let j = 0; j < rows; j++) {
      const y = j * CELL;
      for (let i = 0; i < cols; i++) {
        const x = i * CELL;
        let v = 0;
        for (const s of src) {
          const d = Math.hypot(x - s.x, y - s.y);
          v += s.a * Math.sin(d * s.k - t * s.w) / (1 + d / (0.9 * Math.max(W, H)));
        }
        field[j * cols + i] = v;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const lerp = (a, b, l) => (l - a) / (b - a);
    for (const L of LEVELS) {
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i], b = field[j * cols + i + 1];
          const c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
          const idx = (a > L) | ((b > L) << 1) | ((c > L) << 2) | ((d > L) << 3);
          if (idx === 0 || idx === 15) continue;
          const x = i * CELL, y = j * CELL;
          const top = [x + CELL * lerp(a, b, L), y];
          const right = [x + CELL, y + CELL * lerp(b, c, L)];
          const bottom = [x + CELL * lerp(d, c, L), y + CELL];
          const left = [x, y + CELL * lerp(a, d, L)];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(left, top); break;
            case 2: case 13: seg(top, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(right, bottom); break;
            case 5: seg(left, top); seg(right, bottom); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, bottom); break;
            case 10: seg(top, right); seg(left, bottom); break;
          }
        }
      }
    }
    ctx.stroke();
  }

  let last = 0, t = 0;
  function frame(now) {
    if (now - last > 50) {            // ~20 fps is plenty for a slow swell
      t += (now - last) / 1000;
      last = now;
      compute(t);
      draw();
    }
    requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', () => { resize(); compute(t); draw(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  compute(0);
  draw();
  if (!reduced) requestAnimationFrame(frame);
})();
